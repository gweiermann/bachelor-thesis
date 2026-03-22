import { isDebugMode } from './config.js'

let idCounter = 0

function nextRunId() {
    return String(idCounter++).padStart(3, '0')
}

/**
 * Scoped logger for one analysis run (prefix + debug gating). Assigns a new run id per call.
 */
export function createRunLogger() {
    const runId = nextRunId()
    return {
        id: runId,
        info(msg) {
            if (isDebugMode) {
                console.log(`[${runId}] ${msg}`)
            }
        },
        err(msg, force = false) {
            if (isDebugMode || force) {
                console.error(`[${runId}] ${msg}`)
            }
        },
    }
}
