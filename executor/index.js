import fs from 'node:fs/promises'
import { constants as fsConstants } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFile, spawn } from 'node:child_process'
import { promisify } from 'node:util'
import split2 from 'split2'
import express from 'express'
import bodyparser from 'body-parser'

// -- Custom Restrictions (for "security") --

const containerRestrictions = [
    '--network=none', // No network access
    '--cap-drop=ALL', // Drop all capabilities
    '--security-opt=no-new-privileges', // No new privileges
    '-m=64m', // Memory limit of 64MB
    '--cpus=1', // Limit to 100% of a CPU
    '--read-only', // Read-only filesystem
    '--tmpfs=/tmp:rw,exec', // Temporary filesystem for /tmp
    '--ulimit', 'nproc=40:40', // Limit processes to 40 to prevent fork bombs
    '--ulimit', 'nofile=40:40', // Limit open files to 40
]

const codeSizeLimit = 1024 * 1024; // 1MB



// ------ other settings -----------------
const maxConnections = 5;
// ---------------------------------------


const app = express()
app.use(bodyparser.json())

let connections = 0;

// environment variables
const isDebugMode = process.env.DEBUG === 'true' || process.env.DEBUG === '1'
const dockerImage = process.env.ANALYSIS_DOCKER_IMAGE

const execFileAsync = promisify(execFile)

function getCollectorExtensionsRoot() {
    if (process.env.COLLECTOR_EXTENSIONS_PATH) {
        return path.resolve(process.cwd(), process.env.COLLECTOR_EXTENSIONS_PATH)
    }
    return path.join(process.cwd(), 'collector-extensions')
}

/**
 * Stage collector-extensions + preset.json + code.json, then gzip-tar the tree for stdin.
 * Throws if the extensions directory or register_extensions.py is missing, or if packing fails.
 */
async function buildRunBundleTarball(extensionsRoot, preset, code) {
    let st
    try {
        st = await fs.stat(extensionsRoot)
    } catch (e) {
        if (e?.code === 'ENOENT') {
            throw new Error(`Collector extensions directory missing or not a directory: ${extensionsRoot}`)
        }
        throw e
    }
    if (!st.isDirectory()) {
        throw new Error(`Collector extensions directory missing or not a directory: ${extensionsRoot}`)
    }

    const reg = path.join(extensionsRoot, 'register_extensions.py')
    try {
        await fs.access(reg, fsConstants.F_OK)
    } catch {
        throw new Error(`register_extensions.py missing in ${extensionsRoot}`)
    }

    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'analysis-bundle-'))
    try {
        await fs.cp(extensionsRoot, tmp, { recursive: true })
        await fs.writeFile(path.join(tmp, 'preset.json'), JSON.stringify(preset), 'utf8')
        await fs.writeFile(path.join(tmp, 'code.json'), JSON.stringify(code), 'utf8')

        const { stdout } = await execFileAsync('tar', ['-czf', '-', '-C', tmp, '.'], {
            maxBuffer: 20 * 1024 * 1024,
        })
        return stdout
    } finally {
        await fs.rm(tmp, { recursive: true, force: true })
    }
}

app.post('/build', async (req, res) => {
    if (connections >= maxConnections) {
        res.status(503).json({
            ok: false,
            error: 'Server is exhausted at the moment. Please try again later.'
        })
        return
    }

    const clientRequest = req.body;

    if (clientRequest.code.length > codeSizeLimit) {
        res.status(413).json({
            ok: false,
            error: 'Your request is too large. Please reduce the size of your code and try again.'
        })
        return 
    }

    connections++

    const sendJson = data => {
        res.write(JSON.stringify(data) + '\n')
    }

    console.log('New connection established. Current connections:', connections)

    try {
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Transfer-Encoding', 'chunked')
        res.flushHeaders()
        const result = await runBuild(clientRequest.type, clientRequest.presetName, clientRequest.code, message => {
            sendJson({
                type: 'status',
                message
            })
        })
        sendJson(result)
    } catch (e) {
        if ('type' in e) {
            sendJson({
                type: 'error',
                errorType: e.type,
                message: e.message
            })
        } else {
            console.error(e)
            sendJson({
                type: 'error',
                errorType: 'internalServerError',
                message: e.message
            })
        }
    }
    res.end()
    connections--
})

let idCounter = 0;

function debug(id, msg) {
    if (isDebugMode) {
        console.log(`[${id}] ${msg}`)
    }
}

function debugError(id, msg, force = false) {
    if (isDebugMode || force) {
        console.error(`[${id}] ${msg}`)
    }
}

async function getConfig(presetName) {
    return await fetch(`http://preset-db/config/${presetName}`).then(res => res.json()).then(data => {
        if (!data.ok) {
            throw new Error(data.error)
        }
        return data.data
    })
}

async function runBuild(type, presetName, code, onStatusUpdate) {
    const id = String(idCounter++).padStart(3, '0')
    debug(id, `Starting build process. Type: ${type}, Preset: ${presetName}`)

    if (!dockerImage) {
        throw new Error('ANALYSIS_DOCKER_IMAGE is not set')
    }

    const config = await getConfig(presetName)
    if (!config) {
        debugError(id, `Preset '${presetName}' not found`)
        throw new Error(`Preset '${presetName}' not found`)
    }

    const extensionsRoot = getCollectorExtensionsRoot()
    let tarball
    try {
        tarball = await buildRunBundleTarball(extensionsRoot, config, code)
    } catch (e) {
        debugError(id, `Failed to build run bundle tarball: ${e.message}`, true)
        throw e
    }

    const dockerArgs = [
        'run',
        '--rm',
        '-i',
        ...containerRestrictions,
        dockerImage,
        '--extensions-from-stdin',
        type,
    ]

    return new Promise((resolve, reject) => {
        const child = spawn('docker', dockerArgs, {
            cwd: path.join(process.cwd()),
            stdio: ['pipe', 'pipe', 'pipe'],
        })

        child.stdin.write(tarball)
        child.stdin.end()

        let stderr = ''
        child.stderr.on('data', data => {
            stderr += data.toString('utf-8')
            debugError(id, `${data.toString('utf-8')}`)
        })

        child.stdout
            .pipe(split2())
            .on('data', line => {
                // debug(id, line)
                if (!line.trim()) {
                    return
                }
                try {
                    const data = JSON.parse(line)
                    if (data.type === 'status') {
                        onStatusUpdate?.(data.message)
                    }
                    else if (['error', 'user-error', 'compilation-error', 'result'].includes(data.type)) {
                        resolve(data)
                        return
                    }
                    else {
                        throw new Error('Invalid message type')
                    }
                }
                catch(e) {
                    debug(id, line)
                    // it's ok, most probably just debug information
                    // console.error('Invalid process message received', line.toString('utf-8'))
                    // reject(new Error('Received invalid message from build process.'))
                }
            })

        child.stdout.on('close', () => {
            // Will only trigger if resolve haven't been called yet
            reject(new Error('Process closed unexpectedly: ' + stderr))
        })
    }).catch(e => {
        debugError(id, 'Build process failed: ' + e.message)
        throw e
    })
}

app.listen(80, () => {
    console.log('Server is running on port 80')
})