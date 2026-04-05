'use client'

import { useCallback, useMemo, useRef, useState } from 'react'

export type Item = {
    value: number
    id: number
    orderId: number
    classList: string[]
}

export function useItemsVisualization() {
    const [items, setItems] = useState<Item[] | null>(null)
    const idCounter = useRef(0)

    const reset = useCallback(() => {
        idCounter.current = 0
        setItems(null)
    }, [])

    const set = useCallback((rawItems: number[] | ((prev: Item[]) => Item[])) => {
        if (typeof rawItems === 'function') {
            setItems(prev => {
                const base = prev ?? []
                const next = rawItems(base)
                return next
            })
            return
        }
        setItems(
            rawItems.map((num, index) => ({
                value: num,
                id: idCounter.current++,
                orderId: index,
                classList: [],
            }))
        )
    }, [])

    const swap = useCallback((index1: number, index2: number) => {
        setItems(prev => {
            if (!prev) return prev
            const next = [...prev]
            const temp = next[index1]
            next[index1] = next[index2]
            next[index2] = temp
            return next
        })
    }, [])

    const replace = useCallback((index: number, newValue: number) => {
        setItems(prev => {
            if (!prev) return prev
            const next = [...prev]
            next[index] = {
                ...next[index],
                value: newValue,
                id: idCounter.current++,
            }
            return next
        })
    }, [])

    const addClass = useCallback((index: number, className: string) => {
        setItems(prev => {
            if (!prev) return prev
            const next = [...prev]
            next[index] = {
                ...next[index],
                classList: [...next[index].classList, className],
            }
            return next
        })
    }, [])

    const removeClass = useCallback((index: number, className: string) => {
        setItems(prev => {
            if (!prev) return prev
            const next = [...prev]
            next[index] = {
                ...next[index],
                classList: next[index].classList.filter(c => c !== className),
            }
            return next
        })
    }, [])

    return useMemo(
        () => ({
            current: items ?? [],
            set,
            swap,
            replace,
            addClass,
            removeClass,
            reset,
        }),
        [items, set, swap, replace, addClass, removeClass, reset]
    )
}

export type ItemsVisualizationTimeline = ReturnType<typeof useItemsVisualization>
