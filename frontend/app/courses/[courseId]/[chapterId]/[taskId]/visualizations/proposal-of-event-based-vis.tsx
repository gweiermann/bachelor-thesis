/*
Proposal of event-based modular visualization.

Currently, creating a new visualization is pretty difficult. Also existing visualizations are difficult to maintain. They require a lot of manual work, are difficult to read and logic is duplicated for each visualization.

Files to look at to understand the problem:
(visualization.tsx)[frontend/app/courses/[courseId]/[chapterId]/[taskId]/visualization.tsx] and 
(sort.tsx)[frontend/app/courses/[courseId]/[chapterId]/[taskId]/visualizations/sort.tsx] and (quick-sort.tsx)[frontend/app/courses/[courseId]/[chapterId]/[taskId]/visualizations/quick-sort.tsx]

In the following I propose a new architecture:
It requires two concepts:

## Visualization modules:
Visualizations get split into smaller chunks to make them more modular and interchangable.

## Event-based visualization baking:
- Each module consumes a timeline and generates its own timeline. It is basically a pipeline of events.
- At the end these timelines are generated using tsx.
- Each timeline represents a module
- Examples for a timeline: active line in the editor, array state, current variables, highlights in the editor, but also higher level timelines: recursion timeline organizing multiple timelines each representing an array timeline
- Event handlers are rich in what they are able to do. of course an .on() is possible but also a .before() and .after() to add an animation state before or after an event takes place
- And there is also a .chunked() handler: it groups multiple steps into one. Think of it like each keyframe in the timeline (a keyframe is also an event) is a group of 1. And an event/keyframe can also reference a group
- Groups can't partly overlap
- Once something is grouped, the global indices change. It should not trigger a whole recalculation but there should be a transformer that always transforms a raw index into the global index (raw meaning index without grouping mechanism, global meaning groups are considered)
- How to implement groups correctly is your task
*/

import { useState, useMemo } from 'react'
import { useVisualization } from '../stores'

// use-timeline.ts
/**
 * A timeline is a list of events (keyframes).
 * You listen to events and on a second timeline you would then emit new events that abstract away unneeded details.
 * Basically you funnel events through a pipeline.
 * At the end you take all events in correct order as keyframes and render them.
 */

const NO_EVENT = Symbol('no-event-just-keyframe')

type Keyframes<TPayload = unknown> = {[index: number]: {eventName: string | typeof NO_EVENT, payload: TPayload[]}}

export function useTimeline<TPayload = unknown>() {
    // IDEA: The useVisualization should hold a registry of groups. Which is a lookup for which groups exists and to map the keyframe index to the global correct index where grouping is considered. It also makes sure that groups don't partly overlap (or error)
    const [keyframes, setKeyframes] = useState<Keyframes<TPayload>>({})
    const [handlers, setHandlers] = useState<{eventName: string, callback: (payload: TPayload) => void, options: { ungrouped?: boolean, once?: boolean, globalRelativeOffset?: number, chunk?: number }}[]>([])
    const { currentStepIndex, registerBakingRecipe } = useVisualization() // is provided by visualization.tsx as context

    // if no keyframe exists, current is the most recent value from before, else it's the keyframes payload
    const current = useMemo(() => {
        if (currentStepIndex in keyframes) {
            return keyframes[currentStepIndex]
        }
        const indices = Object.keys(keyframes)
        const ind = indices.toSorted((a, b) => a - b).findIndex(i => i < currentStepIndex)
        if (ind === -1) {
            return null
        }
        return keyframes[indices[ind]]
    }, [currentStepIndex, keyframes])
    
    function internalEmit(eventName: string | typeof NO_EVENT, payload: TPayload, options: { rawIndex?: number } = {} ) {
        const {rawIndex} = useGlobalBakingIndex()
        const index = options.rawIndex ?? rawIndex
        setKeyframes(keyframes => ({ ...keyframes, [index]: { eventName, payload } }))
    }

    function emit(eventName: string, payload: TPayload, options: { rawIndex?: number } = {} ) {
        internalEmit(eventName, payload, options)
    }

    function set(payload: TPayload) {
        // TODO: make it so that the set is a callback function (previousValue) => newPayload
        internalEmit(NO_EVENT, payload)
    }

    function on(eventName: string, handler: (payload: TPayload) => void, options: { grouped?: boolean, once?: boolean, globalRelativeOffset?: number, chunk?: number } = {}) {
        setHandlers(handlers => [...handlers, { eventName, callback: handler, options }])
    }

    // TODO: implement these, internally call 'on' with corresponding options
    function once() {}
    function before() {}
    function after() {}
    // a chunk is when an event is triggered chunkSize times in a row
    function chunked(eventName: string, chunkSize: number, handler: (payload: TPayload[]) => boolean | void) {
        // TODO: as soon as chunk gets called e.g. with a value of 2, it automatically groups the global steps (except when returning false in the handler)
    }

    function getLastProcessableKeyframeIndex(lastPossibleKeyframeIndex: number) {
        let blocker = 0;

        // TODO: check for chunked handlers and if there's currently a chunk in progress:
        // meaning: if we want to chunk 3 events and the last two keyframes (corresponding to lastPossibleKeyframeIndex) are both candiates for the chunk in case the third one will also be a candiate, then we need to block the last two keyframes.

        return lastPossibleKeyframeIndex - blocker;
    }

    function runEventHandlers(fromKeyframeIndex: number, toKeyframeIndex: number) {
        // bring handlers into correct order and determine their globalIndex
        const fullHandlerList = []
        for (const handler of handlers) {
            for (const [rawIndex, keyframe] of Object.entries(keyframes)) {
                const rawIndexNumber = parseInt(rawIndex);
                if (rawIndexNumber < fromKeyframeIndex || rawIndexNumber > toKeyframeIndex) {
                    continue;
                }
                // TODO: translate rawIndex into globalIndex (index after grouping mechanism)
                // TODO: throw console.error if grouped === false or undefined but globalIndex referes to a group of more than 1 item
                // TODO: if grouped === true, call the handler with the array containing all items in the group, if grouped === false, unwrap the array: [item,...] -> item
                // TODO: make 'once: true' work
                // TODO: make chunked work
                if (keyframe.eventName === handler.eventName) {
                    fullHandlerList.push({
                        handler,
                        payload: keyframe.payload,
                        globalIndex: rawIndexNumber + (handler.options.globalRelativeOffset ?? 0)
                    })
                }
            }
        }
        // run the event handlers in correct order
        const sortedHandlerList = fullHandlerList.toSorted((a, b) => a.globalIndex - b.globalIndex)
        for (const handler of sortedHandlerList) {
            const {wrapGlobalIndex} = useGlobalBakingIndex()
            wrapGlobalIndex(handler.globalIndex, () => {
                handler.handler.callback(handler.payload)
            })
        }
    }

    function reset() {
        setKeyframes({})
        setHandlers([])
    }

    registerBakingRecipe({
        getLastProcessableKeyframeIndex,
        bake: runEventHandlers,
        reset
    })

    return {
        current,
        set,
        keyframes,
        emit,
        on,
        once,
        before,
        after,
        chunked
    }
}

// use-array-changes-timeline.ts
export function useArrayChangesTimeline() {
    const timeline = useTimeline()
    return {
        ...timeline,
        swap(firstIndex: number, secondIndex: number) {
            timeline.emit('swap', {firstIndex, secondIndex})
        },
        replace(index: number, newValue: number) {
            timeline.emit('replace', {index, newValue})
        }
    }
}

// visualization.tsx
// concept of steps as events
export function Visualization() {
    // ...

    const rawSteps = [/* ... */]

    const steps = useTimeline()
    rawSteps.forEach((rawStep, rawIndex) => {
        Object.entries(rawStep).forEach(([collector, data]) => steps.emit(collector, data, { rawIndex }))
    })

    // `steps` is now `rawSteps` but event based
    
    // ...
}

// sort.tsx
/**
 * `steps` is the raw steps but is transformed into a timeline
 */
export function SortVisualization({ steps }) {
    const timeline = useArrayChangesTimeline();

    steps.once('arrayWatcher', (array) => arrayVis.setItems(array), { ungrouped: true }) // if it is a group with 2+ items, a console.error is thrown, always exposes first item

    steps.chunked('arrayWatcher', 2, ([ array, array2 ]) => {
        const comparison = compareArrays(array, array2)
        if (comparison.reason === 'swap') {
            timeline.swap(comparison.firstIndex, comparison.secondIndex) // swap event references this whole group as one step 
        }
        else if (comparison.reason === 'replace') {
            timeline.replace(comparison.index, comparison.newValue)
        }
        else {
            throw new Error(`Unknown comparison reason: ${comparison.reason}`)
        }
        return true; // group the items
    })

    return (
        <ArrayChangesVisualization timeline={timeline} />
    )
}

// array-changes-visualization.tsx
export function ArrayChangesVisualization({ timeline }) {
    const itemsTimeline = useItemsTimeline()
    timeline.on('set', (array) => itemsTimeline.set(array))
    timeline.on('swap', (index1, index2) => itemsTimeline.swap(index1, index2))
    timeline.on('replace', (index, newValue) => itemsTimeline.replace(index, newValue))

    const swapClass = 'bg-sky-200 animate-wiggle'
    const replaceClass = 'bg-amber-400 animate-wiggle'
    
    timeline.before('swap', (index1, index2) => {
        itemsVis.addClass(index1, swapClass)
        itemsVis.addClass(index2, swapClass)
    })
    // after needs to make sure to run before the next 'before' handler so if two swaps happen in a row, addClass will be called after the removeClass
    timeline.after('swap', (index1, index2) => {
        itemsVis.removeClass(index1, swapClass)
        itemsVis.removeClass(index2, swapClass)
    })

    timeline.before('replace', (index, newValue) => {
        itemsVis.addClass(index, replaceClass)  
    })
    timeline.after('replace', (index, newValue) => {
        itemsVis.removeClass(index, replaceClass)
    })

    // with motion.js like in sort.tsx, animatepresence and so on
    return (
        <ItemsVisualization timeline={itemsTimeline} />
    )
}

// use-items-visualization.ts
export function useItemsVisualization() {
    const timeline = useTimeline()
    const [id, setId] = useState(0)
    
    return {
        ...timeline,
        set: (rawItems) => {
            setId(id => id + 1)
            timeline.set(rawItems.map((num, index) => ({
                value: num,
                id,
                orderId: index,
                classList: []
            })))
        },
        swap: (index1, index2) => {
            timeline.set((current) => {
            const temp = current[index1]
                current[index1] = current[index2]
                current[index2] = temp
                return current
            })
        },
        replace: (index, newValue) => {
            timeline.set((current) => {
                current[index].value = newValue
                setId(id => id + 1)
                current[index].id = id
                return current
            })
        },
        addClass: (index, className) => {
            timeline.set((current) => {
                current[index].classList.push(className)
                return current
            })
        },
        removeClass: (index, className) => {
            timeline.set((current) => {
                current[index].classList = current[index].classList.filter(cls => cls !== className)
                return current
            })
        }
    }
}

// ItemsVisualization.tsx
export function ItemsVisualization({ timeline }) {
    const {timePerStep} = useVisualization()
    const current = timeline.current
    return (
        <ul className="flex space-x-4">
            {current.map((item, index) => 
                <motion.li
                    key={item.orderId}
                    layout
                    transition={{
                        duration: timePerStep,
                        type: 'spring',
                        bounce: 0.25
                    }}
                    className="size-16"
                    >
                    <motion.div
                        initial={{ y: -50, opacity: 0, scale: 0.5 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        transition={{type: 'spring', duration: 0.05, delay: 0.05 * index}}
                        className="relative size-full">
                        <AnimatePresence initial={false}>
                            <motion.div
                                key={item.id}
                                transition={{ type: 'spring', duration: timePerStep }}
                                initial={{ y: -100, opacity: 0, scale: 0.5 }}
                                animate={{ y: 0, opacity: 1, scale: 1 }}
                                exit={{ y: 100, opacity: 0, scale: 0.5 }}
                                className={cn(
                                    "absolute size-full border-2 border-black bg-white rounded-sm flex items-center justify-center",
                                    ...item.classList
                                )}>
                                {item.value}
                            </motion.div>
                        </AnimatePresence>
                    </motion.div>
                </motion.li>
            )}
        </ul>
    )
}

// visualization.tsx
// concept of baking. Just an outline the specifics (which components are rendered, parameters, etc.) can change!

export default function Visualization() {
    // ...

    const Bake = ({rawSteps}) => {
        useEffect(() => {
            // bake everything here
            // why? -> the Visualization was already executed in tsx and now the event handlers are in place. Bake will be executed at last -> perfect timing
        }, rawSteps)
    }

    return (
        <Variables />
        <ActualVisualizationComponent />
        <ControlPanel />
        <Bake rawSteps={rawSteps} />
    )
}