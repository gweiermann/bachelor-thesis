'use client'

import { useMemo } from 'react'
import { useTimeline, type TimelineApi } from './use-timeline'

/**
 * Thin domain layer on {@link useTimeline} (proposal `use-array-changes-timeline.ts`):
 * swap / replace / seedArray → `emit` with typed payloads.
 */
export function useArrayChangesTimeline(): ArrayChangesTimeline {
    const timeline = useTimeline()

    return useMemo(
        (): ArrayChangesTimeline => ({
            ...timeline,
            swap(firstIndex: number, secondIndex: number, rawIndex: number) {
                timeline.emit('swap', { firstIndex, secondIndex }, { rawIndex })
            },
            replace(index: number, newValue: number, rawIndex: number) {
                timeline.emit('replace', { index, newValue }, { rawIndex })
            },
            seedArray(arr: number[], rawIndex = 0) {
                timeline.emit('set', arr, { rawIndex })
            },
        }),
        [timeline]
    )
}

export type ArrayChangesTimeline = TimelineApi & {
    swap: (firstIndex: number, secondIndex: number, rawIndex: number) => void
    replace: (index: number, newValue: number, rawIndex: number) => void
    seedArray: (arr: number[], rawIndex?: number) => void
}
