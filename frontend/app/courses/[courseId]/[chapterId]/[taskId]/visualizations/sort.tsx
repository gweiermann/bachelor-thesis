'use client'

import { useArrayChangesTimeline } from './use-array-changes-timeline'
import { ArrayChangesVisualization } from './array-changes-visualization'
import { Timeline } from './use-timeline'

type Collector<TKey extends string, TValue> = { [key in TKey]: TValue }

type ArrayWatcherCollector = Collector<'arrayWatcher', number[]>

export interface SortVisualizationProps {
    steps: Timeline<ArrayWatcherCollector>
}

export default function SortVisualization({ steps }: SortVisualizationProps) {
    const timeline = useArrayChangesTimeline()
    steps.once('arrayWatcher', (array) => timeline.seedArray(array))

    steps.chunked('arrayWatcher', 2, ([ array, array2 ]) => {
        const comparison = compareArrays(array, array2)
        if (comparison.reason === 'swap') {
            timeline.swap(comparison.firstIndex, comparison.secondIndex) // swap event references this whole group as one step 
        }
        else if (comparison.reason === 'replace') {
            timeline.replace(comparison.index, comparison.newValue)
        }
        else {
            throw new Error(`Unknown comparison reason: ${comparison.reason}`)
        }
    })

    return (
        <ArrayChangesVisualization timeline={timeline} />
    )
}
