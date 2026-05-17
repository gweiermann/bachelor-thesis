'use client'

import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
    type MutableRefObject,
    type ReactNode,
} from 'react'
import type { AnalysisResult } from '@/lib/build'

export type BakingRecipe = {
    reset: () => void
    bake: () => void
}

type VisualizationBakingContextValue = {
    analysis: AnalysisResult
    currentStepIndex: number
    currentRawIndex: number
    forward: () => void
    backward: () => void
    timePerStep: number
    recipesRef: { current: BakingRecipe[] }
    registerBakingRecipe: (recipe: BakingRecipe) => void
    globalSteps: () => Generator<{ globalIndex: number, rawIndex: number, groupSize: number }>
    reset: () => void
    wrappedIndexRef: MutableRefObject<number>
    wrapWithIndex: (rawIndex: number, innerFunction: () => unknown) => unknown
    createGroup: (rawIndex: number, groupSize: number) => void
    getGroup: (rawIndex: number) => Group
    /** rawIndex -> groupSize; only entries with groupSize > 1 are stored */
    groupsRef: MutableRefObject<Map<number, number>>
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
    const cachedGroupRef = useRef<Group | null>(null)
    const [currentRawIndex, setCurrentRawIndex] = useState<number>(0)
    const [currentStepIndex, setCurrentStepIndex] = useState<number>(0)
    const wrappedIndexRef = useRef<number>(0)

    const registerBakingRecipe = useCallback((recipe: BakingRecipe) => {
        console.log('recipe has been registered', recipe)
        recipesRef.current.push(recipe)
    }, [recipesRef])

    const getGroup = useCallback((rawIndex: number): Group => {
        const cached = cachedGroupRef.current
        let i = (cached !== null && cached.rawIndex <= rawIndex) ? cached.rawIndex : 0
        let stepIndex = (cached !== null && cached.rawIndex <= rawIndex) ? cached.stepIndex : 0
        while (i < analysis.length) {
            const groupSize = groupsRef.current.get(i) ?? 1
            if (rawIndex >= i && rawIndex < i + groupSize) {
                const group = { rawIndex: i, stepIndex, size: groupSize }
                cachedGroupRef.current = group
                return group
            }
            stepIndex += 1
            i += groupSize
        }
        throw new Error(`rawIndex ${rawIndex} out of bounds (max value can be ${analysis.length - 1})`)
    }, [analysis, groupsRef])

    const createGroup = useCallback((rawIndex: number, groupSize: number) => {
        for (let i = rawIndex; i < rawIndex + groupSize; ++i) {
            const existingGroup = getGroup(i)
            if (existingGroup.size > 1) {
                // a group actually exists
                // TODO: explore which overlaps would actually be okay and allow them
                throw new Error(`When creating a group: overlaps aren't allowed.`)
            }
        }
        console.log('createGroup', rawIndex, groupSize)
        groupsRef.current.set(rawIndex, groupSize)
    }, [groupsRef, getGroup])

    const forward = useCallback(() => {
        setCurrentStepIndex(prev => prev + 1)
        setCurrentRawIndex(prev => prev + getGroup(prev).size)
    }, [getGroup, setCurrentStepIndex, setCurrentRawIndex])

    const backward = useCallback(() => {
        setCurrentStepIndex(prev => prev - 1)
        setCurrentRawIndex(prev => prev - getGroup(prev - 1).size)
    }, [getGroup, setCurrentStepIndex, setCurrentRawIndex])

    const wrapWithIndex = useCallback(<T = unknown>(rawIndex: number, innerFunction: () => T): T => {
        const tmp = wrappedIndexRef.current
        wrappedIndexRef.current = rawIndex
        const result = innerFunction()
        wrappedIndexRef.current = tmp
        return result
    }, [])

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
    }, [analysis, groupsRef])

    const reset = useCallback(() => {
        recipesRef.current.forEach(recipe => recipe.reset())
        groupsRef.current.clear()
        cachedGroupRef.current = null
        wrappedIndexRef.current = 0
        console.log('reset visualization baking')
    }, [recipesRef, groupsRef])

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
            wrappedIndexRef,
            wrapWithIndex,
            createGroup,
            getGroup,
            groupsRef,
        }),
        [analysis,
            currentStepIndex,
            currentRawIndex,
            forward,
            backward,
            timePerStep,
            recipesRef,
            registerBakingRecipe,
            globalSteps,
            reset,
            wrappedIndexRef,
            wrapWithIndex,
            createGroup,
            getGroup,
            groupsRef,
        ]
    )

    return (
        <VisualizationBakingContext.Provider value={value}>{children}</VisualizationBakingContext.Provider>
    )
}
