import { ListEvent } from "./ListEvents"
import { Preprocessor } from "./Preprocessor"
import { State } from "./VisualizationStates"

export function transformByEvent<T>(event: ListEvent, listToBeTransformed: T[], handlers: {
    replace?: (item: T, newValue: number) => T,
    swap?: (first: T, second: T) => { first: T, second: T }
} = {}) {
    const result = listToBeTransformed.slice()
    handlers.replace ??= item => item
    handlers.swap ??= (first, second) => ({ first, second })
    if (event.type === 'replace') {
        result[event.index] = handlers.replace(result[event.index], event.to)
    }
    if (event.type === 'swap') {
        const i1 = event.first.index
        const i2 = event.second.index
        const { first, second } = handlers.swap(result[i1], result[i2])
        result[i1] = second
        result[i2] = first
    }
    return result
}

type ListOrderState = { id: number, orderId: number, value: number }[]

export class ListOrders extends Preprocessor<ListEvent, ListOrderState> {
    private id: number

    next(event: ListEvent, index: number) {
        // TODO: find a better solution:
        this.id ??= 0 // because next() will be called in super and this.id can't be initialized before

        if (event.type === 'init') {
            const result = event.array.map(value => ({ id: ++this.id, orderId: this.id, value }))
            return new State<ListOrderState>().result(result)
        } else {

            const result = transformByEvent(event, this.get(index - 1), {
                replace: (item, newValue) => {
                    return {
                        ...item,
                        id: ++this.id,
                        value: newValue
                    }
                }
            })
            return new State<ListOrderState>().result(result)
        }
    }
}

