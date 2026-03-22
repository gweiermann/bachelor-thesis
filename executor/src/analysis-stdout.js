import split2 from 'split2'

const TERMINAL_TYPES = ['error', 'user-error', 'compilation-error', 'result']

/**
 * Pipe stdout through JSONL parsing. Terminal payloads are delivered via onTerminal.
 * Does not listen for stream close — wire that next to stderr collection in the caller.
 * @param {import('node:stream').Readable} stdout
 * @param {{
 *   onStatus?: (message: string) => void
 *   onNonJsonLine?: (line: string) => void
 *   onTerminal?: (data: object) => void
 * }} handlers
 */
export function pipeAnalysisJsonLines(stdout, { onStatus, onNonJsonLine, onTerminal }) {
    stdout.pipe(split2()).on('data', (chunk) => {
        const line = String(chunk)
        if (!line.trim()) {
            return
        }
        try {
            const data = JSON.parse(line)
            if (data.type === 'status') {
                onStatus?.(data.message)
            } else if (TERMINAL_TYPES.includes(data.type)) {
                onTerminal?.(data)
            } else {
                throw new Error('Invalid message type')
            }
        } catch {
            onNonJsonLine?.(line)
        }
    })
}
