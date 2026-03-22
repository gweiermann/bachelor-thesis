/**
 * Start a chunked JSON response and pass a line writer to the callback.
 * @param {import('express').Response} res
 * @param {(sendJson: (data: unknown) => void) => unknown} fn
 */
export function chunkedJsonStream(res, fn) {
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Transfer-Encoding', 'chunked')
    res.flushHeaders()
    const sendJson = (data) => {
        res.write(JSON.stringify(data) + '\n')
    }
    return fn(sendJson)
}
