import { Button } from "@/components/ui/button"
import Editor from "@/components/editor/editor"
import { Maximize2 } from "lucide-react"
import { useUserCode, useVisualization } from "./stores"
import { Task } from "@/lib/db"
import { useMemo, useState } from "react"
import { Template } from "@/lib/get-template"

interface RightColumnProps {
    task: Task
    template: Template
}

export default function RightColumn({ task, template }: RightColumnProps) {
    const { runCode, isDirty, setFunctionBodies } = useUserCode()
    const { activeLines, highlightRanges } = useVisualization()
    const storageKey = useMemo(() => `functionBodies:${task.courseId}/${task.chapterId}/${task.id}`, [task])

    const initialFunctionBodies: string[] = useMemo(() => {
        const fromStorage = typeof window !== 'undefined' && JSON.parse(localStorage?.getItem(storageKey) ?? 'null')
        return template.ranges
            .map((range, index) => [fromStorage?.[index] ?? range.initialCode, range]) // use fromStorage if available, otherwise use initialCode
            .map(([code, range]) => !code.trim() ? range.initialCode : code) // if the code is empty, use initialCode
    }, [template, storageKey])

    function handleChange(functionBodies: string[]) {
        setFunctionBodies(functionBodies)
        localStorage.setItem(storageKey, JSON.stringify(functionBodies))
    }

    return ( 
        <div className="flex flex-col gap-4">
            <div className="flex flex-row justify-end">
                <Button variant="ghost">
                    <Maximize2 className="h-4 w-4" />
                </Button>
            </div>
            <div className="flex-1">
                <Editor
                    template={template}
                    initialFunctionBodies={initialFunctionBodies}
                    onChange={handleChange}
                    activeLines={isDirty ? [] : activeLines}
                    highlightRanges={isDirty ? [] : highlightRanges} />
            </div>
            <div className="flex flex-row justify-end">
                <Button onClick={runCode}>
                    Try it out!
                </Button>
            </div>
        </div>
    )
}