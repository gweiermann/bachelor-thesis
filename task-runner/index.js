import { WebSocketServer } from 'ws'
import path from 'node:path'
import { spawn } from 'node:child_process'
import split2 from 'split2'

const wss = new WebSocketServer({ port: 80 });

const maxConnections = 5;
let connections = 0;

const isDebugMode = process.env.DEBUG === 'true' || process.env.DEBUG === '1'

wss.on('connection', ws => {
    if (connections >= maxConnections) {
        ws.send(JSON.stringify({
            type: 'error',
            errorType: 'unavailable',
            errorMessage: 'Server is exhausted at the moment. Please try again later.'
        }))
        ws.close()
        return
    }
    connections++

    let taskIsRunning = false

    ws.on('error', console.error)

    ws.on('message', async data => {
        try {
            if (taskIsRunning) {
                throw ({
                    type: 'badRequest',
                    message: 'There is already a task running. Please wait for it to finish.'
                })
            }
    
            const dataStr = data.toString('utf-8')
            let config
            try {
                config = JSON.parse(dataStr);
            } catch(e) {
                console.error('Invalid request received', dataStr)
                throw ({
                    type: 'error',
                    errorType: 'badRequest',
                    errorMessage: 'There seems to be a problem with your request. Please try again later.'
                })
            }

            taskIsRunning = true
            const result = await runBuild(config.type, config.presetName, config.functionBodies, message => {
                ws.send(JSON.stringify({
                    type: 'status',
                    message
                }))
            })
            ws.send(JSON.stringify({
                type: 'result',
                result
            }))
        } catch(e) {
            if ('type' in e) {
                ws.send(JSON.stringify({
                    type: 'error',
                    errorType: e.type,
                    message: e.message
                }))
            }
            else {
                console.error(e)
                ws.send(JSON.stringify({
                    type: 'error',
                    errorType: 'internalServerError',
                    message: e.message
                }))
            }
        }
        ws.close()        
    });

    ws.on('close', () => {
        connections--
    });
});

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

function runBuild(type, presetName, functionBodies, onStatusUpdate) {
    const id = String(idCounter++).padStart(3, '0')
    debug(id, `Starting build process. Type: ${type}, Preset: ${presetName}`)

    return new Promise((resolve, reject) => {
        const child = spawn(
            'docker', ['run', '--rm', '-i', '-v', 'task-config:/config', 'registry:5000/task-runner-worker', type, presetName, ...functionBodies.map(functionBody => JSON.stringify(functionBody))],
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
                debug(id, line)
                if (!line.trim()) {
                    return
                }
                try {
                    const data = JSON.parse(line)
                    if (data.type === 'status') {
                        onStatusUpdate?.(data.message)
                    }
                    else if (data.type === 'error') {
                        reject(new Error(data.message))
                        return
                    }
                    else if (data.type === 'result') {
                        resolve(data.result)
                        return
                    }
                    else {
                        throw new Error('Invalid message type')
                    }
                }
                catch(e) {
                    console.error('Invalid process message received', line.toString('utf-8'))
                    reject(new Error('Received invalid message from build process.'))
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