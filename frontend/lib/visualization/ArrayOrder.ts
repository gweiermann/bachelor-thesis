import { ArrayWatcher } from "./ArrayWatcher"
import { Derived } from "./Derived"

interface State {
    order: {
        id: number,
        orderId: number,
        item: number
    }[]
}

export class ArrayOrder extends Derived<State> {
    constructor(collector: ArrayWatcher) {
        super(set => {
            let id = 0

            collector.on('init', ({ array }) => set({
                order: array.map(item => ({ id: ++id, orderId: id, item }))
            }))

            collector.on('replace', arrayState => set(state => {
                if (arrayState.event !== 'replace') {
                    throw Error('unreachable') // for type assertion
                }
                const order = state.order.slice()
                order[arrayState.index].item = arrayState.to
                order[arrayState.index].id = ++id
                return { order }
            }))

            collector.on('swap', arrayState => set(state => {
                if (arrayState.event !== 'swap') {
                    throw Error('unreachable') // for type assertion
                }
                const order = state.order.slice()
                // swap:
                const temp = order[arrayState.first.index]
                order[arrayState.first.index] = order[arrayState.second.index]
                order[arrayState.second.index] = temp
                return { order }
            }))
        })
    }
}