import { VisualizationStates, Result, State } from "./VisualizationStates"

export abstract class Preprocessor<In, Out> extends VisualizationStates<Out> {
    constructor(steps: VisualizationStates<In>) {
        super()
        this.process(steps)
    }

    process(steps: VisualizationStates<In>): this {
        const resultList: Result<Out>[] = []
        const allSteps = steps.resultList.map(r => r.state)
        allSteps.forEach((step, index) => {
            const state = this.next(step, resultList.map(r => r.state), allSteps, index)

            if (!state) {
                return
            }

            for (const operation of state.deleteOperations) {
                resultList.splice(resultList.length + operation.relativeIndex, 1)
            }

            if (state.resultOperations.length > 1) {
                throw new Error("Multiple result operations are not supported")
            }

            for (const operation of state.resultOperations) {
                resultList.push({ index, state: operation.data, events: state.events })
            }
        })
        this.resultList = resultList
        return this
    }

    abstract next(currentStep: In, previousStates: Out[], allSteps: In[], index: number): State<Out>
}