import path from 'node:path'
import { spawn } from 'node:child_process'
import split2 from 'split2'
import express from 'express'
import bodyparser from 'body-parser'
import cors from 'cors'
import { getTemplate } from './get-template.js'

// -- Custom Restrictions (for "security") --

const containerRestrictions = [
    '--network=none', // No network access
    '--cap-drop=ALL', // Drop all capabilities
    '--security-opt=no-new-privileges', // No new privileges
    '-m=32m', // Memory limit of 32MB
    '--cpus=1', // Limit to 100% of a CPU
    '--read-only', // Read-only filesystem
    '--tmpfs=/tmp:rw,exec', // Temporary filesystem for /tmp
    '--ulimit', 'nproc=20:20', // Limit processes to 20 to prevent fork bombs
    '--ulimit', 'nofile=20:20', // Limit open files to 20
]

const codeSizeLimit = 1024 * 1024; // 1MB



// ------ other settings -----------------
const maxConnections = 5;

// ---------------------------------------


const app = express()
app.use(bodyparser.json())
app.use(cors())

let connections = 0;

const isDebugMode = process.env.DEBUG === 'true' || process.env.DEBUG === '1'

app.get('/template/:taskId', async (req, res) => {
    const template = await getTemplate(req.params.taskId)
    if (!template) {
        res.status(404).json({ ok: false, error: `Template '${req.params.taskId}' not found` })
        return
    }
    res.json({ ok: true, data: template })
})

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

function runBuild(type, presetName, code, onStatusUpdate) {
    const id = String(idCounter++).padStart(3, '0')
    debug(id, `Starting build process. Type: ${type}, Preset: ${presetName}`)

    return new Promise((resolve, reject) => {
        const child = spawn(
            'docker', ['run', '--rm', '-i', '-v', 'task-config:/config', ...containerRestrictions, 'registry:5000/task-runner-worker', type, presetName, JSON.stringify(code)],
            { cwd: path.join(process.cwd())}
        );

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