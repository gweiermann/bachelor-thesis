import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useMemo } from "react";
import { addAnimationsToSteps, addOrder } from "./post-processors";
import { List } from "@/lib/visualization/List";
import { ListEvents } from "@/lib/visualization/ListEvents";
import { ListItemEnrichment } from "@/lib/visualization/ListItemEnrichment";

export default function SortVisualization({ analysis, timePerStep, currentStepIndex}) {
    const { orders, classNames } = useMemo(() => {
        const array = new List(analysis as any, 'array')
        const events = new ListEvents(array)
        const orders = new ListItemEnrichment(events, () => {
            let id = 0
            return {
                init(array) {
                    return array.map(value => ({ id: ++id, orderId: id, value }))
                },
                replace(item, index, withValue) {
                    return { ...item, value: withValue, id: ++id }
                },
                swap(first, second){
                    return {
                        first: first.item,
                        second: second.item
                    }
                }
            }
        })
        const classNames = new ListItemEnrichment(events, () => ({
            init(array) {
                return array.map(i => [] as string[])
            },
            preEvent(eventName, items) {
                return items.map(item => []) // clear with each event
            },
            replace(classes, index, withValue) {
                return ['bg-amber-400']
            },
            swap(first, second){
                return {
                    first: ['bg-sky-200'],
                    second: ['bg-sky-200']
                }
            }
        }))
        return { orders, classNames }
    }, [analysis])

    const currentOrder = useMemo(() => orders.getLatest(currentStepIndex), [orders, currentStepIndex])
    const currentClassNames = useMemo(() => classNames.getLatest(currentStepIndex), [classNames, currentStepIndex])

    console.log('orders', orders.getFullList())
    console.log('classNames', classNames.getFullList())

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
