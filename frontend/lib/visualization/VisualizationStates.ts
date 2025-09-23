export interface Result<T> {
    index: number,
    state: T,
    events: string[]
}

export abstract class VisualizationStates<T> {
    static currentHookIndex: number | null = null
    public resultList: Result<T>[]
    public length: number = 0;

    *fullListIter() {
        let lastIndex = 0
        for (const result of this.resultList) {
            for (; lastIndex <= result.index; lastIndex += 1) {
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

    getList() {
        return this.resultList.map(r => r.state)
    }

    get(index: number) {
        return this.resultList.find(state => state.index === index)?.state
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

    on(eventName: string, callback: (state: T, index: number) => void) {
        this.resultList.forEach(result => {
            if (result.events.includes(eventName)) {
                const prevHookIndex = VisualizationStates.currentHookIndex
                VisualizationStates.currentHookIndex = result.index
                callback(result.state, result.index)
                VisualizationStates.currentHookIndex = prevHookIndex
            }
        })
    }
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
    public events: string[] = []

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

    event(eventName: string) {
        this.events.push(eventName)
        return this
    }
}