'use client'

import { compareArrays } from './compare-arrays'
import { useArrayChangesTimeline } from './use-array-changes-timeline'
import { ArrayChangesVisualization } from './array-changes-visualization'
import { Timeline, useDefineTimelineHandlers } from './use-timeline'

type Collector<TKey extends string, TValue> = { [key in TKey]: TValue }

type ArrayWatcherCollector = Collector<'array', number[]>

export interface SortVisualizationProps {
    steps: Timeline<ArrayWatcherCollector>
}

export default function SortVisualization({ steps }: SortVisualizationProps) {
    const timeline = useArrayChangesTimeline()

    useDefineTimelineHandlers(steps, timeline, () => {
        steps.once('array', (array) => timeline.seedArray(array))

        steps.chunked('array', 2, ([ array, array2 ]) => {
            const comparison = compareArrays(array, array2)
            if (comparison.reason === 'error') {
                throw new Error(comparison.message)
            }
            if (comparison.reason === 'swap') {
                timeline.swap(comparison.firstIndex, comparison.secondIndex) // swap event references this whole group as one step 
            } else {
                timeline.replace(comparison.index, comparison.newValue)
            }
        })
    }, [])

    return (
        <ArrayChangesVisualization timeline={timeline} />
    )
}
