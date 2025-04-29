'use client'

import LeftColumn from './left-column'
import RightColumn from './right-column'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import LoadAnalysis from './load-analysis'
import LoadTests from './load-tests'
import { type Task } from '@/lib/db'

interface TaskProps {
    task: Task
    template: Template
}

export default function Task({ task, template }: TaskProps) {
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
                        <RightColumn task={task} template={template} />
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
            <LoadAnalysis task={task} />
            <LoadTests task={task} />
        </div>
    )
}