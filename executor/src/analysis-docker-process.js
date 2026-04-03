/**
 * Rich error from the docker analysis child (stdin pipe, early exit, etc.).
 * Used so one `.catch` can log kind + stderr together.
 */
export class AnalysisProcessError extends Error {
    /**
     * @param {'stdin' | 'stdin_sync' | 'stdout_closed'} kind
     * @param {string} message
     * @param {{ stderr?: string, cause?: Error }} [options]
     */
    constructor(kind, message, options = {}) {
        super(message)
        this.name = 'AnalysisProcessError'
        this.kind = kind
        this.stderr = options.stderr ?? ''
        if (options.cause) {
            this.cause = options.cause
        }
    }
}

/**
 * Wire stderr capture, stdin error handling, stdout close (no terminal line), and stdin write.
 * Call `onError` with {@link AnalysisProcessError}; Promise `reject` is valid as `onError`.
 * @param {import('node:child_process').ChildProcess} child
 * @param {{
 *   onError: (err: AnalysisProcessError) => void
 *   logStderr?: (chunk: string) => void
 * }} options
 */
export function handleProcess(child, { onError, logStderr }) {
    let stderr = ''

    child.stderr.on('data', (data) => {
        const chunk = data.toString('utf-8')
        stderr += chunk
        logStderr?.(chunk)
    })

    function fail(kind, message, cause) {
        onError(new AnalysisProcessError(kind, message, { stderr, cause }))
    }

    child.stdin.on('error', (err) => {
        fail(
            'stdin',
            `Failed to send run bundle to the analysis container: ${err.message}`,
            err,
        )
    })

    child.stdout.on('close', () => {
        fail('stdout_closed', `Process closed unexpectedly: ${stderr}`)
    })

    return {
        /**
         * Write the bundle buffer and end stdin. Surfaces sync write failures via `onError`.
         * @param {Buffer} buffer
         */
        writeStdin(buffer) {
            try {
                child.stdin.write(buffer)
                child.stdin.end()
            } catch (err) {
                fail('stdin_sync', err.message, err)
            }
        },
    }
}
