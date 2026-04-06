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
    useVisualizationBaking,
} from './visualizations/visualization-baking-context'
import { registerDependency, TIMELINE_CURRENT, useDefineTimelineHandlers, useTimeline, type Timeline } from './visualizations/use-timeline'

type ArrayWatcherStepsTimeline = Timeline<{ arrayWatcher: number[] }>

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

/*
{
    "array": [
        "0",
        "34",
        "25",
        "12",
        "22",
        "11",
        "90"
    ],
    "line": 8,
    "scope": {
        "arr": {
            "value": "0x0000fffff254f250",
            "type": "int *",
            "isPointer": true,
            "isReference": false
        },
        "n": {
            "value": "7",
            "type": "int",
            "isPointer": false,
            "isReference": false
        }
    }
}
*/

type VariableScope = Record<string, { isReference: boolean, isPointer: boolean, value: number }>
type VariableScopeCollector = Record<'scope', VariableScope>
type ActiveLinesCollector = Record<'line', number[]>

type Step = VariableScopeCollector & ActiveLinesCollector

export default function Visualization({ task }: VisualizationProps) {
    const presetName = task.presetName
    const TheVisualization =
        presetName === 'sort' ? SortVisualization : VisualizationPlaceholder

    const analysis = useVisualization(s => s.result)
    const setActiveLines = useVisualization(s => s.setActiveLines)

    const { currentStepIndex, timePerStep, forward, backward } = useVisualizationBaking()

    // steps timeline
    const steps = useTimeline<Step>('steps')
    useEffect(() => {
        console.log('initializing steps')
        analysis.forEach((rawStep, rawIndex) => {
            Object.entries(rawStep)
                .filter(([, data]) => !!data)
                .forEach(([collector, data]) => steps.emit(collector as 'scope' | 'line', data, { rawIndex }))
        })
        // steps.render()
        setTimeout(() => {
            steps.render()
            // steps.debug()
        }, 100)
        return () => {
            steps.reset()
        }
    }, [])

    // current step
    const currentStep = useMemo(() => currentStepIndex, [currentStepIndex])
    
    // current scope
    const variableScope = useTimeline<{ [TIMELINE_CURRENT]: Record<string, { isReference: boolean, isPointer: boolean, value: number }> }>('variableScope')
    useDefineTimelineHandlers(steps, variableScope, () => {
        console.log('initializing variableScope')
        steps.on('scope', scope => {
            variableScope.set(scope)
            console.log('variableScope', 'set', scope)
        })
        registerDependency(steps, variableScope)
    }, [])
    const currentScope = useMemo(() => variableScope.current ?? {}, [variableScope.current])

    // active lines
    const activeLines = useTimeline<{ [TIMELINE_CURRENT]: number[] }>('activeLines')
    useDefineTimelineHandlers(steps, activeLines, () => {
        console.log('initializing activeLines')
        steps.on('line', lines => activeLines.set(lines))
        registerDependency(steps, activeLines)
    }, [])

    const currentActiveLines = useMemo(() => activeLines.current ?? [], [activeLines.current])
    useEffect(() => setActiveLines(currentActiveLines), [setActiveLines, currentActiveLines])

    const resetProp = useMemo(() => JSON.stringify(analysis), [analysis])

    const setCurrentStepIndex = (index: number) => {
        console.warn('setCurrentStepIndex needs an overhaul, works partially only')
        if (index > currentStepIndex) {
            forward()
        } else if (index < currentStepIndex) {
            backward()
        }
    }
    const setPlaybackSpeed = () => console.warn("setPlaybackSpeed currently unsupported")

    return (
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
            {/* <Bake /> */}
        </div>
    )
}
