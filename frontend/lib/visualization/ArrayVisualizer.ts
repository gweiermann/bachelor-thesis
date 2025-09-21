import { ArrayWatcher } from "./ArrayWatcher"
import { derive } from './derive'


interface State {
    order: {
        id: number,
        orderId: number,
        item: number
    }
}

export const ArrayVisualizer = derive<ArrayWatcher, State>(collector => {
    let id = 0
    return [
        collector.hook('init', (state, { array }) => ({ order: array.map(item => ({ id: ++id, orderId: id, item })) })),
        collector.hook('replace', (state, { event }) => {
            const order = state.order.slice()
            order[event.index].id = ++id
            return { ...state, order }
        }),
        collector.hook('swap', (state, { event }) => {
            const order = state.order.slice()
            const temp = order[event.from.index]
            order[event.from.index] = order[event.to.index]
            order[event.to.index] = temp
        }),
    ]
})


