import { Collector, HasKey } from './Collector'

export type ListCollectorRaw<Key extends string> = HasKey<Key, ListStep>

type ListStep = string[]
export type ListState = number[]

export class ListCollector<Key extends string> extends Collector<ListStep, ListState, Key> {
    transform(step: ListStep): ListState {
        return step.map(item => parseInt(item, 10))
    }
}