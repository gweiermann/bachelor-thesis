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
    next(array: MyStep): State<MyState> {
        // initial collect
        if (!this.resultList.length) {
            return new State<MyState>()
                .result({ type: 'init', array })
                .event('init')
        }

        if (this.resultList.length >= 2) {        
            // detect swap
            const changes = extractInbetweenChanges([
                this.steps.get(-2),
                this.steps.get(-1),
                array
            ])

            if (!changes[0].hasMultipleChanges) { // skip already processed swap
                if (changes[0].index !== changes[1].index &&
                    changes[0].from === changes[1].to &&
                    changes[1].from === changes[0].to) {
                        return new State<MyState>()
                            .delete(-1)
                            .result({
                                type: 'swap',
                                first:  { item: changes[0].to, index: changes[0].index },
                                second: { item: changes[1].to, index: changes[1].index }
                            })
                            .event('swap')
                }
            }
        }

        // recognized a replace
        const previousArray = this.steps.get(-1)
        const changedIndex = findChangedIndex(previousArray, array)
        return new State<MyState>()
            .result({
                type: 'replace',
                from: previousArray[changedIndex],
                to: array[changedIndex],
                index: changedIndex
            })
            .event('replace')
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