interface Result<T> {
    index: number,
    state: T
}

export abstract class VisualizationPreparer<T> {
    public resultList: Result<T>[]
    public length: number = 0;

    *fullListIter() {
        let lastIndex = 0
        for (const result of this.resultList) {
            for (; lastIndex < result.index; lastIndex += 1) {
                yield result.state
            }
        }
        for (; lastIndex < this.length; lastIndex += 1) {
            yield this.resultList[this.resultList.length - 1].state
        }
    }

    getFullList() {
        return [...this.fullListIter()]
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
}

export abstract class Preprocessor<T, R> extends VisualizationPreparer<R> {
    constructor(steps: Record<string, T>[], key: string) {
        super()
        this.process(steps, key)
    }

    process(steps: Record<string, T>[], key: string): Preprocessor<T, R> {
        const resultList: Result<R>[] = []
        steps.forEach((step, index) => {
            if (!(key in step)) {
                return
            }

            const state = this.next(resultList.map(r => r.state), step[key])

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
        return this
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