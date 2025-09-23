import { ListEvent, ListEvents } from "./ListEvents"
import { transformByEvent } from "./ListOrders"
import { Preprocessor } from "./Preprocessor"
import { State } from "./VisualizationStates"

type ListStylingState = string[] // class names

export class ListStylings extends Preprocessor<ListEvent, ListStylingState> {
    private id: number

    constructor(events: ListEvents) {
        super(events)
    }

    next(event: ListEvent) {
        // TODO: find a better solution
        this.id ??= 0 // because next() will be called in super and this.id can't be initialized before

        const classNameMapping = {
            replace: 'bg-amber-400 ',
            swap: 'bg-sky-200 ',
            upcoming: 'border-2 border-dashed animate-wiggle '
        }

        // always start with empty class names. Initialize size of array on 'init'
        // TODO: find a better solution
        const result = event.type === 'init' ?
            event.array.map(() => '') : this.get(-1).map(() => '')

        if (event.type === 'replace') {
            result[event.index] = classNameMapping.replace
        } else if (event.type === 'swap') {
            result[event.first.index] = classNameMapping.swap
            result[event.second.index] = classNameMapping.swap
        }

        const upcomingEvent = this.steps.getReal(+2)
        if (upcomingEvent) {
            if (upcomingEvent.type === 'replace') {
                result[upcomingEvent.index] += classNameMapping.upcoming
            } else if (upcomingEvent.type === 'swap') {
                result[upcomingEvent.first.index] += classNameMapping.upcoming
                result[upcomingEvent.second.index] += classNameMapping.upcoming
            }
        }

        transformByEvent(event, result)

        return new State<ListStylingState>().result(result)
    }
}