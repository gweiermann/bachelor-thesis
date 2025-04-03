'use client'

import useSWR from 'swr'
import { FullLoadingSpinner, InlineLoadingSpinner } from '@/components/loading-spinner'
import { useEffect, useState, useMemo } from 'react'
import { AnalysisResult, AnalysisResultStep, analyzeCode } from '@/lib/code-analysis'
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
import { useVisualization } from './use-visualization'

function addIdsToItems(analysis: AnalysisResult) {
    if (!analysis.length) return []
    let id = 0
    let current = { ...analysis[0], myArray: analysis[0].array.map((value, index) => ({value, id: id++, orderId: index})) }
    return [
        current,
        ...analysis.slice(1).map(step => {
            const event = step.event
            current = { ...step, myArray: current.myArray.slice() }
            if (event.type === 'replace') {
                current.myArray[event.index].value = event.newValue
                current.myArray[event.index].id = id++
            } else if (event.type === 'swap') {
                const temp = current.myArray[event.index1]
                current.myArray[event.index1] = current.myArray[event.index2]
                current.myArray[event.index2] = temp
            } else {
                throw new Error('Unknown event type: ' + event.type)
            }
            return current
        })
    ]
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
    const firstLoadingMessage = 'Waiting for compilation...'
    
    const { code, setActiveLines, setState, state, setAnalysis, isDirty, loadingMessage, setLoadingMessage } = useVisualization()

    const { data: analysis, isLoading, error } = useSWR(
        ['analyzeCode', task.name, code],
        () => analyzeCode(task.name, code, setLoadingMessage),
        { revalidateOnFocus: false, suspense: false }
    )

    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const [playbackSpeed, setPlaybackSpeed] = useState(1)
    const steps = useMemo(() => analysis && addIdsToItems(analysis), [analysis])
    const derivedTimePerStep = useMemo(() => timePerStep / playbackSpeed, [timePerStep, playbackSpeed])    

    const activeLines = useMemo(() => {
        if (currentStepIndex === 0 || !steps) {
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

    useEffect(() => {
        if (!code) {
            setState('unrun')
        }
    }, [code, setState])

    useEffect(() => {
        if (analysis) {
            setState('ready')
            setAnalysis(analysis)
            setCurrentStepIndex(0)
        }
    }, [analysis, setState, setAnalysis])

    // useEffect(() => {
    //     console.log('analysis', analysis)
    //     console.log('steps', steps)
    // }, [steps])

    useEffect(() => {
        if (isLoading && code) {
            setState('loading')
            setLoadingMessage(firstLoadingMessage)
        }
    }, [isLoading, setState, setLoadingMessage, code])

    useEffect(() => {
        if (error) {
            setState('error')
            setLoadingMessage(error.message)
        }
    }, [error, setState, setLoadingMessage])

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
        return <div><pre>Error: {error.message}</pre></div>
    }

    // Prevent bug from crashing, needs further investigation
    if (!steps || steps.some(step => !step)) {
        console.error('Analysis result is malformed', {steps, analysis})
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
                                                animate={{ y: 0, opacity: 1, scale: 1  }}
                                                exit={{ y: 100, opacity: 0, scale: 0.5  }}
                                                className="absolute size-full bg-muted border rounded-sm flex items-center justify-center">
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
                />
            </div>
        </div>
    )
}