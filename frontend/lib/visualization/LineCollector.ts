import { Collector, HasKey } from './Collector'

export type LineCollectorRaw<Key extends string> = HasKey<Key, LineCollectorStep>
export type LineCollectorStep = number

export class LineCollector<Key extends string> extends Collector<LineCollectorStep, number, Key> {
    transform(step: LineCollectorStep): number {
        return step
    }
}