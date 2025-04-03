import { Button } from "@/components/ui/button"
import { Task } from "@/lib/tasks"
import Editor from "@/components/editor/editor"
import { Maximize2 } from "lucide-react"
import { useVisualization } from "./use-visualization"
import { useEffect, useState } from "react"

interface RightColumnProps {
    task: Task
}

export default function RightColumn({ task }: RightColumnProps) {
    const defaultCode = `for (int i = 0; i < n-1; i++) { 
        for (int j = 0; j < n-i-1; j++) {
            if (arr[j] > arr[j+1]) {
                int tmp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = tmp;
            }
        }
    }`

    const { runCode, activeLines, code, setIsDirty, isDirty } = useVisualization()
    const [currentCode, setCurrentCode] = useState<string | null>(defaultCode)

    useEffect(() => {
        setIsDirty(currentCode !== code)
    }, [currentCode, code, setIsDirty])

    function handleChange(codeFromEditor: string) {
        const codeWithoutPrototype = codeFromEditor.split('\n').slice(2, -1).join('\n')
        setCurrentCode(codeWithoutPrototype)
    }

    function handleRunCode() {
        runCode(code)
    }

    return ( 
        <div className="flex flex-col">
            <div className="flex flex-row justify-end">
                <Button variant="ghost">
                    <Maximize2 className="h-4 w-4" />
                </Button>
            </div>
            <div className="flex-1">
                <Editor
                    functionProtoype={task.code.functionPrototype}
                    placeholder={defaultCode}
                    onChange={handleChange}
                    activeLines={isDirty ? [] : activeLines} />
            </div>
            <div className="flex flex-row justify-end">
                <Button onClick={handleRunCode}>
                    Try it out!
                </Button>
            </div>
        </div>
    )
}