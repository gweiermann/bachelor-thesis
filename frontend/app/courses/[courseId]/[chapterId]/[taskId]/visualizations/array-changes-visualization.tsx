'use client'

import { useEffect } from 'react'
import { useItemsTimeline } from './use-items-timeline'
import type { ArrayChangesTimeline } from './use-array-changes-timeline'
import { ItemsVisualization } from './proposal-of-event-based-vis'

const swapClass = 'bg-sky-200 animate-wiggle'
const replaceClass = 'bg-amber-400 animate-wiggle'

export function ArrayChangesVisualization({ timeline }: { timeline: ArrayChangesTimeline }) {
    const items = useItemsTimeline()

    useEffect(() => {
        timeline.on('set', raw => {
            items.set(raw)
        })
        timeline.on('swap', raw => {
            items.swap({ index1: raw.firstIndex, index2: raw.secondIndex })
        })
        timeline.on('replace', raw => {
            items.replace({ index: raw.index, newValue: raw.newValue })
        })

        timeline.before('swap', raw => {
            items.addClass({ index: raw.firstIndex, className: swapClass })
            items.addClass({ index: raw.secondIndex, className: swapClass })
        })
        timeline.after('swap', raw => {
            items.removeClass({ index: raw.firstIndex, className: swapClass })
            items.removeClass({ index: raw.secondIndex, className: swapClass })
        })

        timeline.before('replace', raw => {
            items.addClass({ index: raw.index, className: replaceClass })
        })
        timeline.after('replace', raw => {
            items.removeClass({ index: raw.index, className: replaceClass })
        })
    }, [
        timeline, items
    ])

    return <ItemsVisualization timeline={items} />
}
