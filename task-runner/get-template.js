import { readFile } from 'fs/promises';

const markers = {
    userCodeStart: /^\s*\/\/\s*<user-code-start>\s*$/,
    userCodeEnd: /^\s*\/\/\s*<user-code-end>\s*$/,
}

export async function getTemplate(presetName) {
    const templatePath = `./analysis/config/${presetName}/template.cpp`
    const data = await readFile(templatePath, 'utf-8').catch(() => null)
    if (!data) {
        return null
    }

    const lines = data.split('\n')
    let lineNumber = 0
    let result = ''
    const ranges = []
    let userCodeRange = null
    for (const line of lines) {
        const match = Object.entries(markers).find(([, regex]) => line.match(regex))
        if (match) {
            const marker = match[0]
            if (marker === 'userCodeStart') {
                result += '\n'
                lineNumber += 1
                userCodeRange = {
                    start: {
                        line: lineNumber,
                        column: 1,
                        index: result.length,
                    },
                    end: null,
                    initialCode: ''
                }
            }
            else if (marker === 'userCodeEnd') {
                if (userCodeRange) {
                    userCodeRange.end = {
                        line: lineNumber,
                        column: 1,
                        index: result.length,
                    }
                    userCodeRange.initialCode = userCodeRange.initialCode.slice(0, -1) // remove the last \n
                    ranges.push(userCodeRange)
                    userCodeRange = null
                }
            }
            else {
                throw new Error(`Unknown marker: ${marker}`)
            }
        }
        else if (!userCodeRange) {
            lineNumber += 1
            result += line + '\n'
        }
        else {
            userCodeRange.initialCode += line + '\n'
        }
    }
    return {
        presetName,
        template: result,
        ranges
    }
}