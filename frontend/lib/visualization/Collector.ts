import { Result, VisualizationStates } from "./VisualizationStates";

export abstract class Collector<In, Out> extends VisualizationStates<Out> {
    constructor(steps: Record<string, In>[], key: string) {
        super()

        this.resultList = steps
            .map((stepRaw, index) => {
                const step = stepRaw[key]
                if (!step) {
                    return null
                }
                return { index, events: [], state: this.transform(step) } satisfies Result<Out>
            })
            .filter(Boolean)
    }

    abstract transform(currentStep: In): Out
}