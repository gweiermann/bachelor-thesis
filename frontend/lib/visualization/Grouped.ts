import { VisualizationStates } from "./VisualizationStates";

type Unwrap<W> = W extends VisualizationStates<infer U> ? U : never;

export class Grouped<T extends Record<string, VisualizationStates<any>>> {
    static finalize<T extends Record<string, VisualizationStates<any>>>(collections: T) {
        VisualizationStates.shareDeletes(...Object.values(collections))
        VisualizationStates.removeGaps(...Object.values(collections))
        return new Grouped(collections)
    }

    constructor(private children: T) {}

    get length() {
        return Math.max(...Object.values(this.children).map(c => c.length))
    }

    *fullListIter() {
        // this is not really performant but who needs it anyway?
        const length = this.length
        for (let i = 0; i < length; i++) {
            yield this.get(i)
        }
    }

    get(index: number) {
        const result = {} as { [K in keyof T]: Unwrap<T[K]> }
        for (const c in this.children) {
            result[c] = this.children[c].get(index)
        }
        return result
    }
}