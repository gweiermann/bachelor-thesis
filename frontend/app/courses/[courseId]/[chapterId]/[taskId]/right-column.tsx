import { Button } from "@/components/ui/button"
import Editor from "@/components/editor/editor"
import { Maximize2 } from "lucide-react"
import { useUserCode, useVisualization } from "./stores"
import { Task } from "@/lib/db"
import { useMemo, useState } from "react"

interface RightColumnProps {
    task: Task
}

export default function RightColumn({ task }: RightColumnProps) {
    const { runCode, isDirty, setFunctionBodies } = useUserCode()
    const { activeLines } = useVisualization()
    const [initialFunctionBodies, setInitialFunctionBodies] = useState(null)
    const storageKey = useMemo(() => `functionBodies:${task.courseId}/${task.chapterId}/${task.id}`, [task])

    if (!initialFunctionBodies) {

        const initialCode = `// todo: implement`

        // Use localStorage to persist the initial function bodies across reloads
        const fromStorage = typeof window !== 'undefined' && JSON.parse(localStorage?.getItem(storageKey) ?? 'null')

        const codes = task.functionPrototypes
            .map((_, index) => fromStorage?.[index] ?? initialCode) // use fromStorage if available, otherwise use initialCode
            .map(code => !code.trim() ? initialCode : code)         // if the code is empty, use initialCode
            .map(code => '\n    ' + code.trim())                    // indent the code
        setInitialFunctionBodies(codes)
    }

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
                    functionPrototypes={task.functionPrototypes}
                    initialFunctionBodies={initialFunctionBodies}
                    onChange={handleChange}
                    activeLines={isDirty ? [] : activeLines} />
            </div>
            <div className="flex flex-row justify-end">
                <Button onClick={runCode}>
                    Try it out!
                </Button>
            </div>
        </div>
    )
}