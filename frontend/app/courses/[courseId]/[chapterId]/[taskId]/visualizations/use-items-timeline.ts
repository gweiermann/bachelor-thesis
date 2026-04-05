'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { useTimeline } from './use-timeline'

export type Item = {
    value: number
    id: number
    orderId: number
    classList: string[]
}

type ItemsEvents = {
    set: Item[],
    swap: { index1: number, index2: number },
    replace: { index: number, newValue: number },
    addClass: { index: number, className: string },
    removeClass: { index: number, className: string }
}

export function useItemsTimeline() {
    const timeline = useTimeline<ItemsEvents>()
    const [id, setId] = useState(0)
    
    return {
        ...timeline,
        set: (rawItems) => {
            setId(id => id + 1)
            timeline.set(rawItems.map((num, index) => ({
                value: num,
                id,
                orderId: index,
                classList: []
            })))
        },
        swap: ({index1, index2}) => {
            timeline.set((current) => {
            const temp = current[index1]
                current[index1] = current[index2]
                current[index2] = temp
                return current
            })
        },
        replace: ({index, newValue}) => {
            timeline.set((current) => {
                current[index].value = newValue
                setId(id => id + 1)
                current[index].id = id
                return current
            })
        },
        addClass: ({index, className}) => {
            timeline.set((current) => {
                current[index].classList.push(className)
                return current
            })
        },
        removeClass: ({index, className}) => {
            timeline.set((current) => {
                current[index].classList = current[index].classList.filter(cls => cls !== className)
                return current
            })
        }
    }
}

export type ItemsTimeline = ReturnType<typeof useItemsTimeline>
