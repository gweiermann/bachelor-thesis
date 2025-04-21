'use-client'

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { createRef, useEffect, useMemo, useRef } from "react";
import { addAnimationsToSteps, addOrder, addPersistentIndexes, addRecursionStages, enrichPivotElement } from "./post-processors";
import Xarrow, { Xwrapper } from "react-xarrows";

export default function QuickSortVisualization({ analysis, timePerStep, currentStepIndex}) {
    const steps = useMemo(() => analysis && addAnimationsToSteps(addPersistentIndexes(addRecursionStages(addOrder(analysis, enrichPivotElement)))), [analysis])
    useEffect(() => console.log(steps), [steps])
    const step = useMemo(() => steps[currentStepIndex], [steps, currentStepIndex])
    const stageCount = useMemo(() => step.stages.length, [step])
    const itemCount = useMemo(() => step.order.length, [step])

    const comparisons = useMemo(() => step.arrayComparisons?.map(comp => {
        const lhsHasArrow = comp.lhs.index !== null
        const rhsHasArrow = comp.rhs.index !== null
        const lhs = lhsHasArrow ? comp.operation.lhs : comp.lhs.value
        const rhs = rhsHasArrow ? comp.operation.rhs : comp.rhs.value
        const startIndex = Math.min(itemCount - 3, Math.max(0, Math.round(
            lhsHasArrow ? (
                rhsHasArrow ? (comp.lhs.index + comp.rhs.index) / 2 - 1 :
                comp.lhs.index
            ) :
            comp.rhs.index - 3
        )))
        console.log('startIndex', startIndex, comp.lhs.index, comp.rhs.index, itemCount)
        return {
            lhsHasArrow,
            rhsHasArrow,
            lhsIndex: comp.lhs.index,
            rhsIndex: comp.rhs.index,
            lhs,
            rhs,
            op: comp.operation.op,
            startIndex
        }
    }) ?? [], [step, itemCount])

    return (
        <div className="flex flex-col gap-2 h-full" style={{ '--col-count': `2fr repeat(${step.order.length}, minmax(0, 1fr))` } as React.CSSProperties}>
            <Xwrapper>
                <div className="flex flex-col gap-4 h-full">
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
                                className={cn("grid gap-2 grid-cols-(--col-count) h-6")}>

                                <div className="col-1 flex align-center w-full">
                                    <div>
                                        sort(arr, {stage.left}, {stage.right})
                                    </div>
                                </div>
                                
                                {step.order.slice(stage.left, stage.right + 1).map((item, index) => 
                                    <motion.li
                                        key={step.order[stage.left + index].orderId}
                                        id={stageIndex === stageCount - 1 ? `item-${stage.left + index}` : null}
                                        layout
                                        transition={{
                                            duration: timePerStep,
                                            type: 'spring',
                                        }}
                                        className={cn(
                                            "size-16 col-(--col-index)",
                                            {
                                                'h-6': stageIndex < stageCount - 1,
                                            }
                                        )}
                                        style={{ '--col-index': stage.left + index + 2 } as React.CSSProperties}
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
                <div>                
                    <ul className="flex flex-col gap-2 items-center">
                        {comparisons.map((comp, index) => (
                            <li key={index} className="grid grid-cols-(--col-count) gap-2" style={{ '--col-start-index': comp.startIndex + 2 } as React.CSSProperties}>
                                <div className="w-16 h-8 border-2 border-black rounded flex justify-center items-center col-(--col-start-index)" id={`lhs-${index}`}>
                                    {comp.lhs}
                                </div>
                                <div className="w-16 h-8 border-2 border-black rounded flex justify-center items-center">
                                    {comp.op}
                                </div>
                                <div className="w-16 h-8 border-2 border-black rounded flex justify-center items-center"id={`rhs-${index}`}>
                                    {comp.rhs}
                                </div>
                                {comp.lhsHasArrow && <Xarrow start={`lhs-${index}`} end={`item-${comp.lhsIndex}`} startAnchor='top' endAnchor='bottom' /> }
                                {comp.rhsHasArrow && <Xarrow start={`rhs-${index}`} end={`item-${comp.rhsIndex}`} startAnchor='top' endAnchor='bottom' /> }
                            </li>
                        ))}
                    </ul>
                </div>
            </Xwrapper>
        </div>
    )
}
