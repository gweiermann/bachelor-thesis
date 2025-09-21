import { VisualizationPreparer } from "./Preprocessor";

export type Setter<T> = (value: Value<T>) => void
type Value<T> = T | ((previous: T | null) => T)

export class Derived<T> extends VisualizationPreparer<T> {
    constructor(environment: (set: Setter<T>) => void) {
        super()

        this.resultList = []

        const set = (value: Value<T>) => {
            const index = VisualizationPreparer.currentHookIndex
            
            // find entry with same index or its previouso entry
            let previous = null
            let sameEntry = null
            let i = 0
            for (const entry of this.resultList) {
                if (entry.index >= index) {
                    sameEntry = entry
                    break
                }
                previous = entry
                i += 1
            }

            // get the new state
            let newState
            if (value instanceof Function) {
                const previousValue = sameEntry?.state ?? previous?.state ?? null
                newState = value(previousValue)
            } else {
                newState = value
            }

            // put state into there
            if (sameEntry) {
                this.resultList[i].state = newState
            } else {
                this.resultList.splice(i, 0, { index, state: newState, events: [] })
            }
        }

        environment(set)
    }
}