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
        const classNameMapping = {
            replace: 'bg-amber-400 ',
            swap: 'bg-sky-200 ',
            upcoming: 'border-2 border-dashed animate-wiggle '
        }

        // TODO: find a better solution:
        /// always start with empty class names.
        /// To assess the amount of elements in the array we utilise the fact that the actual array is shown on an 'init' event.
        /// When 'init' is hit it initializes the first state.
        /// If it's not empty the previous state `this.get(-1)` holds an array with the same size so we can also use it to initialize an empty class names array
        const result = event.type === 'init' ?
            event.array.map(() => '') : this.get(-1).map(() => '')

        if (event.type === 'replace') {
            result[event.index] = classNameMapping.replace
        } else if (event.type === 'swap') {
            result[event.first.index] = classNameMapping.swap
            result[event.second.index] = classNameMapping.swap
        }

        const upcomingEvent = this.steps.getReal(+1)
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