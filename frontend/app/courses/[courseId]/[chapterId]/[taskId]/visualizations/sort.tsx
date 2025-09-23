import { cn } from "@/lib/utils";
import { List } from "@/lib/visualization/List";
import { ListEvents } from "@/lib/visualization/ListEvents";
import { ListOrders } from "@/lib/visualization/ListOrders";
import { ListStylings } from "@/lib/visualization/ListStylings";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useMemo } from "react";





export default function SortVisualization({ analysis, timePerStep, currentStepIndex}) {
    const { orders, classNames } = useMemo(() => {
        const array = new List(analysis as any, 'array')
        const events = new ListEvents(array)
        const orders = new ListOrders(events)
        const classNames = new ListStylings(events)
        return { orders, classNames }
    }, [analysis])

    const currentOrder = useMemo(() => orders.getLatest(currentStepIndex), [orders, currentStepIndex])
    const currentClassNames = useMemo(() => classNames.getLatest(currentStepIndex), [classNames, currentStepIndex])

    useEffect(() => {
        console.log('orders', orders.getFullList())
        console.log('classNames', classNames.getFullList())
    }, [orders, classNames])

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
