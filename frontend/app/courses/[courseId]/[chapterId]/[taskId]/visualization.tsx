'use client'

import { InlineLoadingSpinner } from '@/components/loading-spinner'
import { useEffect, useState, useMemo } from 'react'
import { AnalysisResultStep } from '@/lib/code-analysis'
import AnimationControlBar from './animation-control-bar'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
import { Task } from '@/lib/tasks'
import SortVisualization from './visualizations/sort'
import QuickSortVisualization from './visualizations/quick-sort'
import { useVisualization } from './stores'
import { AnalysisResult } from '@/lib/build'
import BinarySearchTree from './visualizations/binary-search-tree'

function getLineNumberFromStepAsArray(step: AnalysisResultStep | null) {
    if (!step) {
        return []
    }
    return [step.line]
}

interface VisualizationProps {
    task: Task
}

export default function Visualization({ task }: VisualizationProps) {
    const TheVisualization = {
        'sort': SortVisualization,
        'quick-sort': QuickSortVisualization,
        'bst-insert': BinarySearchTree,
    }[task.presetName]

    const timePerStep = 1 // 1x means 1 second

    const { loadingMessage, errorMessage, setActiveLines, state, result: analysis } = useVisualization()
    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const [playbackSpeed, setPlaybackSpeed] = useState(1)

    const currentStep = useMemo(() => analysis?.[currentStepIndex], [analysis, currentStepIndex])
    
    const derivedTimePerStep = useMemo(() => timePerStep / playbackSpeed, [timePerStep, playbackSpeed])    

    const activeLines = useMemo(() => {
        if (currentStepIndex === 0 || !analysis || currentStepIndex >= analysis.length) {
            return []
        }
        const step = analysis[currentStepIndex]
        return [step.line, ...getLineNumberFromStepAsArray(step.skippedStep)]
    }, [currentStepIndex, analysis])

    const allVariableNames = useMemo(() =>
        !analysis ? [] : [
            ...analysis.reduce((result, current) => {
                Object.keys(current.scope.current).map(key => result.add(key))
                Object.keys(current.scope.previous).map(key => result.add(key))
                return result
            }, new Set<string>())
        ]
    , [analysis])

    const resetProp = useMemo(() => JSON.stringify(analysis), [analysis])  // force rerender on reset

    useEffect(() => {
        setActiveLines(activeLines)
    }, [activeLines, setActiveLines])

    if (state === 'unrun') {
        return (
            <div className="flex items-center justify-center h-full w-full">
                Hit {"'Try it out'"} to start the visualization
            </div>
        )
    }

    if (state === 'loading') {
        return (
            <div className="flex flex-col gap-4 items-center justify-center h-full">
                <div>{loadingMessage}</div>
                <InlineLoadingSpinner />
            </div>
        )
    }

    if (state === 'error') {
        return <div><pre>Error: {errorMessage}</pre></div>
    }

    // Prevent bug from crashing, needs further investigation
    if (!analysis || analysis.some(step => !step)) {
        console.log('Analysis result is malformed', analysis)
        return (
            <div>
                <div>Error: Analysis result is malformed. See console for further information.</div>
            </div>
        )
    }
    
    return (
        <div className="grid grid-rows-[auto_1fr_auto] grid-cols-[1fr] gap-8 items-center justify-center h-full w-full px-12">
            <Table>               
                <TableHeader>
                    <TableRow>
                        <TableHead>Variable</TableHead>
                        {allVariableNames.map(name => <TableHead key={name}>{name}</TableHead>)}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableHead>Value</TableHead>
                        {allVariableNames.map(key => <TableCell key={key}>{currentStepIndex > 0 && (!currentStep.scope['array' in currentStep ? 'previous' : 'current'][key]?.isPointer && !currentStep.scope['array' in currentStep ? 'previous' : 'current'][key]?.isReference ) ? currentStep.scope['array' in currentStep ? 'previous' : 'current'][key]?.value : '-'}</TableCell>)}
                    </TableRow>
                </TableBody>
            </Table>
            <TheVisualization analysis={analysis} timePerStep={derivedTimePerStep / 2} currentStepIndex={currentStepIndex} />
            <AnimationControlBar
                totalSteps={analysis.length}
                timePerStep={timePerStep}
                currentStepIndex={currentStepIndex}
                onStepChange={setCurrentStepIndex}
                onSpeedChange={setPlaybackSpeed}
                resetProp={resetProp} // force rerender on reset
            />
        </div>
    )
}

function addAnimationsToSteps(arg0: any): any {
    throw new Error('Function not implemented.')
}


function addIdsToItems(result: AnalysisResult): any {
    throw new Error('Function not implemented.')
}
