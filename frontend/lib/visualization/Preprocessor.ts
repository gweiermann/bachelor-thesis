import { VisualizationStates, Result, State } from "./VisualizationStates"

export abstract class Preprocessor<In, Out> extends VisualizationStates<Out> {

    constructor(protected steps: VisualizationStates<In>) {
        super()
        this.process(steps)
    }

    process(steps: VisualizationStates<In>): this {
        steps.resultList.forEach(({ state: step, index }) => {
            const state = VisualizationStates.withContext(
                index,
                () => this.next(step)
            )

            if (!state) {
                return
            }

            for (const operation of state.deleteOperations) {
                const index = this.resultList.length + operation.relativeIndex
                const globalIndex = this.resultList[index].index
                this.resultList.splice(index, 1)
                this.deleteList.push(globalIndex)
            }

            if (state.resultOperations.length > 1) {
                throw new Error("Multiple result operations are not supported")
            }

            
            for (const operation of state.resultOperations) {
                this.resultList.push({ index, state: operation.data, events: state.events })
            }
        })
        return this
    }

    abstract next(currentStep: In): State<Out>
}