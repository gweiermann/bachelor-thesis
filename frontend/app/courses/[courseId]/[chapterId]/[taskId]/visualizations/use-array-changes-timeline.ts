'use client'

import { useMemo } from 'react'
import { useTimeline, type TimelineApi } from './use-timeline'

export type ArrayChangesEvents = {
    set: number[]
    swap: { firstIndex: number; secondIndex: number }
    replace: { index: number; newValue: number }
}

/**
 * Thin domain layer on {@link useTimeline} (proposal `use-array-changes-timeline.ts`):
 * swap / replace / seedArray → `emit` with typed payloads.
 */
export function useArrayChangesTimeline(): ArrayChangesTimeline {
    const timeline = useTimeline<ArrayChangesEvents>()

    return useMemo(
        (): ArrayChangesTimeline => ({
            ...timeline,
            swap(firstIndex: number, secondIndex: number) {
                timeline.emit('swap', { firstIndex, secondIndex })
            },
            replace(index: number, newValue: number) {
                timeline.emit('replace', { index, newValue })
            },
            seedArray(arr: number[]) {
                timeline.emit('set', arr)
            },
        }),
        [timeline]
    )
}   

export type ArrayChangesTimeline = TimelineApi<ArrayChangesEvents> & {
    swap: (firstIndex: number, secondIndex: number) => void
    replace: (index: number, newValue: number) => void
    seedArray: (arr: number[]) => void
}
