import fs from 'node:fs/promises'
import { constants as fsConstants } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

function ensureExtensionsDirectory(extensionsRoot) {
    return fs.stat(extensionsRoot).then(
        (st) => {
            if (!st.isDirectory()) {
                throw new Error(
                    `Collector extensions directory missing or not a directory: ${extensionsRoot}`,
                )
            }
        },
        (e) => {
            if (e?.code === 'ENOENT') {
                throw new Error(
                    `Collector extensions directory missing or not a directory: ${extensionsRoot}`,
                )
            }
            throw e
        },
    )
}

function ensureRegisterExtensionsPy(extensionsRoot) {
    const reg = path.join(extensionsRoot, 'register_extensions.py')
    return fs.access(reg, fsConstants.F_OK).catch(() => {
        throw new Error(`register_extensions.py missing in ${extensionsRoot}`)
    })
}

/**
 * Stage collector-extensions + preset.json + code.json, then gzip-tar the tree for stdin.
 */
export async function buildRunBundleTarball(extensionsRoot, preset, code) {
    await ensureExtensionsDirectory(extensionsRoot)
    await ensureRegisterExtensionsPy(extensionsRoot)

    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'analysis-bundle-'))
    try {
        await fs.cp(extensionsRoot, tmp, { recursive: true })
        await fs.writeFile(path.join(tmp, 'preset.json'), JSON.stringify(preset), 'utf8')
        await fs.writeFile(path.join(tmp, 'code.json'), JSON.stringify(code), 'utf8')

        const { stdout } = await execFileAsync('tar', ['-czf', '-', '-C', tmp, '.'], {
            maxBuffer: 20 * 1024 * 1024,
        })
        return stdout
    } finally {
        await fs.rm(tmp, { recursive: true, force: true })
    }
}
