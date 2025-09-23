import { Derived } from "./Derived"
import { ListEvents } from "./ListEvents"

type State = {
    id: number,
    orderId: number,
    item: number
}[]

export class ListOrders extends Derived<State> {
    constructor(collector: ListEvents) {
        super(set => {
            let id = 0

            collector.on('init', arrayState => set(state => {
                if (arrayState.event !== 'init') {
                    throw Error('unreachable') // for type assertion
                }
                return arrayState.array.map(item => ({ id: ++id, orderId: id, item }))
            }))

            collector.on('replace', arrayState => set(state => {
                if (arrayState.event !== 'replace') {
                    throw Error('unreachable') // for type assertion
                }
                const order = state.slice()
                order[arrayState.index].item = arrayState.to
                order[arrayState.index].id = ++id
                return order
            }))

            collector.on('swap', arrayState => set(state => {
                if (arrayState.event !== 'swap') {
                    throw Error('unreachable') // for type assertion
                }
                const order = state.slice()
                // swap:
                const temp = order[arrayState.first.index]
                order[arrayState.first.index] = order[arrayState.second.index]
                order[arrayState.second.index] = temp
                return order
            }))
        })
    }
}