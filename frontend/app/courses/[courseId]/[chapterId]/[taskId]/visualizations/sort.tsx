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
import { Grouped } from "@/lib/visualization/Grouped";

type Analysis = (ArrayCollector<'array'> & LineCollector<'line'> & ScopeCollector<'scope'>)[]

export default function SortVisualization({ analysis, timePerStep, currentStepIndex}: VisualizationSpecializationProps<Analysis>) {
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

        VisualizationStates.shareDeletesAndRemoveGaps(arrays, events, activeLines, scopes)

        const orders = new ListOrders(events)
        const classNames = new ListStylings(events)

        return new Grouped({ arrays, events, activeLines, scopes, orders, classNames })
    }, [analysis])

    const { orders: order, classNames, activeLines, scopes: scope } = useMemo(() => steps.get(currentStepIndex), [steps, currentStepIndex])

    const setActiveLines = useVisualization(state => state.setActiveLines)
    const setStepCount = useVisualization(state => state.setStepCount)
    const setCurrentScope = useVisualization(state => state.setCurrentScope)

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
        <ul className="flex space-x-4">
            {order.map((item, index) => 
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
                                    classNames[index]
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
