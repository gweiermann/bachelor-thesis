import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useMemo } from "react";

function addRecursionStages(steps) {
    if (!steps.length) return []
    let stages = [
        {
            left: 0,
            right: steps[0].array.length - 1,
            pivot:  steps[0].array.length - 1
        }
    ]
    return [
        { ...steps[0], recursionStages: stages },
        ...steps.slice(1).map(step => {
            if (step.recursion) {
                const event = step.recursion
                if (event.type === 'step_in') {
                    stages.push({
                        left: step.scope.low,
                        right: step.scope.high,
                        pivot: step.scope.high
                    })
                } else if (event.type === 'step_out') {
                    stages.pop()
                } else {
                    throw new Error('Unknown event type: ' + event.type)
                }
            }
            return { ...step, recursionStages: stages.slice() }
        })
    ]
}

export default function QuickSortVisualization({ steps, timePerStep, currentStepIndex}) {
    const mySteps = useMemo(() => addRecursionStages(steps), [steps])
    console.log(mySteps.map(steps => steps.recursionStages))
    return (
        <ul className="flex space-x-4">
            {mySteps[currentStepIndex].myArray.map((item, index) => 
                <motion.li
                    key={item.orderId}
                    layout
                    transition={{
                        duration: timePerStep,
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
                                transition={{ type: 'spring', duration: timePerStep }}
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
    )
}