import { VisualizationPreparer } from "./Preprocessor"

export type Hook<From, To> = (index: number) => HookTransformer<From, To> | null
export type HookTransformer<From, To> = (fromState: From, currentState: To) => To 

function *range(to: number) {
    for (let i = 0; i < to; ++i) {
        yield i
    }
}

export function derive<T extends VisualizationPreparer<To>, From, To>(hookGenerator: (collector: T) => Hook<From, To>[]) {
    return class extends VisualizationPreparer<To> {
        constructor(private collector: T) {
            super()
            const hooks = hookGenerator(collector)
            let currentState = {} as To
            this.resultList = collector.getFullList()
                .map((themState, index) => {
                    hooks.forEach(hook => currentState = hook(index)(themState, currentState))
                    return { index, state: currentState }
                })
        }
    }
}

