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
    console.log("step", steps)
    return null
}
