'use client'

import { useEffect } from 'react'
import { useItemsVisualization } from './use-items-visualization'
import type { ArrayChangesTimeline } from './use-array-changes-timeline'
import { ItemsVisualization } from './proposal-of-event-based-vis'

const swapClass = 'bg-sky-200 animate-wiggle'
const replaceClass = 'bg-amber-400 animate-wiggle'

export function ArrayChangesVisualization({ timeline }: { timeline: ArrayChangesTimeline }) {
    const items = useItemsVisualization()

    useEffect(() => {
        timeline.on('set', raw => {
            items.set(raw as number[])
        })
        timeline.on('swap', raw => {
            const { firstIndex, secondIndex } = raw as { firstIndex: number; secondIndex: number }
            items.swap(firstIndex, secondIndex)
        })
        timeline.on('replace', raw => {
            const { index, newValue } = raw as { index: number; newValue: number }
            items.replace(index, newValue)
        })

        timeline.before('swap', raw => {
            const { firstIndex, secondIndex } = raw as { firstIndex: number; secondIndex: number }
            items.addClass(firstIndex, swapClass)
            items.addClass(secondIndex, swapClass)
        })
        timeline.after('swap', raw => {
            const { firstIndex, secondIndex } = raw as { firstIndex: number; secondIndex: number }
            items.removeClass(firstIndex, swapClass)
            items.removeClass(secondIndex, swapClass)
        })

        timeline.before('replace', raw => {
            const { index } = raw as { index: number }
            items.addClass(index, replaceClass)
        })
        timeline.after('replace', raw => {
            const { index } = raw as { index: number }
            items.removeClass(index, replaceClass)
        })
    }, [
        timeline, items
    ])

    return <ItemsVisualization timeline={items} />
}
