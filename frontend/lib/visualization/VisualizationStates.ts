export interface Result<T> {
    index: number,
    state: T,
}

export abstract class VisualizationStates<T> {
    public resultList: Result<T>[] = []
    public deleteList: number[] = [] // list of indices that got deleted whilst generating the resultList and other operations

    // if there are index gaps these gaps are closed through modifying all of the indices
    static removeGaps(...stateCollections: VisualizationStates<any>[]) {   
        let nextIndex = 0
        const maxLen = Math.max(...stateCollections.map(c => c.resultList[c.resultList.length - 1].index + 1))
        // generate a lookup table `offsetList` that shrinks all 
        const offsetList = new Array(maxLen).fill(0)
        const indices = stateCollections
            .flatMap(c => c.resultList.map(r => r.index))
            .toSorted((a, b) => a - b)
        indices.forEach(index => {
            if (nextIndex < index) {
                const diff = index - nextIndex
                for (let i = index; i < offsetList.length; i++) {
                    offsetList[i] += diff
                }
                nextIndex = index + 1
            }
            if (index === nextIndex) {
                nextIndex += 1
            }
        })
        // shrink all resultLists
        stateCollections.forEach(c => c.resultList.forEach(r => r.index -= offsetList[r.index]))
    }

    static shareDeletes(...stateCollections: VisualizationStates<any>[]) {
        const set = new Set(stateCollections.flatMap(c => c.deleteList))
        stateCollections.forEach(c => c.resultList = c.resultList.filter(r => !set.has(r.index)))
    }

    static shareDeletesAndRemoveGaps(...stateCollections: VisualizationStates<any>[]) {
        VisualizationStates.shareDeletes(...stateCollections)
        VisualizationStates.removeGaps(...stateCollections)
    }

    static export<O extends Record<PropertyKey, VisualizationStates<any>>>(stateCollections: O): O {
        const values = Object.values(Object.values(stateCollections))
        VisualizationStates.shareDeletes(...values)
        VisualizationStates.removeGaps(...values)
        return stateCollections
    }

    constructor(public initialValue: T = null) {}

    get length() {
        const len = this.resultList.length
        if (!len) {
            return 0
        }
        return this.resultList[len - 1].index + 1
    }

    *fullListIter() {
        let lastIndex = 0
        let previous = this.initialValue
        for (const result of this.resultList) {
            for (; lastIndex < result.index; lastIndex += 1) {
                yield previous
            }
            yield result.state
            previous = result.state
        }
        for (; lastIndex < this.length; lastIndex += 1) {
            yield previous
        }
    }

    getFullList() {
        return [...this.fullListIter()]
    }

    getList() {
        return this.resultList.map(r => r.state)
    }

    getWithGaps(index: number) {
        return this.resultList.find(state => state.index === index)?.state
    }

    // 
    /**
     * @param index global index
     * @returns the state that is addressed by the global index. If it refers to a gap it returns the most previous state
     */
    get(index: number) {
        let previous = this.initialValue
        for (const result of this.resultList) {
            if (result.index === index) {
                return result.state
            }
            if (result.index > index) {
                return previous
            }
            previous = result.state
        }
        return previous
    }

    /**
     * use local addressing (using resultList) not global addressing
     * @param index local index of resultList
     * @returns local addressed state
     */
    getLocal(index: number) {
        return this.resultList[index]?.state
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

    result(data: T) {
        this.resultOperations.push({ data })
        return this
    }

    delete(relativeIndex: number) {
        if (relativeIndex >= 0) {
            // well it is possible but currently not needed. So therefore it has not been implemented
            throw new Error('delete operation can only delete entries in past')
        }
        this.deleteOperations.push({ relativeIndex })
        return this
    }

    skip() {
        return this
    }
}