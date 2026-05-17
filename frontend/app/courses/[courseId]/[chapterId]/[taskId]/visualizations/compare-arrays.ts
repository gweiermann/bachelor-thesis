/**
 * Diff two consecutive array snapshots from a sort (or similar) trace.
 * Same rules as `analysis-tool/postprocessing/keep_track_of_items.py` (KeepTrackOfItems):
 * one differing cell → replace; two cells that cross-exchange → swap; anything else → `reason: 'error'`.
 */
export type CompareArraysResult<T> =
    | { reason: 'swap'; firstIndex: number; secondIndex: number }
    | { reason: 'replace'; index: number; newValue: T }
    | { reason: 'error'; message: string }

function findChangedIndex<T>(a: T[], b: T[], start = 0): number | null {
    for (let i = start; i < a.length; i++) {
        if (a[i] !== b[i]) return i
    }
    return null
}

export function compareArrays<T>(previous: T[], current: T[]): CompareArraysResult<T> {
    if (previous.length !== current.length) {
        return { reason: 'error', message: 'The two arrays must have the same length.' }
    }

    const firstChange = findChangedIndex(previous, current, 0)
    if (firstChange === null) {
        return { reason: 'error', message: 'The steps are supposed to be different each step' }
    }

    const secondChange = findChangedIndex(previous, current, firstChange + 1)
    if (secondChange === null) {
        return {
            reason: 'replace',
            index: firstChange,
            newValue: current[firstChange]!,
        }
    }

    if (findChangedIndex(current, previous, secondChange + 1) !== null) {
        return {
            reason: 'error',
            message: "It's unexpected that a step can have more than two changes",
        }
    }

    if (
        previous[firstChange] === current[secondChange] &&
        previous[secondChange] === current[firstChange]
    ) {
        return {
            reason: 'swap',
            firstIndex: firstChange,
            secondIndex: secondChange,
        }
    }

    return {
        reason: 'error',
        message:
            "It's unexpected that a step can have more than one new item that is not swapped with another item",
    }
}
