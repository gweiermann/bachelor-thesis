import { Button } from "@/components/ui/button"
import Editor from "@/components/editor/editor"
import { Maximize2 } from "lucide-react"
import { useUserCode, useVisualization } from "./stores"
import { Task } from "@/lib/db"

interface RightColumnProps {
    task: Task
}

export default function RightColumn({ task }: RightColumnProps) {
    const defaultCode = `// todo: implement`

    const { runCode, isDirty, setFunctionBodies } = useUserCode()
    const { activeLines } = useVisualization()

    function handleChange(functionBodies: string[]) {
        setFunctionBodies(functionBodies)
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
                    initialFunctionBodies={task.functionPrototypes.map(() => defaultCode)}
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