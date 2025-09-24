import { Result, VisualizationStates } from "./VisualizationStates";

export type HasKey<K extends PropertyKey, T> = { [P in K]: T };

export abstract class Collector<In, Out, Key extends string> extends VisualizationStates<Out> {
    constructor(steps: HasKey<Key, In>[], key: Key) {
        super()

        this.resultList = steps
            .map((stepRaw, index) => {
                const step = stepRaw[key]
                if (!step) {
                    return null
                }
                return { index, events: [] as string[], state: this.transform(step) } satisfies Result<Out>
            })
            .filter(Boolean)
    }

    abstract transform(currentStep: In): Out
}