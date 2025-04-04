import { WebSocketServer } from 'ws'
import path from 'node:path'
import { spawn } from 'node:child_process'
import stream from 'node:stream'
import split2 from 'split2'

const wss = new WebSocketServer({ port: 80 });

const maxConnections = 5;
let connections = 0;

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
            let taskName, code
            try {
                const message = JSON.parse(dataStr);
                taskName = message.taskName
                code = message.code
                if (!taskName || !code) {
                    throw ({
                        type: 'badRequest',
                        message: 'Missing property taskName or code'
                    })
                }
            } catch(e) {
                console.error('Invalid request received', dataStr)
                throw ({
                    type: 'error',
                    errorType: 'badRequest',
                    errorMessage: 'There seems to be a problem with your request. Please try again later.'
                })
            }

            taskIsRunning = true
            const result = await runAnalysis(taskName, code, message => {
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


function runAnalysis(taskName, code, onStatusUpdate) {
    return new Promise((resolve, reject) => {
        const param = {
            code,
            config: {
                functionName: 'bubbleSort',
                collect: [
                    {
                        type: 'arrayWatcher',
                        parameters: {
                            name: 'arr',
                            size: 'n',
                        },
                        key: 'array'
                    },
                    {
                        type: 'currentLine',
                        key: 'line'
                    },
                    {
                        type: 'currentScope',
                        key: 'scope'
                    }
                ],
                postProcess: [
                    {
                        type: 'skipInterSwappingSteps',
                        parameters: {
                            array: 'array'
                        },
                        key: 'skippedStep'
                    },
                    {
                        type: 'keepTrackOfItems',
                        parameters: {
                            array: 'array'
                        },
                        key: 'event'
                    }
                ]
            }
        }

        const child = spawn(
            'docker', ['run', '--rm', '-i', 'registry:5000/task-runner-worker', 'analyse', JSON.stringify(param), taskName],
            { cwd: path.join(process.cwd(), './analysis')}
        );

        let stderr = ''
        child.stderr.on('data', data => stderr += data.toString('utf-8'))

        child.stdout
            .pipe(split2())
            .on('data', line => {
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

        const codeStream = new stream.Readable();
        codeStream.push(code);
        codeStream.push(null);
        codeStream.pipe(child.stdin);
    });
}