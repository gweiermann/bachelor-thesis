
export interface Template {
    presetName: string
    template: string
    ranges: {
        start: {
            line: number
            column: number
            index: number
        }
        end: {
            line: number
            column: number
            index: number
        }
        initialCode: string
    }[]
}

export async function getTemplate(presetName: string): Promise<Template> {
    'use server'
    const response = await fetch(`http://preset-db/template/${presetName}`, {
        method: 'GET'
    })
    const result = await response.json()
    if (!result.ok) {
        console.error('Failed to fetch template', result)
        throw new Error('Failed to fetch template')
    }
    return result.data
}