import { getCollectorExtensionsRoot } from './config.js'
import { createRunLogger } from './logger.js'
import { fetchPresetConfig } from './preset-client.js'
import { buildRunBundleTarball } from './bundle-builder.js'
import { spawnAnalysisDocker } from './docker-analysis.js'
import { pipeAnalysisJsonLines } from './analysis-stdout.js'

/**
 * Fetch preset, build bundle tarball, run analysis container, return final JSON line payload.
 */
export async function runAnalysis(type, presetName, code, onStatusUpdate) {
    const log = createRunLogger()
    log.info(`Starting build process. Type: ${type}, Preset: ${presetName}`)

    const config = await fetchPresetConfig(presetName)
    if (!config) {
        log.err(`Preset '${presetName}' not found`)
        throw new Error(`Preset '${presetName}' not found`)
    }

    const extensionsRoot = getCollectorExtensionsRoot()
    const tarball = await buildRunBundleTarball(extensionsRoot, config, code).catch((e) => {
        log.err(`Failed to build run bundle tarball: ${e.message}`, true)
        throw e
    })

    const child = spawnAnalysisDocker(type)
    child.stdin.write(tarball)
    child.stdin.end()

    let stderr = ''
    child.stderr.on('data', (data) => {
        const chunk = data.toString('utf-8')
        stderr += chunk
        log.err(chunk)
    })

    const result = await new Promise((resolve, reject) => {
        let settled = false

        pipeAnalysisJsonLines(child.stdout, {
            onStatus: onStatusUpdate,
            onNonJsonLine: (line) => log.info(line),
            onTerminal: (data) => {
                if (settled) {
                    return
                }
                settled = true
                resolve(data)
            },
        })

        child.stdout.on('close', () => {
            if (!settled) {
                reject(new Error('Process closed unexpectedly: ' + stderr))
            }
        })
    }).catch((e) => {
        log.err('Build process failed: ' + e.message)
        throw e
    })

    return result
}
