import type { AnalysisResultStep } from '@/lib/build'

export type DerivedStep =
    | { kind: 'swap'; i: number; j: number }
    | { kind: 'replace'; index: number; value: number }

export function deriveSortStep(
    prevArr: number[],
    nextArr: number[],
    event: AnalysisResultStep['event'] | null | undefined
): DerivedStep {
    if (event?.type === 'swap') {
        return { kind: 'swap', i: event.index1, j: event.index2 }
    }
    if (event?.type === 'replace') {
        return { kind: 'replace', index: event.index, value: event.newValue }
    }

    const diffs: number[] = []
    const len = Math.max(prevArr.length, nextArr.length)
    for (let i = 0; i < len; i++) {
        if (prevArr[i] !== nextArr[i]) {
            diffs.push(i)
        }
    }

    if (diffs.length === 2) {
        const [a, b] = diffs
        return { kind: 'swap', i: a, j: b }
    }
    if (diffs.length === 1) {
        return { kind: 'replace', index: diffs[0], value: nextArr[diffs[0]] }
    }

    throw new Error('Could not derive sort step from arrays')
}
