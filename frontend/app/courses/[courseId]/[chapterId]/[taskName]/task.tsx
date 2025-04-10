'use client'

import { type Task } from '@/lib/tasks'
import LeftColumn from './left-column'
import RightColumn from './right-column'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import LoadAnalysis from './load-analysis'
import LoadTests from './load-tests'

interface TaskProps {
    task: Task
}

export default function Task({ task }: TaskProps) {
    return (
        <div className="flex flex-col overflow-auto bg-background">
            <div className="overflow-auto">
                <ResizablePanelGroup
                    direction="horizontal"
                >
                    <ResizablePanel defaultSize={60} className="p-4">
                        <LeftColumn task={task} />
                    </ResizablePanel>

                    <ResizableHandle />

                    <ResizablePanel defaultSize={40} className="p-4">
                        <RightColumn task={task} />
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
            <LoadAnalysis task={task} />
            <LoadTests task={task} />
        </div>
    )
}