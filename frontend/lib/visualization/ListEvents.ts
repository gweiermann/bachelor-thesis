import { Preprocessor } from "./Preprocessor"
import { State } from "./VisualizationStates"


type MyStep = number[]
type MyState = ListEvent
export type ListEventName = 'init' | 'replace' | 'swap'

export type ListEvent =
    { type: 'init', array: number[] }  |
    { type: 'replace', from: number, to: number, index: number } |
    { type: 'swap', first: { item: number, index: number }, second: { item: number, index: number } }

export class ListEvents extends Preprocessor<MyStep, MyState> {
    next(array: MyStep, globalIndex: number, index: number): State<MyState> {
        // initial collect
        if (!this.resultList.length) {
            return new State<MyState>()
                .result({ type: 'init', array })
        }

        if (this.resultList.length >= 2) {
            const a1 = this.steps.getLocal(index - 2)
            const a2 = this.steps.getLocal(index - 1)
            const a3 = array
            // detect swap
            const changes = extractInbetweenChanges([ a1, a2, a3 ])

            const i1 = changes[0].index
            const i2 = changes[1].index

            if (changes[0].index !== changes[1].index &&
                a1[i1] == a3[i2] &&
                a3[i1] == a1[i2] &&
                changes[0].from === changes[1].to &&
                changes[1].from === changes[0].to) {
                    return new State<MyState>()
                        .delete(-1)
                        .result({
                            type: 'swap',
                            first:  { item: changes[0].to, index: i1 },
                            second: { item: changes[1].to, index: i2 }
                        })
            }
        }

        // recognized a replace
        const previousArray = this.steps.get(globalIndex - 1)
        const changedIndex = findChangedIndex(previousArray, array)
        return new State<MyState>()
            .result({
                type: 'replace',
                from: previousArray[changedIndex],
                to: array[changedIndex],
                index: changedIndex
            })
    }
}

function findChangedIndex(array1: number[], array2: number[], startIndex = 0) {
    const index = array1.slice(startIndex).findIndex((item, index) => item !== array2[index + startIndex])
    if (index === -1) {
        return -1
    }
    return index + startIndex
}

function extractInbetweenChanges(listOfArrays: number[][]) {
    return listOfArrays.slice(1).map((curr, index) => {
        const prev = listOfArrays[index] // index is offseted by -1 so this works
        const change = findChangedIndex(prev, curr, 0);
        if (change === -1) {
            throw new Error("There was no change in array")
        }
        const hasMultipleChanges = findChangedIndex(prev, curr, change + 1) !== -1
        return { index: change, from: prev[change], to: curr[change], hasMultipleChanges }
    })
}