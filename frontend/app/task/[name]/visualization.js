'use client'

import useSWR from 'swr'
import { FullLoadingSpinner } from '@/components/loading-spinner'
import { useEffect, useState, useMemo } from 'react'
import { analyzeCode } from '@/lib/code-analysis'
import { motion } from 'motion/react'

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
        const changeAtSecond = second.findIndex((value, index) => value !== first[index])
        const changeAtThird = third.findIndex((value, index) => value !== second[index])
        
        if (second[changeAtSecond] === second[changeAtThird] && first[changeAtSecond] === third[changeAtThird]) {
            mask[i + 1] = false
            i += 2
            continue
        }
        i += 1
    }
    return steps.filter((_, index) => mask[index])
}

export default function Visualization({ code, task, onIsLoading }) {
    const { data: analysis, isLoading, error } = useSWR(['analyzeCode', task.name, code], () => analyzeCode(task.name, code), { revalidateOnFocus: false, suspense: false })
    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const steps = useMemo(() => analysis && fixSwapping(analysis.steps), [analysis])

    useEffect(() => {
        onIsLoading?.(isLoading)
    }, [onIsLoading, isLoading])

    useEffect(() => {
        if (!steps) {
            return
        }

        let timeout;
        if (currentStepIndex === steps.length - 1) {
            timeout = setTimeout(() => {
                setCurrentStepIndex(0)
            }, 5000);
        } else {
            timeout = setTimeout(() => {
                setCurrentStepIndex(currentStepIndex => currentStepIndex + 1)
            }, 1000);
        }

        return () => clearTimeout(timeout)
    }, [steps, currentStepIndex])

    if (isLoading) {
        return <FullLoadingSpinner />
    }

    if (error) {
        return <div>Error: {error.message}</div>
    }

    // FIXME: animation only works if the list contains distinct values

    
    return (
        <div className="flex flex-col items-center justify-center gap-8">
            <ul className="flex space-x-4">
                {steps[currentStepIndex].map((value, index) => 
                    <motion.li
                        key={value}
                        layout
                        transition={{type: 'spring', stiffness: 300, damping: 30, duration: 0.25}}
                        className="size-16 bg-muted border rounded-sm flex items-center justify-center">
                            {value}
                        </motion.li>
                )}
            </ul>
            <p>Step {currentStepIndex + 1} of {steps.length}</p>
        </div>
    )
}