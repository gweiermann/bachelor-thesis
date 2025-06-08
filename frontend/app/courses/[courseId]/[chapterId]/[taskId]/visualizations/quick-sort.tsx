'use-client'

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, useMemo } from "react";
import { addAnimationsToSteps, addOrder, addPersistentIndexes, addRecursionStages, enrichPivotElement } from "./post-processors";
import Xarrow, { Xwrapper } from "react-xarrows";
import { useVisualization } from "../stores";

export default function QuickSortVisualization({ analysis, timePerStep, currentStepIndex}) {
    const steps = useMemo(() => analysis && addAnimationsToSteps(addPersistentIndexes(addRecursionStages(addOrder(analysis, enrichPivotElement)))), [analysis])
    useEffect(() => console.log(steps), [steps])
    const step = useMemo(() => steps[currentStepIndex], [steps, currentStepIndex])
    const stageCount = useMemo(() => step.stages.length, [step])
    const itemCount = useMemo(() => step.order.length, [step])
    const setHighlightRanges = useVisualization(state => state.setHighlightRanges)

    const [highlightColors, ] = useState(() => ['bg-fuchsia-500', 'bg-teal-500', 'bg-blue-500', 'bg-red-500', 'bg-purple-500', 'bg-pink-500' ])
    const highlightColorVariables = Object.fromEntries(highlightColors.map(color => [color, `--color-${color.slice(3)}`]))

    const comparisons = useMemo(() => step.arrayComparisons?.map((comp, index) => {
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
        return {
            lhsHasArrow,
            rhsHasArrow,
            lhsIndex: comp.lhs.index,
            rhsIndex: comp.rhs.index,
            lhs,
            rhs,
            lhsClassName: highlightColors[(index * 2) % highlightColors.length],
            rhsClassName: highlightColors[(index * 2 + 1) % highlightColors.length],
            op: comp.operation.op,
            operation: comp.operation,
            comp,
            startIndex
        }
    }) ?? [], [step, itemCount, highlightColors])

    useEffect(() => {
        setHighlightRanges(comparisons.flatMap(comp => [
            { range: comp.operation.lhsRange, className: comp.lhsClassName, hoverMessage: comp.comp.lhs.value },
            { range: comp.operation.rhsRange, className: comp.rhsClassName, hoverMessage: comp.comp.rhs.value  },
        ]))
    }, [comparisons, setHighlightRanges])

    return (
        <div className="h-full flex flex-col gap-2" style={{ '--col-count': `2fr repeat(${step.order.length}, minmax(0, 1fr))` } as React.CSSProperties}>
            <Xwrapper>
                <div className="flex flex-col h-full">
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
                                className={cn(
                                    "grid gap-2 grid-cols-(--col-count) h-20 even:bg-gray-100 odd:bg-gray-50 py-2 px-4 first:rounded-t last:rounded-b",
                                    {'h-10': stageIndex < stageCount - 1}
                                )}>

                                <div className="col-1 flex items-center h-full w-full">
                                    sort(arr, {stage.left}, {stage.right})
                                </div>
                                
                                {step.order.slice(stage.left, stage.right + 1).map((item, index) => 
                                    <motion.li
                                        key={step.order[stage.left + index].orderId}
                                        id={stageIndex === stageCount - 1 || (index + stage.left < step.stages[stageIndex + 1].left || step.stages[stageIndex + 1].right < index + stage.left)  ? `item-${stage.left + index}` : null}
                                        layout
                                        transition={{
                                            duration: timePerStep,
                                            type: 'spring',
                                        }}
                                        className={cn(
                                            "w-16 col-(--col-index) h-full",
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
                                                            'bg-gray-300 border-0 text-gray-300': stageIndex < stageCount - 1 && step.stages[stageIndex + 1].left <= stage.left + index && step.stages[stageIndex + 1].right >= stage.left + index,
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
                            <li key={index} className="grid grid-cols-(--col-count)" style={{ '--col-start-index': comp.startIndex + 2 } as React.CSSProperties}>
                                <div className={cn(
                                        "min-w-16 min-h-8 text-center border-r-0 border-3 border-black rounded-l font-bold bg-white flex justify-center items-center z-10 col-(--col-start-index)",
                                        comp.lhsClassName
                                    )} id={`lhs-${index}`}>
                                    {comp.lhs}
                                </div>
                                <div className="min-w-16 min-h-8 bg-gray-300 border-t-3 border-b-3 border-black font-bold flex justify-center items-center z-10">
                                    {comp.op}
                                </div>
                                <div className={cn(
                                        "min-w-16 min-h-8 text-cente border-l-0 border-3 border-black rounded-r font-bold bg-white flex justify-center items-center z-10",
                                        comp.rhsClassName
                                    )} id={`rhs-${index}`}>
                                    {comp.rhs}
                                </div>
                                {comp.lhsHasArrow && <Xarrow start={`lhs-${index}`} end={`item-${comp.lhsIndex}`} startAnchor='top' endAnchor='bottom' color={`var(${highlightColorVariables[comp.lhsClassName]})`} /> }
                                {comp.rhsHasArrow && <Xarrow start={`rhs-${index}`} end={`item-${comp.rhsIndex}`} startAnchor='top' endAnchor='bottom' color={`var(${highlightColorVariables[comp.rhsClassName]})`} /> }
                            </li>
                        ))}
                    </ul>
                </div>
            </Xwrapper>
        </div>
    )
}
