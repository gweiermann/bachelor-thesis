import { Collector } from './Collector'


type ListStep = string[]
export type ListState = number[]

export class List extends Collector<ListStep, ListState> {
    transform(step: ListStep): ListState {
        return step.map(item => parseInt(item, 10))
    }
}