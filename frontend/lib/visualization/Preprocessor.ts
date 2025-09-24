import { VisualizationStates, State } from "./VisualizationStates"

export abstract class Preprocessor<In, Out> extends VisualizationStates<Out> {

    constructor(protected steps: VisualizationStates<In>, initialState?: Out) {
        super(initialState)
        this.process(steps)
    }

    
    static map<In, Out>(states: VisualizationStates<In>, mapPredicate: (state: In) => Out, initialState: Out = null) {
        return new class extends Preprocessor<In, Out> {
            constructor(states: VisualizationStates<In>) {
                super(states, initialState)
            }
            next(step: In) {
                const result = mapPredicate(step)
                return new State<Out>().result(result)
            }
        }(states)
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

export function mapStates<In, Out>(steps: VisualizationStates<In>, mapPredicate: (state: In) => Out, initialState: Out = null) {
    return new class extends Preprocessor<In, Out> {
        constructor(states: VisualizationStates<In>) {
            super(states, initialState)
        }
        next(step: In) {
            const result = mapPredicate(step)
            return new State<Out>().result(result)
        }
    }(steps)
}



