'use client'

import { useEffect, useState, } from 'react'
import { useMemo } from 'react'
import { type Task } from '@/lib/tasks'
import LeftColumn from './left-column'
import RightColumn from './right-column'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { analyzeCode } from '@/lib/code-analysis'
import useSWR from 'swr'
import { useUserCode, useVisualization } from './stores'

interface TaskProps {
    task: Task
}

export default function Task({ task }: TaskProps) {
    const firstLoadingMessage = 'Waiting for compilation...'

    const { codeToBeRun } = useUserCode()
    const {  setLoadingMessage, setIsLoading, setErrorMessage, setResult } = useVisualization()

    const { data: analysisResult, isLoading, error } = useSWR(
        ['analyzeCode', task.name, codeToBeRun],
        () => analyzeCode(task.name, codeToBeRun, setLoadingMessage),
        { revalidateOnFocus: false, suspense: false }
    )

    useEffect(() => {
        if (isLoading && codeToBeRun) {
            setLoadingMessage(firstLoadingMessage)
            setIsLoading(true)
        } else {
            setLoadingMessage(null)
            setIsLoading(false)
        }
    }, [isLoading, setIsLoading, setLoadingMessage, codeToBeRun])

    useEffect(() => {
        setErrorMessage(error?.message)
    }, [error, setErrorMessage])

    useEffect(() => {
        setResult(analysisResult)
    }, [analysisResult, setResult])

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
        </div>
    )
}