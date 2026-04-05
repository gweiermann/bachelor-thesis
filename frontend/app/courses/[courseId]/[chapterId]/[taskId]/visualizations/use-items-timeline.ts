'use client'

import { useMemo, useRef } from 'react'
import { useTimeline } from './use-timeline'

export type Item = {
    value: number
    id: number
    orderId: number
    classList: string[]
}

type ItemsEvents = {
    set: Item[]
}

export function useItemsTimeline() {
    const timeline = useTimeline<ItemsEvents>()
    const nextId = useRef(0)
    
    return useMemo(() => ({
        ...timeline,
        set: (rawItems: number[]) => {
            timeline.emit('set', rawItems.map((num, index) => ({
                value: num,
                id: nextId.current++,
                orderId: index,
                classList: []
            })))
        },
        swap: (firstIndex: number, secondIndex: number) => {
            timeline.emit('set', (current) => {
                const temp = current[firstIndex]
                current[firstIndex] = current[secondIndex]
                current[secondIndex] = temp
                return current
            })
        },
        replace: (index: number, newValue: number) => {
            timeline.emit('set', (current) => {
                current[index].value = newValue
                current[index].id = nextId.current++
                return current
            })
        },
        addClass: (index: number, className: string) => {
            timeline.emit('set', (current) => {
                current[index].classList.push(className)
                return current
            })
        },
        removeClass: (index: number, className: string) => {
            timeline.emit('set', (current) => {
                current[index].classList = current[index].classList.filter(cls => cls !== className)
                return current
            })
        }
    }), [timeline, nextId])
}

export type ItemsTimeline = ReturnType<typeof useItemsTimeline>
