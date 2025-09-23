import { Derived } from "./Derived"
import { ListEventName, ListEvents } from "./ListEvents"

export class ListItemEnrichment<T> extends Derived<T[]> {
    constructor(collector: ListEvents, handlers: () => {
        init: (array: number[]) => T[],
        replace: (item: T, index: number, withValue: number) => T,
        swap: (first: { item: T, index: number }, second: { item: T, index: number}) => { first: T, second: T },
        preEvent?: (eventName: 'replace' | 'swap', items: T[]) => T[]
    }) {
        super(set => {
            const actualHandlers = handlers()
            collector.on('init', arrayState => set(() => {
                if (arrayState.event !== 'init') {
                    throw Error('unreachable') // for type assertion
                }
                return actualHandlers.init(arrayState.array)
            }))

            collector.on('replace', arrayState => set(state => {
                if (arrayState.event !== 'replace') {
                    throw Error('unreachable') // for type assertion
                }
                const clonedItems = state.slice()
                const preppedItems = actualHandlers.preEvent?.('replace', clonedItems) ?? clonedItems
                preppedItems[arrayState.index] = actualHandlers.replace(preppedItems[arrayState.index], arrayState.index, arrayState.to)
                return preppedItems
            }))

            collector.on('swap', arrayState => set(state => {
                if (arrayState.event !== 'swap') {
                    throw Error('unreachable') // for type assertion
                }
                const clonedItems = state.slice()
                const preppedItems = actualHandlers.preEvent?.('swap', clonedItems) ?? clonedItems
                // swap:
                const { first, second } = actualHandlers.swap(
                    {
                        item: preppedItems[arrayState.first.index],
                        index: arrayState.first.index
                    },
                    {
                        item: preppedItems[arrayState.second.index],
                        index: arrayState.second.index
                    },
                )
                preppedItems[arrayState.first.index] = second
                preppedItems[arrayState.second.index] = first
                return preppedItems
            }))
        })
    }
}