import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useMemo } from "react";

function addRecursionStages(steps) {
    if (!steps.length) return []
    const stages = [
        {
            left: 0,
            right: steps[0].array.length - 1,
            pivot:  steps[0].array.length - 1
        }
    ]
    const persistent: number[] = []
    return [
        { ...steps[0], recursionStages: stages, persistent: [] },
        ...steps.slice(1).map(step => {
            const event = step.recursion
            if (event) {
                if (event.from.startsWith('quickSortRecursive(') && event.to.startsWith('quickSortRecursive(')) {
                    if (event.type === 'step_in') {
                        if (event.arguments.low >= event.arguments.high) {
                            persistent.push(parseInt(event.arguments.low))
                        }
                        stages.push({
                            left: parseInt(event.arguments.low),
                            right: parseInt(event.arguments.high),
                            pivot: parseInt(event.arguments.high)
                        })
                    } else if (event.type === 'step_out') {
                        stages.pop()
                    } else {
                        throw new Error('Unknown event type: ' + event.type)
                    }
                }
                else if (event.from.startsWith('partition(') && event.type === 'step_out') {
                    persistent.push(parseInt(event.returnValue))
                }
            }
            console.log(persistent)
            return { ...step, recursionStages: stages.slice(), persistent: persistent.slice() }
        })
    ]
}

export default function QuickSortVisualization({ steps, timePerStep, currentStepIndex}) {
    const mySteps = useMemo(() => addRecursionStages(steps), [steps])
    const step = useMemo(() => mySteps[currentStepIndex], [mySteps, currentStepIndex])
    const stageCount = useMemo(() => step.recursionStages.length, [step])
    return (
        <div className="flex flex-col gap-2 h-full" style={{ '--col-count': `repeat(${mySteps[0].myArray.length}, minmax(0, 1fr))` } as React.CSSProperties}>
            <AnimatePresence>
                {step.recursionStages.map((stage, stageIndex) => (
                    <motion.ul
                        key={stageIndex}
                        initial={{ y: -10, opacity: 0 }}
                        exit={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{
                            duration: timePerStep,
                            type: 'spring',
                        }}
                        className={cn("grid gap-2 grid-cols-(--col-count) h-1")}>
                        
                        {step.myArray.slice(stage.left, stage.right + 1).map((item, index) => 
                            <motion.li
                                key={item.orderId}
                                layout
                                transition={{
                                    duration: timePerStep,
                                    type: 'spring',
                                }}
                                className="size-16 col-(--col-index)"
                                style={{ '--col-index': index + stage.left + 1 } as React.CSSProperties}
                                >
                                <motion.div
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{type: 'spring', duration: 0.05, delay: 0.05 * index}}
                                    className="relative size-full">
                                    <AnimatePresence initial={false}>
                                        <motion.div
                                            key={item.id}
                                            transition={{ type: 'spring', duration: timePerStep }}
                                            initial={{ y: -100, opacity: 0, scale: 0.5 }}
                                            animate={{ y: 0, opacity: 1, scale: 1 }}
                                            exit={{ y: 100, opacity: 0, scale: 0.5 }}
                                            className={cn(
                                                "absolute size-full border-2 border-black bg-white rounded-sm flex items-center justify-center",
                                                item.className,
                                                {
                                                    'border-green-500 border-4 bg-green-200': step.persistent.includes(stage.left + index),
                                                }
                                            )}>
                                            {item.value}
                                        </motion.div>
                                    </AnimatePresence>
                                </motion.div>
                            </motion.li>
                        )}
                    </motion.ul>
                ))}
            </AnimatePresence>
        </div>
    )
}