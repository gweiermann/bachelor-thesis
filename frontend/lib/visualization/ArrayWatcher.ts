import { Collector, State } from './collector'


type ArrayWatcherStep = string[]
type ArrayWatcherState = { array: number[] } & ArrayWatcherEvent

type ArrayWatcherEvent =
    { event: 'init' }  |
    { event: 'replace', from: number, to: number, index: number } |
    { event: 'swap', first: { item: number, index: number }, second: { item: number, index: number } }

export class ArrayWatcher extends Collector<ArrayWatcherStep, ArrayWatcherState> {
    next(previousStates: ArrayWatcherState[], step: ArrayWatcherStep): State<ArrayWatcherState> {
        const array = step.map(item => parseInt(item, 10))

        // initial collect
        if (!previousStates.length) {
            return new State<ArrayWatcherState>().result({ event: 'init', array })
        }
        
        // detect swap
        const changes = extractInbetweenChanges([
            previousStates[previousStates.length - 2].array,
            previousStates[previousStates.length - 1].array,
            array
        ])

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
        }

        // recognized a replace
        return new State<ArrayWatcherState>()
            .result({
                array,
                event: 'replace',
                ...changes[1]
            })
    }
}

function findChangedIndex(array1: number[], array2: number[], startIndex = 0) {
    return array1.slice(startIndex).findIndex((item, index) => array2[index] !== item)
}

function extractInbetweenChanges(listOfArrays: number[][]) {
    return listOfArrays.slice(1).map((curr, index) => {
        const prev = listOfArrays[index] // index is offseted by -1 so this works
        const change = findChangedIndex(prev, curr, 0);
        if (change === -1) {
            throw new Error("There was no change in array")
        }
        if (findChangedIndex(prev, curr, change + 1) !== -1) {
            throw new Error("It is illegal to have a second change in array")
        }
        return { index: change, from: prev[change], to: curr[change] }
    })
}