import Instructions from "./instructions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Task } from "@/lib/tasks";
import { useEffect, useMemo, useRef } from "react";
import Visualization from "./visualization";
import { TestCases } from "./test-cases";
import { InlineLoadingSpinner } from "@/components/loading-spinner";
import { Eye } from "lucide-react";
import { useVisualization } from "./stores";
interface LeftColumnProps {
    task: Task
}

export default function LeftColumn({ task }: LeftColumnProps) {
    // set explicit height so that the content can scroll
    // FIXME: can be done with css only
    const container = useRef(null)
    useEffect(() => {
        const handler = () => {
            const elem = container.current
            if (elem) {
                const height = window.innerHeight - elem.getBoundingClientRect().top
                container.current.style.height = `calc(${height}px - var(--spacing) * 6)`
            }
        }
        handler()
        window.addEventListener('resize', handler)
        return () => window.removeEventListener('resize', handler)
    }, [])
    // ---

    const state = useVisualization(s => s.state)
    const visualizationIndicator = useMemo(() => 
        state === 'loading' ? <InlineLoadingSpinner className="size-4" /> :
        (state === 'ready' ? <Eye className="size-4" /> : null), [state])
    const testsIndicator = useMemo(() => 
        state === 'loading' ? <InlineLoadingSpinner className="size-4" /> :
        (state === 'ready' ? <Eye className="size-4" /> : null), [state])

    return (
        <div className="w-full">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                {task.longName}
            </h2>
            <Tabs defaultValue="instructions" className="flex flex-col overflow-auto">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="instructions">
                        Instructions
                    </TabsTrigger>
                    <TabsTrigger value="visualization">
                        Visualization {visualizationIndicator}
                    </TabsTrigger>
                    <TabsTrigger value="tests">
                        Tests {testsIndicator}
                    </TabsTrigger>
                </TabsList>
                <div className="mt-4 w-full flex flex-col overflow-y-auto" ref={container}>
                    <TabsContent value="instructions">
                        <Instructions description={task.description} />
                    </TabsContent>
                    <TabsContent value="visualization">
                        <Visualization task={task} />
                    </TabsContent>
                    <TabsContent value="tests">
                        <TestCases />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
}