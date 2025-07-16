import { readFile } from 'fs/promises';

export async function getConfig(presetName) {
    const path = `./config/${presetName}`
    const files = [
        'analysis/analysis.json',
        'analysis/main.cpp',
        'test/main.cpp',
        'test/testcases.json',
        'template.cpp'
    ]
    const readFiles = await Promise.all(
        files.map(file => readFile(`${path}/${file}`, 'utf-8').catch(() => null))
    )
    if (readFiles.some(content => content === null)) {
        return null
    }
    const fileContents = Object.fromEntries(
        readFiles.map((content, index) => [files[index], content])
    )

    return {
        presetName,
        template: fileContents['template.cpp'],
        analysis: {
            config: JSON.parse(fileContents['analysis/analysis.json']),
            main: fileContents['analysis/main.cpp'],
        },
        test: {
            main: fileContents['test/main.cpp'],
            testcases: JSON.parse(fileContents['test/testcases.json']),
        }
    }
}