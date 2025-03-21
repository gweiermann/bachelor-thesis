'use client'

import useSWR from 'swr'
import { FullLoadingSpinner } from '@/components/loading-spinner'
import { useEffect, useState, useMemo } from 'react'
import { analyzeCode } from '@/lib/code-analysis'
import { AnimatePresence, motion } from 'motion/react'
import AnimationControlBar from './animation-control-bar'

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
        const first = steps[i]
        const second = steps[i + 1]
        const third = steps[i + 2]
        const changeAtSecond = getChangedIndex(first, second)
        const changeAtThird = getChangedIndex(second, third)
        
        if (second[changeAtSecond] === second[changeAtThird] && first[changeAtSecond] === third[changeAtThird]) {
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
    let previous = steps[0].map(item => ({ id: id, value: item, orderId: id++ }))
    return [previous, ...steps.slice(1).map(step => {
        const previousValues = previous.map(item => item.value)
        const current = previous.slice()
        
        const firstChange = getChangedIndex(previousValues, step)
        if (firstChange === -1) {
            throw new Error('The steps are supposed to be different each step')
        }
        const secondChange = getChangedIndex(previousValues, step, firstChange + 1)
        
        if (secondChange === -1) {
            // no swap behaviour, only one item changed, so we assume a new item got added
            current[firstChange] = { id: id++, value: step[firstChange], orderId: previous[firstChange].orderId }
        } else {
            if (getChangedIndex(step, previousValues, secondChange + 1) !== -1) {
                throw new Error(`It's not supposed that a step can have more than two changes`)
            }
            // potential swap behaviour
            if (previous[firstChange].value === step[secondChange] && previous[secondChange].value === step[firstChange]) {
                // it's indeed a swap
                current[firstChange] = previous[secondChange]
                current[secondChange] = previous[firstChange]
            } else {
                // both items are new
                throw new Error(`It's not supposed that a step can have more than two new items that are not swapped`)
            }
        }

        previous = current
        return current
    })]
}

export default function Visualization({ code, task, onIsLoading }) {
    const timePerStep = 1

    const { data: analysis, isLoading, error } = useSWR(['analyzeCode', task.name, code], () => analyzeCode(task.name, code), { revalidateOnFocus: false, suspense: false })
    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const steps = useMemo(() => analysis && keepTrackOfItems(fixSwapping(analysis.steps)), [analysis])
    const [playbackSpeed, setPlaybackSpeed] = useState(1)
    const derivedTimePerStep = useMemo(() => timePerStep / playbackSpeed, [timePerStep, playbackSpeed])

    useEffect(() => {
        onIsLoading?.(isLoading)
    }, [onIsLoading, isLoading])

    if (isLoading) {
        return <FullLoadingSpinner />
    }

    if (error) {
        return <div>Error: {error.message}</div>
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
                    {steps[currentStepIndex].map((item, index) => 
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
            <AnimationControlBar
                totalSteps={steps.length}
                timePerStep={timePerStep}
                onStepChange={setCurrentStepIndex}
                onSpeedChange={setPlaybackSpeed}
            />
        </div>
    )
}