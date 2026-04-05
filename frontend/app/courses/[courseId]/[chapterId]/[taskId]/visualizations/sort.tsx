'use client'

import { useArrayChangesTimeline } from './use-array-changes-timeline'
import { ArrayChangesVisualization } from './array-changes-visualization'

/**
 * Sort preset (proposal `sort.tsx`): raw `analysis` arrives via `VisualizationBakingProvider`.
 * `useArrayChangesTimeline` extends base `useTimeline` with swap/replace/set emissions;
 * `ArrayChangesVisualization` wires items + baking recipe.
 */
export default function SortVisualization() {
    const timeline = useArrayChangesTimeline()
    return <ArrayChangesVisualization timeline={timeline} />
}
