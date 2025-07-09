import { AnalysisResultStep, AnalysisResult } from "@/lib/build"
import { cn } from "@/lib/utils"

interface AnnotatedAnalsisResultStep extends AnalysisResultStep {
    order: { id: number, orderId: number, className?: string }[]
}

function postProcessor<T, A extends AnalysisResultStep>(
    key: string,
    analysis: A[],
    startValue: T,
    stepWithPredicate: (step: any, stepIndex: number, prev: T) => T
): (A & { [key]: T })[] {
    if (!analysis.length) {
        return []
    }
    let curr = startValue
    return [
        { ...analysis[0], [key]: curr },
        ...analysis.slice(1).map((step, index) => {
            curr = stepWithPredicate(step, index + 1, JSON.parse(JSON.stringify(curr)))
            return {
                ...step,
                [key]: curr
            }
        })
    ]
}


function postProcessorOfArray<T, A extends AnalysisResultStep>(
    key: string,
    analysis: A[],
    startWithPredicate: (value: number, index: number) => T,
    stepWithPredicate: (step: any, stepIndex: number, prev: T[]) => T[]
): (A & { [key]: T[] })[] {
    if (!analysis.length) {
        return []
    }
    let startValue = analysis[0].array.map(startWithPredicate)
    return postProcessor(key, analysis, startValue, stepWithPredicate)
}

export function addOrder<T>(steps: AnalysisResultStep[], additional?: (step: AnalysisResultStep, stepIndex: number, count: number) => T[]) {
    let id = 0
    return postProcessorOfArray<{ value: Number, orderId: number, id: number }, AnalysisResultStep>('order', steps,
        (value, index) => ({ id: id++, orderId: index, value }),
        (step, stepIndex, prev) => {
            const additionalValues = additional?.(step, stepIndex, prev.length)
            const event = step.event
            if (event) {
                if (event.type === 'replace') {
                    prev[event.index] = { ...prev[event.index], id: id++, value: event.newValue }
                } else if (event.type === 'swap') {
                    const temp = { ...prev[event.index1] }
                    prev[event.index1] = { ...prev[event.index2] }
                    prev[event.index2] = temp
                } else {
                    throw new Error('Unknown event type: ' + event.type)
                }
            }
            if (additionalValues) {
                return prev.map((item, index) => ({ ...item, additional: {...item.additional, ...additionalValues[index]}}))
            }
            return prev
        }
    )
}

export function mergeAdditionals(...additionals: ((step: AnalysisResultStep, stepIndex: number, count: number) => any[])[]) {
    return (step: AnalysisResultStep, stepIndex: number, count: number) => {
        return additionals.map(additional => (additional(step, stepIndex, count)) ?? new Array(count).fill({}))
            .reduce((acc, curr) => acc.map((item, index) => ({ ...item, ...curr[index] })), new Array(count).fill({}))
    }
}

export function addAnimationsToSteps(steps: AnalysisResultStep[]) {
    return postProcessorOfArray<string, AnalysisResultStep>('className', steps,
        () => '',
        (step, i, prev) => {
            const event = step.event
            const followingEvent = steps[i + 1]?.event
    
            function getClassName(i: number) {
                if (!event) {
                    return undefined
                }
                if (event.type === 'replace' && i === event.index) {
                    return 'bg-amber-400'
                }
                if (event.type === 'swap' && (i === event.index1 || i === event.index2)) {
                    return 'bg-sky-200'
                }
                return undefined
            }
    
            function getClassNameForFollowing(i: number) {
                if (!followingEvent) {
                    return undefined
                }
                if (followingEvent.type === 'replace' && i === followingEvent.index) {
                    return 'border-2 border-dashed animate-wiggle'
                }
                if (followingEvent.type === 'swap' && (i === followingEvent.index1 || i === followingEvent.index2)) {
                    return 'border-2 border-dashed animate-wiggle'
                }
                return undefined
            }

            return prev.map((_, i) => cn(getClassName(i), getClassNameForFollowing(i)))
        }
    )
}

export function addRecursionStages(steps) {
    return postProcessor<{ left: number, right: number, pivot: number }[], AnalysisResultStep>('stages', steps,
        [
            {
                left: 0,
                right: steps[0].array.length - 1,
                pivot:  steps[0].array.length - 1
            }
        ],
        (step, index, stages) => {
            const event = step.recursion
            if (event) {
                if (event.from.startsWith('quickSortRecursive(') && event.to.startsWith('quickSortRecursive(')) {
                    if (event.type === 'step_in') {
                        stages.push({
                            left: parseInt(event.arguments.low),
                            right: parseInt(event.arguments.high),
                            pivot: parseInt(event.arguments.high)
                        })
                    } else if (event.type === 'step_out') {
                        stages.pop()
                    } else {
                        throw new Error('Unknown event type: ' + event.type)
                    }
                }
            }
            return stages
        }
    )
}

export function enrichPivotElement(step: AnalysisResultStep, stepIndex: number, count: number) {
    const event = step.recursion
    if (event) {
        if (event.to.startsWith('quickSortRecursive(')) {
            if (event.type === 'step_in') {
                if (parseInt(event.arguments.low) < parseInt(event.arguments.high)) {
                    return new Array(count).fill(null).map((_, i) => ({ isPivot: i === parseInt(event.arguments.high) }))
                }
            }
        }
    }
}

export function enrichPartitionElement(step: AnalysisResultStep, stepIndex: number, count: number) {
    const event = step.recursion
    if (event) {
        if (event.from.startsWith('quickSortRecursive(') && event.to.startsWith('quickSortRecursive(')) {
            if (event.type === 'step_in') {
                if (event.arguments.low >= event.arguments.high) {
                    const index = parseInt(event.arguments.low)
                    const arr = new Array(count).fill(null)
                    arr[index] = { isPartitionElement: true }
                    return arr
                }
            }
        }
        if (event.from.startsWith('partition(')) {
            if (event.type === 'step_out') {
                const index = parseInt(event.returnValue)
                const arr = new Array(count).fill(null)
                arr[index] = { isPartitionElement: true }
                return arr
            }
        }
    }
}