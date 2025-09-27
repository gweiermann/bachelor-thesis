'use-client'

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, useMemo } from "react";
import { addAnimationsToSteps, addOrder, addRecursionStages, enrichPartitionElement, enrichPivotElement, mergeAdditionals } from "./post-processors";
import Xarrow, { Xwrapper } from "react-xarrows";
import { useVisualization } from "../stores";
import { Collector } from "@/lib/visualization/Collector";
import { ArrayCollector, ArrayComparisonCollector, LineCollector, RecursionCollector, ScopeCollector } from "@/lib/visualization/CollectorTypes";
import { Grouped } from "@/lib/visualization/Grouped";
import { ListEvents } from "@/lib/visualization/ListEvents";
import { ListOrders } from "@/lib/visualization/ListOrders";
import { ListStylings } from "@/lib/visualization/ListStylings";
import { Preprocessor } from "@/lib/visualization/Preprocessor";
import { VisualizationStates } from "@/lib/visualization/VisualizationStates";
import { VisualizationSpecializationProps } from "../visualization";

type Analysis = (
    ArrayCollector<'array'> &
    LineCollector<'line'> &
    ScopeCollector<'scope'> &
    RecursionCollector<'recursion'> &
    ArrayComparisonCollector<'arrayComparisons'>
)[]

function *range(from: number, to: number) {
    for (let i = from; i <= to; ++i) {
        yield i
    }
}

export default function QuickSortVisualization({ analysis, timePerStep, currentStepIndex}: VisualizationSpecializationProps<Analysis>) {
    const steps2 = useMemo(() => analysis && addAnimationsToSteps(addRecursionStages(addOrder(analysis, mergeAdditionals(enrichPivotElement, enrichPartitionElement)))), [analysis])
    useEffect(() => console.log(steps2), [steps2])

    const steps = useMemo(() => {
        const arraysRaw = new Collector(analysis, 'array')
        const arrays = Preprocessor.map(arraysRaw, array => array.map(item => parseInt(item)))

        const events = new ListEvents(arrays)

        const lines = new Collector(analysis, 'line')
        const activeLines = Preprocessor.map(lines, (line, index) => {
            if (events.get(index).type === 'swap') {
                return [ line, lines.get(index - 1) ]
            }
            return [ line ]
        }, [])

        const scopes = new Collector(analysis, 'scope')

        const recursionRaw = new Collector(analysis, 'recursion')
        const arrayComparisonsRaw = new Collector(analysis, 'arrayComparisons')


        VisualizationStates.shareDeletesAndRemoveGaps(arrays, events, activeLines, scopes, recursionRaw, arrayComparisonsRaw)

        const orders = new ListOrders(events)
        const classNames = new ListStylings(events)

        const recursions = Preprocessor.map(recursionRaw, function(rec, index, localIndex) {
            if (!(rec.from.startsWith('quickSortRecursive(') && rec.to.startsWith('quickSortRecursive('))) {
                return
            }
            if (rec.type === 'step_in') {
                const previous = this.getLocal(localIndex - 1) ?? this.initialValue
                const left = parseInt(rec.arguments.low.value + '')
                const right = parseInt(rec.arguments.high.value + '')
                const muted = new Set(previous.muted)
                range(left, right).forEach(i => muted.add(i))
                const stages = previous.stages.slice()
                return { count: stages.length + 1, muted, stages: [...stages, { left, right } ]}
            } else {
                const previous = this.getLocal(localIndex - 1)
                return previous
            }
        }, { count: 1, muted: new Set<number>(), stages: [{ left: 0, right: Infinity }] } as { count: number, muted: Set<number>, stages: { left: number, right: number, }[] })

        const pivotClassNames = Preprocessor.map(recursionRaw, function(rec, index) {
            const cns = { final: 'border-green-500 border-4 bg-green-200 ' }
            if (rec.type === 'step_in') {
                if (!(rec.from.startsWith('quickSortRecursive(') && rec.to.startsWith('partition('))) {
                    return
                }
                const previous = this.get(index)
                const pivot = parseInt(rec.arguments.high.value + '')
                return { ...previous, pivot }
            } else {
                if (!(rec.from.startsWith('partition(') && rec.to.startsWith('quickSortRecursive('))) {
                    return
                }
                const previous = this.get(index)
                console.log(rec)
                const ret = parseInt(rec.returnValue + '')
                return { ...previous, [ret]: cns.final }
            }
        }, {} as Record<number, string> & { pivot: number })

        const arrayComparisons = Preprocessor.map(arrayComparisonsRaw, function(cmp, index) {
            
        }, [] as { lhs: {
            className: string,
            range: {
                from: { line: number, col: number }, to: { line: number, col: number } }},
                rhs: { className: string, range: { from: { line: number, col: number }, to: { line: number, col: number } }
            }
        }[])

        console.log(recursions.getList())
        console.log(pivotClassNames.getList())

        return new Grouped({ arrays, events, activeLines, scopes, orders, classNames, pivotClassNames, recursions })
    }, [analysis])

    const { recursions: recursion, orders: order, classNames, activeLines, scopes: scope, pivotClassNames } = useMemo(() => steps.get(currentStepIndex), [currentStepIndex, steps])


    
    const step2 = useMemo(() => steps2[currentStepIndex], [steps2, currentStepIndex])
    const itemCount = useMemo(() => step2.order.length, [step2])
    const setHighlightRanges = useVisualization(state => state.setHighlightRanges)

    const [highlightColors, ] = useState(() => ['bg-fuchsia-500', 'bg-teal-500', 'bg-blue-500', 'bg-red-500', 'bg-purple-500', 'bg-pink-500' ])
    const highlightColorVariables = Object.fromEntries(highlightColors.map(color => [color, `--color-${color.slice(3)}`]))

    const comparisons = useMemo(() => step2.arrayComparisons?.map((comp, index) => {
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
    }) ?? [], [step2, itemCount, highlightColors])

    const setActiveLines = useVisualization(state => state.setActiveLines)
    const setStepCount = useVisualization(state => state.setStepCount)
    const setCurrentScope = useVisualization(state => state.setCurrentScope)

    useEffect(() => {
        setHighlightRanges(comparisons.flatMap(comp => [
            { range: comp.operation.lhsRange, className: comp.lhsClassName, hoverMessage: comp.comp.lhs.value },
            { range: comp.operation.rhsRange, className: comp.rhsClassName, hoverMessage: comp.comp.rhs.value  },
        ]))
    }, [comparisons, setHighlightRanges])

    useEffect(() => {
        setActiveLines(activeLines ?? [])
    }, [setActiveLines, activeLines])

    useEffect(() => {
        setStepCount(steps.length)
    }, [setStepCount, steps])

    useEffect(() => {
        setCurrentScope(scope)
    }, [setCurrentScope, scope])

    return (
        <div className="h-full flex flex-col gap-2" style={{ '--col-count': `2fr repeat(${order.length}, minmax(0, 1fr))` } as React.CSSProperties}>
            <Xwrapper>
                <div className="flex flex-col h-full">
                    <AnimatePresence>
                        {recursion.stages.map((stage, stageIndex) => (
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
                                    {'h-10': stageIndex < recursion.count - 1}
                                )}>

                                <div className="col-1 flex items-center h-full w-full">
                                    sort(arr, {stage.left}, {stage.right})
                                </div>
                                
                                {order.slice(stage.left, stage.right + 1).map((item, index) => 
                                    <motion.li
                                        key={order[stage.left + index].orderId}
                                        id={stageIndex === recursion.count - 1 || (index + stage.left < recursion.stages[stageIndex + 1].left || recursion.stages[stageIndex + 1].right < index + stage.left)  ? `item-${stage.left + index}` : null}
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
                                                        classNames[stage.left + index],
                                                        pivotClassNames[index],
                                                        {
                                                            'bg-amber-300': pivotClassNames.pivot === index,
                                                            'bg-gray-300 border-0 text-gray-300': recursion.muted.has(index) && stageIndex < recursion.count - 1,
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
