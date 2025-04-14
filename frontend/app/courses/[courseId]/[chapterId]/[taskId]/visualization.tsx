'use client'

import { InlineLoadingSpinner } from '@/components/loading-spinner'
import { useEffect, useState, useMemo } from 'react'
import { AnalysisResult, AnalysisResultStep } from '@/lib/code-analysis'
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
import { cn } from '@/lib/utils'
import SortVisualization from './visualizations/sort'
import QuickSortVisualization from './visualizations/quick-sort'
import { useVisualization } from './stores'

interface AnnotatedAnalsisResultStep extends AnalysisResultStep {
    myArray: { value: number, id: number, orderId: number, className?: string }[]
}

type AnnotatedAnalsisResult = AnnotatedAnalsisResultStep[]

function addIdsToItems(analysis: AnalysisResult): AnnotatedAnalsisResult {
    if (!analysis.length) return []
    let id = 0
    let current = analysis[0].array.map((value, index) => ({value, id: id++, orderId: index}))
    return [
        { ...analysis[0], myArray: current },
        ...analysis.slice(1).map(step => {
            current = current.slice().map(item => ({ ...item }))
            const event = step.event
            if (!event) {
                return { ...step, myArray: current }
            }
            if (event.type === 'replace') {
                Object.assign(current[event.index],{
                    value: event.newValue,
                    id: id++
                })
            } else if (event.type === 'swap') {
                const temp = {...current[event.index1]}
                current[event.index1] = current[event.index2]
                current[event.index2] = temp
            } else {
                throw new Error('Unknown event type: ' + event.type)
            }
            return {
                ...step,
                myArray: current,
            }
        })
    ]
}

function addAnimationsToSteps(steps: AnnotatedAnalsisResult) {
    console.log('animation', steps)
    let i = 0
    return steps.map((step, index) => {
        const event = step.event
        const followingEvent = steps[index + 1]?.event

        function getClassName(i: number) {
            if (!event) {
                return undefined
            }
            if (event.type === 'replace' && i === event.index) {
                return 'bg-amber-400'
            }
            if (event.type === 'swap' && (i === event.index1 || i === event.index2)) {
                return 'bg-sky-200'
            }
            return undefined
        }

        function getClassNameForFollowing(i: number) {
            if (!followingEvent) {
                return undefined
            }
            if (followingEvent.type === 'replace' && i === followingEvent.index) {
                return 'border-2 border-dashed animate-wiggle'
            }
            if (followingEvent.type === 'swap' && (i === followingEvent.index1 || i === followingEvent.index2)) {
                return 'border-2 border-dashed animate-wiggle'
            }
            return undefined
        }

        return {
            ...step,
            myArray: step.myArray.map((item, i) => ({
                ...item,
                className: cn(getClassName(i), getClassNameForFollowing(i))
            }))
        }
    })
}

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
    const timePerStep = 1 // 1x means 1 second

    const { loadingMessage, errorMessage, setActiveLines, state, result } = useVisualization()
    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const [playbackSpeed, setPlaybackSpeed] = useState(1)
    const steps = useMemo(() => result && addAnimationsToSteps(addIdsToItems(result)), [result])
    const derivedTimePerStep = useMemo(() => timePerStep / playbackSpeed, [timePerStep, playbackSpeed])    

    const activeLines = useMemo(() => {
        if (currentStepIndex === 0 || !steps || currentStepIndex >= steps.length) {
            return []
        }
        const step = steps[currentStepIndex]
        return [step.line, ...getLineNumberFromStepAsArray(step.skippedStep)]
    }, [currentStepIndex, steps])

    const allVariableNames = useMemo(() =>
        !steps ? [] : [
            ...steps.reduce((result, current) => {
                Object.keys(current.scope).map(key => result.add(key))
                return result
            }, new Set<string>())
        ]
    , [steps])

    const resetProp = useMemo(() => JSON.stringify(steps), [steps])  // force rerender on reset

    useEffect(() => {
        console.log('steps', steps)
    }, [steps])


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
    if (!steps || steps.some(step => !step)) {
        console.log('Analysis result is malformed', {steps, analysis: result})
        return (
            <div>
                <div>Error: Analysis result is malformed. See console for further information.</div>
            </div>
        )
    }

    const TheVisualization = {
        'sort': SortVisualization,
        'quick-sort': QuickSortVisualization
    }[task.presetName]
    
    return (
        <div className="flex items-center justify-center w-full h-full">
            <div className="grid grid-rows-3 auto-rows-min gap-8 items-center justify-center">
                <TheVisualization steps={steps} timePerStep={derivedTimePerStep} currentStepIndex={currentStepIndex} />
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
                            {allVariableNames.map(key => <TableCell key={key}>{currentStepIndex > 0 ? steps[currentStepIndex].scope[key] : '-'}</TableCell>)}
                        </TableRow>
                    </TableBody>
                </Table>
                <AnimationControlBar
                    totalSteps={steps.length}
                    timePerStep={timePerStep}
                    currentStepIndex={currentStepIndex}
                    onStepChange={setCurrentStepIndex}
                    onSpeedChange={setPlaybackSpeed}
                    resetProp={resetProp} // force rerender on reset
                />
            </div>
        </div>
    )
}