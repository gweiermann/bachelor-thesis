'use client'

import { useMemo, useRef } from 'react'
import { useTimeline } from './use-timeline'

export type Item = {
    value: number
    id: number
    orderId: number
    classList: string[]
}

/** No string-keyed timeline events; displayed state uses `TIMELINE_CURRENT` via `emitCurrent` / `current`. */
type ItemsStringEvents = Record<string, never>

function mustHaveItems(current: Item[] | null): Item[] {
    if (current === null) {
        throw new Error('useItemsTimeline: call seed() before mutating items')
    }
    return current
}

export function useItemsTimeline() {
    const timeline = useTimeline<ItemsStringEvents, Item[]>()
    const nextId = useRef(0)

    return useMemo(() => ({
        ...timeline,
        /** Initialize items from raw numbers (`timeline.set` registers listeners on `TIMELINE_CURRENT`, not this). */
        seed: (rawItems: number[]) => {
            timeline.set(rawItems.map((num, index) => ({
                value: num,
                id: nextId.current++,
                orderId: index,
                classList: [] as string[]
            })))
        },
        swap: (firstIndex: number, secondIndex: number) => {
            timeline.set((current) => {
                const items = mustHaveItems(current)
                const temp = items[firstIndex]
                items[firstIndex] = items[secondIndex]
                items[secondIndex] = temp
                return items
            })
        },
        replace: (index: number, newValue: number) => {
            timeline.set((current) => {
                const items = mustHaveItems(current)
                items[index].value = newValue
                items[index].id = nextId.current++
                return items
            })
        },
        addClass: (index: number, className: string) => {
            timeline.set((current) => {
                const items = mustHaveItems(current)
                items[index].classList.push(className)
                return items
            })
        },
        removeClass: (index: number, className: string) => {
            timeline.set((current) => {
                const items = mustHaveItems(current)
                items[index].classList = items[index].classList.filter(cls => cls !== className)
                return items
            })
        }
    }), [timeline, nextId])
}

export type ItemsTimeline = ReturnType<typeof useItemsTimeline>
