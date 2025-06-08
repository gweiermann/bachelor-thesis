import { TestCaseResult } from '@/app/courses/[courseId]/[chapterId]/[taskId]/stores'
import { getTask, Task } from './db'

export type AnalysisResult = AnalysisResultStep[]
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

export async function runAnalysis(task: Task, code: string, onStatusUpdate: (message: string) => void): Promise<AnalysisResult> | never {  
    if (!code) {
        return null
    }

    return runBuild({
        type: 'analyse',
        code,
        presetName: task.presetName
    }, onStatusUpdate)
}

export async function runTests(task: Task, code: string, onStatusUpdate: (message: string) => void): Promise<TestCaseResult[]> | never {  
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

export function runBuild(payload: BuildPayload, onStatusUpdate: (message: string) => void): Promise<AnalysisResult> | never {   
    return new Promise((resolve, reject) => {
        const endpoint = '/ws-api/run' // defined in next.config.js
        const url = ((window.location.protocol === "https:") ? "wss://" : "ws://") + window.location.host + endpoint
        const ws = new WebSocket(url)

        ws.addEventListener('error', e => reject(new Error('Service unavailable')))

        ws.addEventListener('open', function open() {
            ws.send(JSON.stringify(payload));
        });

        ws.addEventListener('message', ({ data: raw }) => {
            const data = JSON.parse(raw)
            if (data.type === 'result') {
                resolve(data.result)
            } else if (data.type === 'status') {
                onStatusUpdate?.(data.message)
            } else if (data.type === 'error') {
                reject(new Error(data.message))
            }
        });

        ws.addEventListener('close', function open() {
            reject(new Error('Connection closed'));
        });
    })
}