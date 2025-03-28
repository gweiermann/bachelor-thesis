'use client'

import useSWR from 'swr'
import { FullLoadingSpinner } from '@/components/loading-spinner'
import { useEffect, useState, useMemo } from 'react'
import { analyzeCode } from '@/lib/code-analysis'
import { AnimatePresence, motion } from 'motion/react'
import AnimationControlBar from './animation-control-bar'
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"

function getChangedIndex(first, second, startIndex = 0) {
    const index = first.slice(startIndex).findIndex((value, index) => value !== second[index + startIndex])
    if (index === -1) {
        return -1
    }
    return index + startIndex
}

/**
 * Because a swap operation could lead to a inbetween state where the swapping is not yet finished like in the following example:
 * [1, 3, 2, 4] -> [1, 2, 2, 4] -> [1, 2, 3, 4]
 * We want to skip the inbetween state and only show the final state of the swapping operation.
 */
export function fixSwapping(steps) {
    // note: array got deduplicated in the backend
    const len = steps.length
    const mask = new Array(len).fill(true)
    for (let i = 0; i < len - 2;) {
        const first = steps[i].array
        const second = steps[i + 1].array
        const third = steps[i + 2].array
        const changeAtSecond = getChangedIndex(first, second)
        const changeAtThird = getChangedIndex(second, third)
        
        if (changeAtSecond !== changeAtThird && second[changeAtSecond] === second[changeAtThird] && first[changeAtSecond] === third[changeAtThird]) {
            mask[i + 1] = false
            i += 2
            continue
        }
        i += 1
    }
    return steps.filter((_, index) => mask[index])
}

/**
 * Since items could have the same value we need to keep track of which are which.
 * It can detect one simple swap of items. Otherwise it supposes a new item got added.
 * It enriches each item of a step with { id, value, orderId }, where id is unique for each item, value is the value of the item and orderId is the order of the item in the original list.
 * - When an item gets swapped, the id and the orderId will get swapped as well.
 * - When a new item gets added (value is replaced by a new value), it will generate a new id, but orderId will stay the same.
 */
export function keepTrackOfItems(steps) {
    if (!steps.length) {
        return []
    }
    let id = 0
    let previous = {
        ...steps[0],
        array: steps[0].array.map(item => ({ id: id, value: item, orderId: id++ }))
    }
    return [previous, ...steps.slice(1).map(step => {
        const previousValues = previous.array.map(item => item.value)
        const current = { ...step, array: previous.array.slice() }
        const values = step.array
        
        const firstChange = getChangedIndex(previousValues, values)
        if (firstChange === -1) {
            throw new Error('The steps are supposed to be different each step')
        }
        const secondChange = getChangedIndex(previousValues, values, firstChange + 1)
        
        if (secondChange === -1) {
            // no swap behaviour, only one item changed, so we assume a new item got added
            current.array[firstChange] = { id: id++, value: values[firstChange], orderId: previous.array[firstChange].orderId }
        } else {
            if (getChangedIndex(values, previousValues, secondChange + 1) !== -1) {
                throw new Error(`It's unexpected that a step can have more than two changes`)
            }
            // potential swap behaviour
            if (previous.array[firstChange].value === values[secondChange] && previous.array[secondChange].value === step.array[firstChange]) {
                // it's indeed a swap
                current.array[firstChange] = previous.array[secondChange]
                current.array[secondChange] = previous.array[firstChange]
            } else {
                // both items are new
                throw new Error(`It's unexpected that a step can have more than one new item that is not swapped with another item`)
            }
        }

        previous = current
        return current
    })]
}

export default function Visualization({ code, task, onIsLoading, onActiveLineChange }) {
    const timePerStep = 1

    const firstLoadingMessage = 'Waiting for compilation...'

    const [loadingMessage, setLoadingMessage] = useState(firstLoadingMessage)

    const { data: analysis, isLoading, error } = useSWR(
        ['analyzeCode', task.name, code],
        () => analyzeCode(task.name, code, setLoadingMessage),
        { revalidateOnFocus: false, suspense: false }
    )
    const [currentStepIndex, setCurrentStepIndex] = useState(0)

    const steps = useMemo(() => analysis && keepTrackOfItems(fixSwapping(analysis)), [analysis])
    const [playbackSpeed, setPlaybackSpeed] = useState(1)
    const derivedTimePerStep = useMemo(() => timePerStep / playbackSpeed, [timePerStep, playbackSpeed])

    const activeLine = useMemo(() => currentStepIndex > 0 && steps && steps[currentStepIndex].line, [currentStepIndex, steps])
    const allVariableNames = useMemo(() => !steps ? [] : [...steps.reduce((result, current) => {
        Object.keys(current.scope).map(key => result.add(key))
        return result
    }, new Set())], [steps])

    useEffect(() => {
        setCurrentStepIndex(0)
    }, [analysis])

    useEffect(() => {
        onIsLoading?.(isLoading)
        setLoadingMessage(firstLoadingMessage)
    }, [onIsLoading, isLoading])

    useEffect(() => {
        onActiveLineChange?.(activeLine)
    }, [activeLine])

    if (isLoading) {
        return (
            <div className="flex flex-col gap-4">
                <div>{loadingMessage}</div>
                <FullLoadingSpinner />
            </div>
        )
    }

    if (error) {
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
        <div className="flex flex-col items-center justify-center gap-8">
            <ul className="flex space-x-4">
                    {steps[currentStepIndex].array.map((item, index) => 
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
    )
}