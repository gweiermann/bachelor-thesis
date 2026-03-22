import express from 'express'
import bodyparser from 'body-parser'

import { codeSizeLimit, maxConnections } from './config.js'
import { chunkedJsonStream } from './chunked-json-stream.js'
import { runAnalysis } from './run-analysis.js'

let connections = 0

export function createApp() {
    const app = express()
    app.use(bodyparser.json())

    app.post('/build', (req, res) => {
        if (connections >= maxConnections) {
            res.status(503).json({
                ok: false,
                error: 'Server is exhausted at the moment. Please try again later.',
            })
            return
        }

        const clientRequest = req.body

        if (clientRequest.code.length > codeSizeLimit) {
            res.status(413).json({
                ok: false,
                error: 'Your request is too large. Please reduce the size of your code and try again.',
            })
            return
        }

        connections++

        console.log('New connection established. Current connections:', connections)

        Promise.resolve()
            .then(() =>
                chunkedJsonStream(res, (sendJson) =>
                    runAnalysis(
                        clientRequest.type,
                        clientRequest.presetName,
                        clientRequest.code,
                        (message) => sendJson({ type: 'status', message }),
                    )
                        .then((result) => sendJson(result))
                        .catch((e) => {
                            if ('type' in e) {
                                sendJson({
                                    type: 'error',
                                    errorType: e.type,
                                    message: e.message,
                                })
                            } else {
                                console.error(e)
                                sendJson({
                                    type: 'error',
                                    errorType: 'internalServerError',
                                    message: e.message,
                                })
                            }
                        }),
                ),
            )
            .finally(() => {
                res.end()
                connections--
            })
    })

    return app
}

export function startServer(port = 80) {
    const app = createApp()
    return app.listen(port, () => {
        console.log('Server is running on port ' + port)
    })
}
