'use client'

import { useState, } from 'react'
import { useMemo } from 'react'
import { type Task } from '@/lib/tasks'
import LeftColumn from './left-column'
import RightColumn from './right-column'
import Navigation from './navigation'

interface TaskProps {
    task: Task
}

export default function Task({ task }: TaskProps) {
    // const placeholder = `// your code here`
    const placeholder = `for (int i = 0; i < n-1; i++) {
        for (int j = 0; j < n-i-1; j++) {
            if (arr[j] > arr[j+1]) {
                std::swap(arr[j], arr[j+1]);
            }
        }
    }`

    const [code, setCode] = useState(null)
    const [previousCode, setPreviousCode] = useState(null)
    const [codeToAnalyse, setCodeToAnalyse] = useState(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [activeLines, setActiveLines] = useState(null)
    const codeHasChanged = useMemo(() => code !== previousCode && previousCode !== null, [code, previousCode])

    function extractCodeFromFunction(code: string) {
        return code.split('\n').slice(2, -1).join('\n');
    }

    function runCode() {
        const codeWithoutPrototype = extractCodeFromFunction(code)
        setCodeToAnalyse(codeWithoutPrototype)
        setPreviousCode(code)
    }

    return (
        <div className="flex flex-col overflow-auto bg-background">
            <div className="grid grid-cols-2 p-4 overflow-auto">
                <LeftColumn task={task} />
                <RightColumn task={task} />
            </div>
        </div>
    )
}