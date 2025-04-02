import { getTask } from './tasks'

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

export async function analyzeCode(taskName: string, codeWithoutPrototype: string, onStatusUpdate: (message: string) => void): Promise<AnalysisResult> | never {   
    const task = await getTask(taskName)
    if (!task) {
        throw new Error("Task not found!")
    }

    const code = `
        #include <iostream>
        
        ${task.code.functionPrototype}
        {
            ${codeWithoutPrototype}
        }
        
        int main() {
            ${task.code.main}
            return 0;
        }
    `

    return new Promise((resolve, reject) => {
        const endpoint = '/ws-api/visualize'
        const url = ((window.location.protocol === "https:") ? "wss://" : "ws://") + window.location.host + endpoint
        const ws = new WebSocket(url)

        ws.addEventListener('error', e => reject(new Error('Service unavailable')))

        ws.addEventListener('open', function open() {
            ws.send(JSON.stringify({
                taskName,
                code
            }));
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