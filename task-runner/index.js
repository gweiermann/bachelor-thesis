import { WebSocketServer } from 'ws'
import path from 'node:path'
import { execFile } from 'node:child_process'
import stream from 'node:stream'

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
            const result = await runAnalysis(taskName, code, status => {
                ws.send(JSON.stringify({
                    type: 'status',
                    status
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
                    errorMessage: e.message
                }))
            }
            else {
                console.error(e)
                ws.send(JSON.stringify({
                    type: 'error',
                    errorType: 'internalServerError',
                    errorMessage: e.message
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
        const child = execFile(
            'docker', ['run', '--rm', '-i', 'worker', taskName],
            { cwd: path.join(process.cwd(), './analysis')},
            (err, stdout, stderr) => {
                if (err) {
                    console.log('stdout', stdout)
                    reject(err)
                }

                try {
                    const result = JSON.parse(stdout)
                    resolve(result)
                } catch (e) {
                    reject(`Invalid response from code analysis: ${stdout}`)
                }
        });

        var codeStream = new stream.Readable();
        codeStream.push(code);
        codeStream.push(null);
        codeStream.pipe(child.stdin);
    });
}