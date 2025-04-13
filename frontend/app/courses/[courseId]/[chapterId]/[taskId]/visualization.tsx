'use client'

import { InlineLoadingSpinner } from '@/components/loading-spinner'
import { useEffect, useState, useMemo } from 'react'
import { AnalysisResult, AnalysisResultStep } from '@/lib/code-analysis'
import { AnimatePresence, motion } from 'motion/react'
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
import { useUserCode, useVisualization } from './stores'

interface AnnotatedAnalsisResultStep extends AnalysisResultStep {
    myArray: { value: number, id: number, orderId: number, className?: string }[]
}

type AnnotatedAnalsisResult = AnnotatedAnalsisResultStep[]

function addIdsToItems(analysis: AnalysisResult): AnnotatedAnalsisResult {
    if (!analysis.length) return []
    let id = 0
    let current = { ...analysis[0], myArray: analysis[0].array.map((value, index) => ({value, id: id++, orderId: index})) }
    return [
        current,
        ...analysis.slice(1).map(step => {
            const event = step.event
            current = { ...step, myArray: current.myArray.slice().map(item => ({ ...item })) }
            if (event.type === 'replace') {
                const item = current.myArray[event.index]
                Object.assign(current.myArray[event.index],{
                    value: event.newValue,
                    id: id++,
                    className: 'bg-amber-400'
                })
            } else if (event.type === 'swap') {
                const temp = {...current.myArray[event.index1]}          
                current.myArray[event.index1] = current.myArray[event.index2]
                current.myArray[event.index2] = temp
            } else {
                throw new Error('Unknown event type: ' + event.type)
            }
            return current
        })
    ]
}

function addAnimationsToSteps(steps: AnnotatedAnalsisResult) {
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

    const resetProp = useMemo(() => JSON.stringify(steps?.map(step => step.myArray)), [steps])  // force rerender on reset

    // useEffect(() => {
    //     console.log('analysis', analysis)
    //     console.log('steps', steps)
    // }, [steps])


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
    
    return (
        <div className="flex items-center justify-center w-full h-full">
            <div className="grid grid-rows-3 auto-rows-min gap-8 items-center justify-center">
                <ul className="flex space-x-4">
                        {steps[currentStepIndex].myArray.map((item, index) => 
                            <motion.li
                                key={item.orderId}
                                layout
                                transition={{
                                    duration: derivedTimePerStep,
                                    type: 'spring',
                                    bounce: 0.25
                                }}
                                className="size-16"
                                >
                                    <motion.div
                                        initial={{ y: -50, opacity: 0, scale: 0.5 }}
                                        animate={{ y: 0, opacity: 1, scale: 1 }}
                                        transition={{type: 'spring', duration: 0.05, delay: 0.05 * index}}
                                        className="relative size-full">
                                        <AnimatePresence initial={false}>
                                            <motion.div
                                                key={item.id}
                                                transition={{ type: 'spring', duration: derivedTimePerStep }}
                                                initial={{ y: -100, opacity: 0, scale: 0.5 }}
                                                animate={{ y: 0, opacity: 1, scale: 1 }}
                                                exit={{ y: 100, opacity: 0, scale: 0.5 }}
                                                className={cn("absolute size-full border-2 border-black bg-white rounded-sm flex items-center justify-center", item.className)}>
                                                {item.value}
                                            </motion.div>
                                        </AnimatePresence>
                                    </motion.div>
                                </motion.li>
                        )}
                    
                </ul>
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