'use client'

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react'
import type { AnalysisResult } from '@/lib/build'

export type BakingRecipe = {
    reset: () => void
    bake: (from: number, to: number) => void
    getLastProcessableKeyframeIndex?: (lastPossibleKeyframeIndex: number) => number
}

type VisualizationBakingContextValue = {
    analysis: AnalysisResult
    currentStepIndex: number
    currentRawIndex: number
    forward: () => void
    backward: () => void
    timePerStep: number
    recipesRef: { current: BakingRecipe[] }
    registerBakingRecipe: (recipe: BakingRecipe) => () => void
    globalSteps: () => Generator<{ globalIndex: number, rawIndex: number, groupSize: number }>
    reset: () => void
    wrappedIndex: number
    wrapWithIndex: (rawIndex: number, innerFunction: () => void) => void
    createGroup: (rawIndex: number, groupSize: number) => void
    getGroup: (rawIndex: number) => Group
}

const VisualizationBakingContext = createContext<VisualizationBakingContextValue | null>(null)

export function useVisualizationBaking() {
    const ctx = useContext(VisualizationBakingContext)
    if (!ctx) {
        throw new Error('useVisualizationBaking must be used within VisualizationBakingProvider')
    }
    return ctx
}

export interface Group {
    stepIndex: number
    rawIndex: number
    size: number
}

export function VisualizationBakingProvider({
    analysis,
    timePerStep,
    children,
}: {
    analysis: AnalysisResult
    timePerStep: number
    children: ReactNode
}) {
    const recipesRef = useRef<BakingRecipe[]>([])
    const groupsRef = useRef<Map<number, number>>(new Map()) // rawIndex -> groupSize (if undefined, groupSize is 1)
    const [cachedGroup, setCachedGroup] = useState<Group | null>(null)
    const [currentRawIndex, setCurrentRawIndex] = useState<number>(0)
    const [currentStepIndex, setCurrentStepIndex] = useState<number>(0)
    const [wrappedIndex, setWrappedIndex] = useState<number>(0)

    const registerBakingRecipe = useCallback((recipe: BakingRecipe) => {
        recipesRef.current = [...recipesRef.current, recipe]
        return () => {
            recipesRef.current = recipesRef.current.filter(r => r !== recipe)
        }
    }, [])

    const getGroup = useCallback((rawIndex: number) => {
        let i = cachedGroup?.rawIndex < rawIndex ? cachedGroup.rawIndex : 0
        let stepIndex = cachedGroup?.rawIndex < rawIndex ? cachedGroup.stepIndex : 0
        while (i < analysis.length) {
            const groupSize = groupsRef.current.get(i) ?? 1
            if (i >= rawIndex && rawIndex < i + groupSize) {
                const group = { rawIndex: i, stepIndex, size: groupSize }
                setCachedGroup(group)
                return group
            }
            stepIndex += 1
            i += groupSize
        }
        throw new Error(`rawIndex ${rawIndex} out of bounds (max value can be ${analysis.length - 1})`)
    }, [cachedGroup, setCachedGroup, groupsRef])

    const createGroup = useCallback((rawIndex: number, groupSize: number) => {
        for (let i = rawIndex; i < rawIndex + groupSize; ++i) {
            const existingGroup = getGroup(i)
            if (existingGroup.size > 1) {
                // a group actually exists
                // TODO: explore which overlaps would actually be okay and allow them
                throw new Error(`When creating a group: overlaps aren't allowed.`)
            }
        }
        groupsRef.current.set(rawIndex, groupSize)
    }, [groupsRef, getGroup])

    const forward = useCallback(() => {
        setCurrentStepIndex(currentStepIndex + 1)
        setCurrentRawIndex(currentRawIndex + getGroup(currentRawIndex).size)
    }, [currentStepIndex, currentRawIndex, setCurrentStepIndex, setCurrentRawIndex])
    const backward = useCallback(() => {
        setCurrentStepIndex(currentStepIndex - 1)
        setCurrentRawIndex(currentRawIndex - getGroup(currentRawIndex - 1).size)
    }, [currentStepIndex, currentRawIndex, setCurrentStepIndex, setCurrentRawIndex])

    const wrapWithIndex = useCallback((rawIndex: number, innerFunction: () => void) => {
        const tmp = wrappedIndex
        setWrappedIndex(rawIndex)
        innerFunction()
        setWrappedIndex(tmp)
    }, [wrappedIndex, setWrappedIndex])

    // currentRawIndex, createGroup, getGroup, wrapWithIndex, wrappedIndex, registerTimeline

    const globalSteps = useCallback(function*() {
        let globalIndex = 0
        for (let rawIndex = 0; rawIndex < analysis.length; globalIndex++) {
            const groupSize = groupsRef.current.get(rawIndex) ?? 1
            yield {
                globalIndex,
                rawIndex,
                groupSize
            }
            rawIndex += groupSize
        }
    }, [groupsRef])

    const reset = useCallback(() => {
        recipesRef.current = []
        groupsRef.current.clear()
        setCachedGroup(null)
        setWrappedIndex(0)
    }, [])

    const value = useMemo(
        () => ({
            analysis,
            currentStepIndex,
            currentRawIndex,
            forward,
            backward,
            timePerStep,
            recipesRef,
            registerBakingRecipe,
            globalSteps,
            reset,
            wrappedIndex,
            wrapWithIndex,
            createGroup,
            getGroup,
            timePerStep
        }),
        [analysis, currentStepIndex, timePerStep, registerBakingRecipe, globalSteps, reset, wrappedIndex, wrapWithIndex, createGroup, getGroup]
    )

    return (
        <VisualizationBakingContext.Provider value={value}>{children}</VisualizationBakingContext.Provider>
    )
}

/**
 * Runs after viz subtree commits so timeline handlers are registered (proposal baking outline).
 * useEffect (not useLayoutEffect) ensures child useEffect registrations run first.
 * With fully received analysis, baking uses lastPossibleKeyframeIndex without chunk blockers (proposal ~90–96).
 */
export function Bake() {
    const { analysis, currentStepIndex, recipesRef } = useVisualizationBaking()

    useEffect(() => {
        for (const recipe of recipesRef.current) {
            recipe.reset()
            const lastPossible = currentStepIndex
            const to = recipe.getLastProcessableKeyframeIndex
                ? recipe.getLastProcessableKeyframeIndex(lastPossible)
                : lastPossible
            recipe.bake(0, to)
        }
    }, [analysis, currentStepIndex, recipesRef])

    return null
}
