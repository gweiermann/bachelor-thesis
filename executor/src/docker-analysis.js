import path from 'node:path'
import { spawn } from 'node:child_process'

import { containerRestrictions, dockerImage } from './config.js'

/**
 * Full argv for `docker run …` (image + analysis CLI args).
 * @param {string} type
 */
export function buildDockerArgv(type) {
    return [
        'run',
        '--rm',
        '-i',
        ...containerRestrictions,
        dockerImage,
        '--extensions-from-stdin',
        type,
    ]
}

/**
 * Spawn the analysis Docker container with sandbox flags; stdin is left open for the tarball.
 * @param {string} type
 */
export function spawnAnalysisDocker(type) {
    return spawn('docker', buildDockerArgv(type), {
        cwd: path.join(process.cwd()),
        stdio: ['pipe', 'pipe', 'pipe'],
    })
}
