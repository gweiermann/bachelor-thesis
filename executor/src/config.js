import path from 'node:path'

/** Docker run flags for sandboxing the analysis container */
export const containerRestrictions = [
    '--network=none',
    '--cap-drop=ALL',
    '--security-opt=no-new-privileges',
    '-m=256m',
    '--cpus=2',
    '--read-only',
    '--tmpfs=/tmp:rw,exec',
    '--ulimit', 'nproc=128:128',
    '--ulimit', 'nofile=1024:1024',
]

export const codeSizeLimit = 1024 * 1024 // 1MB

export const maxConnections = 5

export const isDebugMode = process.env.DEBUG === 'true' || process.env.DEBUG === '1'

const rawDockerImage = process.env.ANALYSIS_DOCKER_IMAGE
if (!rawDockerImage) {
    throw new Error('ANALYSIS_DOCKER_IMAGE is not set')
}
export const dockerImage = rawDockerImage

export function getCollectorExtensionsRoot() {
    if (process.env.COLLECTOR_EXTENSIONS_PATH) {
        return path.resolve(process.cwd(), process.env.COLLECTOR_EXTENSIONS_PATH)
    }
    return path.join(process.cwd(), 'collector-extensions')
}
