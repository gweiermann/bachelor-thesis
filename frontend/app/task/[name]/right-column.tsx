import { Button } from "@/components/ui/button"
import { Task } from "@/lib/tasks"
import Editor from "@/components/editor/editor"
import { Maximize2 } from "lucide-react"

interface RightColumnProps {
    task: Task
}

export default function RightColumn({ task }: RightColumnProps) {
    return ( 
        <div className="flex flex-col">
            <div className="flex flex-row justify-end">
                <Button variant="ghost">
                    <Maximize2 className="h-4 w-4" />
                </Button>
            </div>
            <div className="flex-1">
                <Editor functionProtoype={task.code.functionPrototype} placeholder={'// your code here'} />
            </div>
            <div className="flex flex-row justify-end">
                <Button>
                    Try it out!
                </Button>
            </div>
        </div>
    )
}