import { Preprocessor, State } from './Preprocessor'


type ArrayWatcherStep = string[]
type ArrayWatcherState = { array: number[] } & ArrayWatcherEvent

type ArrayWatcherEvent =
    { event: 'init' }  |
    { event: 'replace', from: number, to: number, index: number } |
    { event: 'swap', first: { item: number, index: number }, second: { item: number, index: number } }

export class ArrayWatcher extends Preprocessor<ArrayWatcherStep, ArrayWatcherState> {
    next(previousStates: ArrayWatcherState[], step: ArrayWatcherStep): State<ArrayWatcherState> {
        const array = step.map(item => parseInt(item, 10))

        // initial collect
        if (!previousStates.length) {
            return new State<ArrayWatcherState>()
                .result({ event: 'init', array })
                .event('init')
        }

        if (previousStates.length >= 2) {        
            // detect swap
            const changes = extractInbetweenChanges([
                previousStates[previousStates.length - 2].array,
                previousStates[previousStates.length - 1].array,
                array
            ])

            if (!changes[0].hasMultipleChanges) { // skip already processed swap
                if (changes[0].index !== changes[1].index &&
                    changes[0].from === changes[1].to &&
                    changes[1].from === changes[0].to) {
                        return new State<ArrayWatcherState>()
                            .delete(-1)
                            .result({
                                array,
                                event: 'swap',
                                first:  { item: changes[0].to, index: changes[0].index },
                                second: { item: changes[1].to, index: changes[1].index }
                            })
                            .event('swap')
                }
            }
        }

        // recognized a replace
        const previousArray = previousStates[previousStates.length - 1].array
        const changedIndex = findChangedIndex(previousArray, array)
        return new State<ArrayWatcherState>()
            .result({
                array,
                event: 'replace',
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