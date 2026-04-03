import { getCollectorExtensionsRoot } from './config.js'
import { createRunLogger } from './logger.js'
import { fetchPresetConfig } from './preset-client.js'
import { buildRunBundleTarball } from './bundle-builder.js'
import { spawnAnalysisDocker } from './docker-analysis.js'
import { pipeAnalysisJsonLines } from './analysis-stdout.js'
import { AnalysisProcessError, handleProcess } from './analysis-docker-process.js'

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

    return new Promise((resolve, reject) => {
        const { writeStdin } = handleProcess(child, {
            onError: reject,
            logStderr: (chunk) => log.err(chunk),
        })

        pipeAnalysisJsonLines(child.stdout, {
            onStatus: onStatusUpdate,
            onNonJsonLine: (line) => log.info(line),
            onTerminated: (data) => resolve(data),
        })

        writeStdin(tarball)
    }).catch((e) => {
        if (e instanceof AnalysisProcessError) {
            const lines = [`Build process failed (${e.kind}): ${e.message}`]
            if (e.stderr.trim()) {
                lines.push(e.stderr.trim())
            }
            log.err(lines.join('\n'), true)
        } else {
            log.err('Build process failed: ' + e.message)
        }
        throw e
    })
}
