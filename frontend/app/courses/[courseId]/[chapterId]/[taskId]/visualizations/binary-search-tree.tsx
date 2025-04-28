import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useMemo } from "react";
import { addAnimationsToSteps, addOrder } from "./post-processors";

interface BinaryTreeNode {
    value: number;
    left?: BinaryTreeNode;
    right?: BinaryTreeNode;
}

type BinaryTree = BinaryTreeNode[][]

export default function BinarySearchTree({ analysis, timePerStep, currentStepIndex}) {
    const steps = useMemo(() => analysis, [analysis])
    const step = useMemo(() => steps[currentStepIndex], [steps, currentStepIndex])
    const tree = [
        [{value: 1}],
        [{value: 2}, {value: 3}],
        [{value: 4}, {value: 5}, {value: 6}, {value: 7}],
        [{value: 8}, {value: 9}, {value: 10}, {value: 11}, {value: 12}, {value: 13}, {value: 14}, {value: 15}]
    ]
    return (
        <ul className="flex space-x-4">
            {tree.map((level, levelIndex) => (
                <motion.li key={levelIndex} className="flex space-x-4">
                    <ul>
                        {level.map((node, nodeIndex) => (
                            <motion.li
                                key={node.value}
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
                                    transition={{type: 'spring', duration: 0.05, delay: 0.05 * nodeIndex}}
                                    className="relative size-full">
                                    <AnimatePresence initial={false}>
                                        <motion.div
                                            key={node.value}
                                            transition={{ type: 'spring', duration: timePerStep }}
                                            initial={{ y: -100, opacity: 0, scale: 0.5 }}
                                            animate={{ y: 0, opacity: 1, scale: 1 }}
                                            exit={{ y: 100, opacity: 0, scale: 0.5 }}
                                            className={cn(
                                                "absolute size-full border-2 border-black bg-white rounded-sm flex items-center justify-center",
                                                // step.className[levelIndex][nodeIndex]
                                            )}>
                                            {node.value}
                                        </motion.div>
                                    </AnimatePresence>
                                </motion.div>
                            </motion.li>
                        ))}
                    </ul>
                </motion.li>
            ))}
        </ul>
    )
}
