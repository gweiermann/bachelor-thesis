import { readFile } from 'fs/promises';

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
    let currentRange = null
    let previousLine = null
    for (const line of lines) {
        if (line.match(/^\s*\/\/\s*<user-code-start>\s*$/)) {
            result += '\n'
            lineNumber += 1
            currentRange = {
                start: {
                    // line: lineNumber,
                    // column: previousLine?.length + 1 ?? 1,
                    line: lineNumber,
                    column: 1,
                    index: result.length,
                },
                end: null,
                initialCode: ''
            }
        }
        else if (line.match(/^\s*\/\/\s*<user-code-end>\s*$/)) {
            if (currentRange) {
                currentRange.end = {
                    line: lineNumber,
                    column: 1,
                    index: result.length,
                }
                currentRange.initialCode = currentRange.initialCode.slice(0, -1) // remove the last \n
                ranges.push(currentRange)
                currentRange = null
            }
        }
        else if (!currentRange) {
            lineNumber += 1
            result += line + '\n'
        }
        else {
            currentRange.initialCode += line + '\n'
        }
        previousLine = line
    }
    return {
        presetName,
        template: result,
        ranges
    }
}