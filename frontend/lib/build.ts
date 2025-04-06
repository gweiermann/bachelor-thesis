import { TestCaseResult } from '@/app/task/[name]/stores'
import { getTask, TestCase } from './tasks'

export type AnalysisResult = AnalysisResultStep[]
export interface AnalysisResultStep {
    array: number[]
    scope: Record<string, number>
    line: number
    skippedStep: AnalysisResultStep | null
    event: AnalysisResultStepEvent
}

export type AnalysisResultStepEvent =
    { type: 'swap', index1: number, index2: number } | 
    { type: 'replace', index: number, oldValue: number, newValue: number }

export async function runAnalysis(taskName: string, codeWithoutPrototype: string, onStatusUpdate: (message: string) => void): Promise<AnalysisResult> | never {  
    if (!codeWithoutPrototype) {
        return null
    }

    const task = await getTask(taskName)
    if (!task) {
        throw new Error("Task not found!")
    }

    const code = `
        #include <iostream>
        
        ${task.analysis.functionPrototype}
        {
            ${codeWithoutPrototype}
        }
        
        int main() {
            ${task.analysis.main}
            return 0;
        }
    `

    return runBuild({
        type: 'analyse',
        code,
        config: task.analysis.config
    }, onStatusUpdate)
}

export async function runTests(taskName: string, codeWithoutPrototype: string, onStatusUpdate: (message: string) => void): Promise<TestCaseResult[]> | never {  
    if (!codeWithoutPrototype) {
        return null
    }

    const task = await getTask(taskName)
    if (!task) {
        throw new Error("Task not found!")
    }

    const code = `
        #include <iostream>
        
        ${task.analysis.functionPrototype}
        {
            ${codeWithoutPrototype}
        }
        
        int main() {
            ${task.testCases.main}
            return 0;
        }
    `

    return runBuild({
        type: 'test',
        code,
        testCases: [...task.testCases.public, ...task.testCases.private]
    }, onStatusUpdate)
}

type BuildPayload = {
    type: 'analyse'
    code: string
    config: any // FIXME: remove any type
} | {
    type: 'test'
    code: string
    testCases: TestCase[]
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