import { TestCaseResult } from '@/app/courses/[courseId]/[chapterId]/[taskId]/stores'
import { Task } from './db'

export type BuildResult<T> = {
    status: 'success'
    result: T
} | {
    status: 'user-error'
    message: string
} | {
    status: 'compilation-error'
    markers: EditorMarker[]
    message: string
}

export type AnalysisResult = AnalysisResultStep[]

export interface EditorMarker {
    startLineNumber: number
    startColumn: number
    endLineNumber: number
    endColumn: number
    message: string
    severity: 'error' | 'warning' | 'note' | 'info'
}

export interface AnalysisResultStep {
    array: number[]
    scope: {
        current: Record<string, { isReference: boolean, isPointer: boolean, value: number }>,
        previous: Record<string, { isReference: boolean, isPointer: boolean, value: number }>
    }
    line: number
    skippedStep: AnalysisResultStep | null
    event: AnalysisResultStepEvent
}

export type AnalysisResultStepEvent =
    { type: 'swap', index1: number, index2: number } | 
    { type: 'replace', index: number, oldValue: number, newValue: number }

export async function runAnalysis(task: Task, code: string, onStatusUpdate: (message: string) => void): Promise<BuildResult<AnalysisResult>> | never {  
    if (!code) {
        return null
    }

    return runBuild({
        type: 'analyse',
        code,
        presetName: task.presetName
    }, onStatusUpdate)
}

export async function runTests(task: Task, code: string, onStatusUpdate: (message: string) => void): Promise<BuildResult<TestCaseResult[]>> | never {
    if (!code) {
        return null
    }

    return runBuild({
        type: 'test',
        code,
        presetName: task.presetName
    }, onStatusUpdate)
}

type BuildPayload = {
    type: 'analyse'
    code: string
    presetName: string
} | {
    type: 'test'
    code: string
    presetName: string
}

async function* readChunks<T>(reader: ReadableStreamDefaultReader): AsyncGenerator<T> {
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    while (true) {
        const { done, value } = await reader.read()
        if (done) {
            break
        }
        buffer += decoder.decode(value, { stream: true })

        let lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep the last incomplete line in the buffer
        for (const line of lines) {
            yield JSON.parse(line)
        }
    }
    if (buffer.trim()) {
        yield JSON.parse(buffer) // Process any remaining data in the buffer
    }
}

export async function runBuild(payload: BuildPayload, onStatusUpdate: (message: string) => void): Promise<BuildResult<AnalysisResult | TestCaseResult>> | never {   
    const endpoint = '/api/build' // defined in nginx.conf
    // const endpoint = 'http://' + window.location.hostname + ':3001' + '/build'

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    // todo: handle errors

    const reader = response.body.getReader();

    for await (const data of readChunks<any>(reader)) {
        if (data.type === 'result') {
            return {
                status: 'success',
                result: data.result
            }
        } else if (data.type === 'status') {
            onStatusUpdate?.(data.message)
        } else if (data.type === 'error') {
            throw new Error(data.message)
        } else if (data.type === 'user-error') {
            return {
                status: 'user-error',
                message: data.message,
            }
        } else if (data.type === 'compilation-error') {
            return {
                status: 'compilation-error',
                markers: data.markers,
                message: data.message
            }
        }
    }

    // ws.addEventListener('error', e => reject(new Error('Service unavailable')))
}