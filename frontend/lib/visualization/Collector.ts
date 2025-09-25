import { HasKey } from "./CollectorTypes";
import { Result, VisualizationStates } from "./VisualizationStates";

export class Collector<A extends HasKey<Key, any>, Key extends string> extends VisualizationStates<A[Key]> {
    public constructor(steps: A[], key: Key) {
        super()

        this.resultList = steps
            .map((stepRaw, index) => {
                const step = stepRaw[key]
                if (!step) {
                    return null
                }
                return { index, state: step } satisfies Result<A[Key]>
            })
            .filter(Boolean)
    }
}