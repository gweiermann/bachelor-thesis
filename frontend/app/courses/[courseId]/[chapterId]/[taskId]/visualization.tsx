'use client'

import { InlineLoadingSpinner } from '@/components/loading-spinner'
import { useEffect, useState, useMemo } from 'react'
import { AnalysisResultStep } from '@/lib/build'
import AnimationControlBar from './animation-control-bar'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Task } from '@/lib/tasks'
import SortVisualization from './visualizations/sort'
import { useVisualization } from './stores'
import {
    Bake,
    VisualizationBakingProvider,
} from './visualizations/visualization-baking-context'
import { useTimeline, type Timeline } from './visualizations/use-timeline'

type ArrayWatcherStepsTimeline = Timeline<{ arrayWatcher: number[] }>

function getLineNumberFromStepAsArray(step: AnalysisResultStep | null) {
    if (!step) {
        return []
    }
    return [step.line]
}

interface VisualizationProps {
    task: Task
}

function VisualizationPlaceholder() {
    return (
        <div className="text-center text-muted-foreground text-sm">
            This visualization type is not available yet.
        </div>
    )
}

export default function Visualization({ task }: VisualizationProps) {
    const presetName = task.presetName
    const TheVisualization =
        presetName === 'sort' ? SortVisualization : VisualizationPlaceholder

    const timePerStep = 1 // 1x means 1 second

    const { loadingMessage, errorMessage, setActiveLines, state, result: analysis } = useVisualization()
    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const [playbackSpeed, setPlaybackSpeed] = useState(1)

    const currentStep = useMemo(() => analysis?.[currentStepIndex], [analysis, currentStepIndex])
    const currentScope = useMemo(() => currentStep?.scope ?? {}, [currentStep])

    const derivedTimePerStep = useMemo(() => timePerStep / playbackSpeed, [timePerStep, playbackSpeed])
    const vizTimePerStep = useMemo(() => derivedTimePerStep / 2, [derivedTimePerStep])

    const activeLines = useMemo(() => {
        if (currentStepIndex === 0 || !analysis || currentStepIndex >= analysis.length) {
            return []
        }
        const step = analysis[currentStepIndex]
        return [step.line, ...getLineNumberFromStepAsArray(step.skippedStep)]
    }, [currentStepIndex, analysis])

    const resetProp = useMemo(() => JSON.stringify(analysis), [analysis])

    useEffect(() => {
        setCurrentStepIndex(0)
    }, [resetProp])

    useEffect(() => {
        setActiveLines(activeLines)
    }, [activeLines, setActiveLines])

    const steps = useTimeline()
    useEffect(() => {
        steps.reset()
        if (!analysis || analysis.some(step => !step)) {
            return
        }
        analysis.forEach((rawStep, rawIndex) => {
            Object.entries(rawStep).forEach(([collector, data]) => steps.emit(collector, data, { rawIndex }))
        })
    }, [analysis, steps])

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

    if (!analysis || analysis.some(step => !step)) {
        console.log('Analysis result is malformed', analysis)
        return (
            <div>
                <div>Error: Analysis result is malformed. See console for further information.</div>
            </div>
        )
    }

    return (
        <VisualizationBakingProvider
            analysis={analysis}
            timePerStep={vizTimePerStep}
        >
            <div className="grid grid-rows-[auto_1fr_auto] grid-cols-1 gap-8 items-center justify-center h-full w-full px-12">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Variable</TableHead>
                            {Object.keys(currentScope).map(name => (
                                <TableHead key={name}>{name}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableHead>Value</TableHead>
                            {Object.entries(currentScope).map(([key, value]) => {
                                const cell = value as {
                                    isPointer?: boolean
                                    value?: number
                                }
                                return (
                                    <TableCell key={key}>
                                        {currentStepIndex > 0 && !cell?.isPointer ? cell?.value : '-'}
                                    </TableCell>
                                )
                            })}
                        </TableRow>
                    </TableBody>
                </Table>
                <TheVisualization key={resetProp} steps={steps as ArrayWatcherStepsTimeline} />
                <AnimationControlBar
                    totalSteps={analysis.length}
                    timePerStep={timePerStep}
                    currentStepIndex={currentStepIndex}
                    onStepChange={setCurrentStepIndex}
                    onSpeedChange={setPlaybackSpeed}
                    resetProp={resetProp}
                />
                <Bake />
            </div>
        </VisualizationBakingProvider>
    )
}
