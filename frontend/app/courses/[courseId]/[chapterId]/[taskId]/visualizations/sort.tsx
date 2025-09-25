import { cn } from "@/lib/utils";
import { ListEvents } from "@/lib/visualization/ListEvents";
import { ListOrders } from "@/lib/visualization/ListOrders";
import { ListStylings } from "@/lib/visualization/ListStylings";
import { Preprocessor } from "@/lib/visualization/Preprocessor";
import { VisualizationStates } from "@/lib/visualization/VisualizationStates";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useMemo } from "react";
import { useVisualization } from "../stores";
import { VisualizationSpecializationProps } from "../visualization";
import { Collector } from "@/lib/visualization/Collector";
import { ArrayCollector, LineCollector, ScopeCollector } from "@/lib/visualization/CollectorTypes";

type Analysis = (ArrayCollector<'array'> & LineCollector<'line'> & ScopeCollector<'scope'>)[]

export default function SortVisualization({ analysis, timePerStep, currentStepIndex}: VisualizationSpecializationProps<Analysis>) {
    const { orders, classNames, activeLines, scopes } = useMemo(() => {
        const array = Preprocessor.map(
            new Collector(analysis, 'array'),
            array => array.map(item => parseInt(item))
        )

        const events = new ListEvents(array)

        const lines = new Collector(analysis, 'line')
        const activeLines = Preprocessor.map(lines, (line, index) => {
            if (events.get(index).type === 'swap') {
                return [ line, lines.get(index - 1) ]
            }
            return [ line ]
        }, [])

        const scopes = new Collector(analysis, 'scope')

        const orders = new ListOrders(events)
        const classNames = new ListStylings(events)

        VisualizationStates.shareDeletes(lines, array, events, activeLines, scopes, orders, classNames)
        VisualizationStates.removeGaps(lines, array, events, activeLines, scopes, orders, classNames)

        return {activeLines, events, orders, classNames, scopes}
    }, [analysis])

    const currentOrder = useMemo(() => orders.get(currentStepIndex), [orders, currentStepIndex])
    const currentClassNames = useMemo(() => classNames.get(currentStepIndex), [classNames, currentStepIndex])
    const currentActiveLines = useMemo(() => activeLines.get(currentStepIndex), [activeLines, currentStepIndex])
    const currentScope = useMemo(() => scopes.get(currentStepIndex), [scopes, currentStepIndex])

    const setActiveLines = useVisualization(state => state.setActiveLines)
    const setStepCount = useVisualization(state => state.setStepCount)
    const setCurrentScope = useVisualization(state => state.setCurrentScope)

    useEffect(() => {
        setActiveLines(currentActiveLines ?? [])
    }, [setActiveLines, currentActiveLines])

    useEffect(() => {
        setStepCount(orders.length)
    }, [setStepCount, orders])

    useEffect(() => {
        setCurrentScope(currentScope)
    }, [setCurrentScope, currentScope])
    
    return (
        <ul className="flex space-x-4">
            {currentOrder.map((item, index) => 
                <motion.li
                    key={item.orderId}
                    layout
                    transition={{
                        duration: timePerStep,
                        type: 'spring',
                        bounce: 0.25
                    }}
                    className="size-16">
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
                                className={cn(
                                    "absolute size-full border-2 border-black bg-white rounded-sm flex items-center justify-center",
                                    currentClassNames[index]
                                )}>
                                {item.value}
                            </motion.div>
                        </AnimatePresence>
                    </motion.div>
                </motion.li>
            )}
        </ul>
    )
}
