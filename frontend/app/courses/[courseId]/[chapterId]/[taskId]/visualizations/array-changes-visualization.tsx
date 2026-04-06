'use client'

import { useEffect } from 'react'
import { useItemsTimeline } from './use-items-timeline'
import type { ArrayChangesTimeline } from './use-array-changes-timeline'
import { ItemsVisualization } from './items-visualization'

const swapClass = 'bg-sky-200 animate-wiggle'
const replaceClass = 'bg-amber-400 animate-wiggle'

export function ArrayChangesVisualization({ timeline }: { timeline: ArrayChangesTimeline }) {
    const items = useItemsTimeline()

    useEffect(() => {
        timeline.on('set', raw => {
            items.seed(raw)
        })
        timeline.on('swap', raw => {
            items.swap(raw.firstIndex, raw.secondIndex)
        })
        timeline.on('replace', raw => {
            items.replace(raw.index, raw.newValue)
        })

        timeline.before('swap', raw => {
            items.addClass(raw.firstIndex, swapClass)
            items.addClass(raw.secondIndex, swapClass)
        })
        timeline.after('swap', raw => {
            items.removeClass(raw.firstIndex, swapClass)
            items.removeClass(raw.secondIndex, swapClass)
        })

        timeline.before('replace', raw => {
            items.addClass(raw.index, replaceClass)
        })
        timeline.after('replace', raw => {
            items.removeClass(raw.index, replaceClass)
        })
    }, [
        timeline, items
    ])

    return <ItemsVisualization timeline={items} />
}
