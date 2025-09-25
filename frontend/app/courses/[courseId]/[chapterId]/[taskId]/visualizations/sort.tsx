import { cn } from "@/lib/utils";
import { LineCollector, LineCollectorRaw } from "@/lib/visualization/LineCollector";
import { ListCollector, ListCollectorRaw } from "@/lib/visualization/ListCollector";
import { ListEvents } from "@/lib/visualization/ListEvents";
import { ListOrders } from "@/lib/visualization/ListOrders";
import { ListStylings } from "@/lib/visualization/ListStylings";
import { Preprocessor } from "@/lib/visualization/Preprocessor";
import { VisualizationStates } from "@/lib/visualization/VisualizationStates";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useMemo } from "react";
import { useVisualization } from "../stores";
import { VisualizationSpecializationProps } from "../visualization";

type Analysis = (ListCollectorRaw<'array'> & LineCollectorRaw<'line'>)[]

export default function SortVisualization({ analysis, timePerStep, currentStepIndex}: VisualizationSpecializationProps<Analysis>) {
    const { orders, classNames, activeLines } = useMemo(() => {
        const lines = new LineCollector(analysis, 'line')
        const array = new ListCollector(analysis, 'array')
        const events = new ListEvents(array)

        const activeLines = Preprocessor.map(lines, (line, index) => {
            if (events.get(index).type === 'swap') {
                return [ line, lines.get(index - 1) ]
            }
            return [ line ]
        }, [])

        VisualizationStates.shareDeletes(lines, array, events, activeLines)
        VisualizationStates.removeGaps(lines, array, events, activeLines)

        const orders = new ListOrders(events)
        const classNames = new ListStylings(events)

        return {activeLines, events, orders, classNames}
    }, [analysis])

    const currentOrder = useMemo(() => orders.get(currentStepIndex), [orders, currentStepIndex])
    const currentClassNames = useMemo(() => classNames.get(currentStepIndex), [classNames, currentStepIndex])
    const currentActiveLines = useMemo(() => activeLines.get(currentStepIndex), [activeLines, currentStepIndex])

    const setActiveLines = useVisualization(state => state.setActiveLines)
    const setStepCount = useVisualization(state => state.setStepCount)

    useEffect(() => {
        setActiveLines(currentActiveLines ?? [])
    }, [setActiveLines, currentActiveLines])

    useEffect(() => {
        setStepCount(orders.length)
    }, [setStepCount, orders])
    

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
