interface Result<T> {
    index: number,
    state: T
}

export abstract class Collector<T, R> {
    private resultList: Result<R>[]

    constructor(private key: string) { }

    process(steps: Record<string, T>[]): void {
        const resultList: Result<R>[] = []
        steps.forEach((step, index) => {
            if (!(this.key in step)) {
                return
            }
            
            const state = this.next(resultList.map(r => r.state), step[this.key])

            for (const operation of state.deleteOperations) {
                resultList.splice(resultList.length + operation.relativeIndex, 1)
            }

            if (state.resultOperations.length > 1) {
                throw new Error("Multiple result operations are not supported")
            }

            for (const operation of state.resultOperations) {
                resultList.push({ index, state: operation.data })
            }
        })
        this.resultList = resultList
    }

    get(index: number) {
        return this.resultList.find(state => state.index === index)
    }

    // returns a state that is the latest in the result list which index is <= the given index
    getLatest(index: number) {
        let previous = null
        for (const result of this.resultList) {
            if (result.index === index) {
                return result.state
            }
            if (result.index > index) {
                return previous
            }
            previous = result.state
        }
    }

    abstract next(previousStates: R[], currentStep: T): State<R>
}

interface ResultOperation<T> {
    data: T
}

interface DeleteOperation {
    relativeIndex: number
}

export class State<T> {
    public resultOperations: ResultOperation<T>[] = []
    public deleteOperations: DeleteOperation[] = []

    result(data: T) {
        this.resultOperations.push({ data })
        return this
    }

    delete(relativeIndex: number) {
        if (relativeIndex >= 0) {
            throw new Error('delete operation can only delete entries in past')
        }
        this.deleteOperations.push({ relativeIndex })
        return this
    }

    skip() {
        return this
    }
}