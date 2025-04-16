import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useMemo } from "react";
import { addAnimationsToSteps, addOrder, addPersistentIndexes, addRecursionStages, enrichPivotElement } from "./post-processors";



export default function QuickSortVisualization({ analysis, timePerStep, currentStepIndex}) {
    const steps = useMemo(() => analysis && addAnimationsToSteps(addPersistentIndexes(addRecursionStages(addOrder(analysis, enrichPivotElement)))), [analysis])
    console.log(steps)
    const step = useMemo(() => steps[currentStepIndex], [steps, currentStepIndex])
    const stageCount = useMemo(() => step.stages.length, [step])
    const comparison = useMemo(() => {
        if (!step.comparison) {
            return null
        }
        let lhs, rhs, op
        op = step.comparison.operation.op
        lhs = `${step.comparison.operation.lhs} = ${step.comparison.lhsValue}`
        rhs = `${step.comparison.rhsValue} = ${step.comparison.operation.rhs}`
        
        if (step.arrayComparison) {
            if (step.arrayComparison.lhs.index) {
                lhs = `${step.comparison.operation.lhs} = array[${step.arrayComparison.lhs.index}] = ${step.arrayComparison.lhs.value}`
            }
            if (step.arrayComparison.rhs.index) {
                rhs = `${step.arrayComparison.rhs.value} = array[${step.arrayComparison.rhs.index}] = ${step.comparison.operation.rhs}`
            }
        }
        return `${lhs} ${op} ${rhs}`
    }, [step])
    return (
        <div className="flex flex-col gap-2 h-full">
            <div>{comparison ?? "No comparison"}</div>
            <div className="flex flex-col gap-2 h-full" style={{ '--col-count': `repeat(${step.order.length}, minmax(0, 1fr))` } as React.CSSProperties}>
                <AnimatePresence>
                    {step.stages.map((stage, stageIndex) => (
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
                            
                            {step.order.slice(stage.left, stage.right + 1).map((item, index) => 
                                <motion.li
                                    key={step.order[stage.left + index].orderId}
                                    layout
                                    transition={{
                                        duration: timePerStep,
                                        type: 'spring',
                                    }}
                                    className="size-16 col-(--col-index)"
                                    style={{ '--col-index': stage.left + index + 1 } as React.CSSProperties}
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
                                                    step.className[stage.left + index],
                                                    {
                                                        'bg-amber-300': item.additional?.isPivot,
                                                        'border-green-500 border-4 bg-green-200': step.persistentIndexes.includes(stage.left + index),
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
        </div>
    )
}
