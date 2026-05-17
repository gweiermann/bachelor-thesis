'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useVisualizationBaking } from './visualization-baking-context'

/** Channel for payloads exposed as `timeline.current` (not a string event name). */
export const TIMELINE_CURRENT = Symbol('timeline.current')

export type TimelineEventKey = string | typeof TIMELINE_CURRENT

export type TimelineKeyframe = {
    eventKey: TimelineEventKey
    payload: unknown
}

export type HandlerOptions = {
    once?: boolean
    grouped?: boolean
    ungrouped?: boolean
    globalRelativeOffset?: number
    chunked?: number
}

/** Internal: runtime invokes with either one payload or an array of payloads. */
type DispatchPayload = unknown

type RegisteredHandler = {
    eventKey: TimelineEventKey
    /** Chunked handlers may return `false` to veto group creation; all others return void. */
    callback: (payload: DispatchPayload) => false | void
    options: HandlerOptions
    /** Inherited from the wrapTimelineHandlers call that registered this handler. */
    order: 'pre' | 'post'
}

type OnUngroupedOptions = Omit<HandlerOptions, 'grouped'> & { grouped?: false }
type OnGroupedOptions = Omit<HandlerOptions, 'grouped'> & { grouped: true }

type TimelineOn<TEvents extends Record<string, unknown>> = {
    <E extends keyof TEvents & string>(
        eventName: E,
        callback: (payload: TEvents[E]) => void,
        options?: OnUngroupedOptions
    ): void
    <E extends keyof TEvents & string>(
        eventName: E,
        callback: (payload: TEvents[E][]) => void,
        options: OnGroupedOptions
    ): void
}

type TimelineSet<TCurrent> = {
    (callback: (payload: TCurrent) => void, options?: OnUngroupedOptions): void
    (callback: (payload: TCurrent[]) => void, options: OnGroupedOptions): void
}

type RelativeUngroupedOptions = Omit<HandlerOptions, 'grouped' | 'globalRelativeOffset'> & { grouped?: false }
type RelativeGroupedOptions = Omit<HandlerOptions, 'grouped' | 'globalRelativeOffset'> & { grouped: true }

type TimelineRelative<TEvents extends Record<string, unknown>> = {
    <E extends keyof TEvents & string>(
        eventName: E,
        callback: (payload: TEvents[E]) => void,
        options?: RelativeUngroupedOptions
    ): void
    <E extends keyof TEvents & string>(
        eventName: E,
        callback: (payload: TEvents[E][]) => void,
        options: RelativeGroupedOptions
    ): void
}

type TimelineOnce<TEvents extends Record<string, unknown>> = {
    <E extends keyof TEvents & string>(
        eventName: E,
        handler: (payload: TEvents[E]) => void,
        options?: OnUngroupedOptions
    ): void
    <E extends keyof TEvents & string>(
        eventName: E,
        handler: (payload: TEvents[E][]) => void,
        options: OnGroupedOptions
    ): void
}

function formatEventKeyForError(eventKey: TimelineEventKey): string {
    return typeof eventKey === 'string' ? eventKey : eventKey.description ?? 'timeline.current'
}

function findKeyframeEntry(
    keyframes: TimelineKeyframe[] | undefined,
    eventKey: TimelineEventKey,
): TimelineKeyframe | undefined {
    return keyframes?.find(k => k.eventKey === eventKey)
}

function assertNoDuplicateEventAtIndex(
    existing: TimelineKeyframe[],
    eventKey: TimelineEventKey,
    index: number,
): void {
    if (existing.some(k => k.eventKey === eventKey)) {
        throw new Error(
            `Timeline: duplicate event key "${formatEventKeyForError(eventKey)}" at keyframe index ${index}. Each index may hold at most one keyframe per event key.`,
        )
    }
}

type AnyTimeline = any
// type AnyTimeline = Timeline<Record<string, unknown>, unknown>

export function useDefineTimelineHandlers<T extends AnyTimeline>(inputTimeline: T, outputTimeline: T, effect: (timeline: T) => void, dependencies: unknown[]) {
    useEffect(() => {
        console.log('useDefineTimelineHandlers', inputTimeline.debugName, '->', outputTimeline.debugName)
        // Pass the output timeline's order so every handler collected inside `effect`
        // is tagged with that order (pre/post) for two-pass render dispatch.
        const cleanup = inputTimeline.wrapTimelineHandlers(() => effect(outputTimeline), { order: outputTimeline.order })
        registerDependency(inputTimeline, outputTimeline)
        return () => {
            cleanup()
            console.log('cleanup', inputTimeline.debugName, '->', outputTimeline.debugName)
        }
    }, [])
    // }, [inputTimeline, outputTimeline, effect, ...dependencies])
}

export function registerDependency(parentTimeline: AnyTimeline, childTimeline: AnyTimeline) {
    parentTimeline.addDependency(childTimeline)
    childTimeline.setParent(parentTimeline)
}

export function useTimeline<
    TEvents extends Partial<Record<TimelineEventKey, unknown>> = Record<TimelineEventKey, unknown>,
    TCurrent = TEvents[typeof TIMELINE_CURRENT],
>(debugName: string = 'unnamed', opts?: { order?: 'pre' | 'post' }) {
    const keyframesRef = useRef<Map<number, TimelineKeyframe[]>>(new Map()) // keyframeIndex -> keyframes at that step
    const handlersRef = useRef<Map<TimelineEventKey, RegisteredHandler[]>>(new Map())
    const nextHandlerIdRef = useRef<number>(0) // for referencing in `onceFiredRef`
    const onceFiredRef = useRef<Set<number>>(new Set()) // handler callbacks
    const dependenciesRef = useRef<Set<AnyTimeline>>(new Set()) // used for building up a dependency graph to recursively render children timelines
    const { currentRawIndex, createGroup, getGroup, wrapWithIndex, wrappedIndexRef, registerBakingRecipe, groupsRef } = useVisualizationBaking()
    const [triggerRender, setTriggerRender] = useState(0)
    const [parent, setParent] = useState<AnyTimeline | null>(null)
    const handlerCollectorRef = useRef<(() => void)[] | null>(null)

    // 'post' is the default; 'pre' marks group-creating timelines (e.g. arrayChanges).
    // addDependency can promote this to 'pre' when a 'pre' child is registered.
    const orderRef = useRef<'pre' | 'post'>(opts?.order ?? 'post')
    // Tracks whether the caller explicitly passed `order`, used to warn on override.
    const orderExplicitRef = useRef<boolean>(opts?.order !== undefined)
    // Set by wrapTimelineHandlers so registerByKey can tag each handler with the correct order.
    const currentWrapOrderRef = useRef<'pre' | 'post'>('post')

    const wrapTimelineHandlers = useCallback((handlerRegistrations: () => void, wrapOpts?: { order?: 'pre' | 'post' }) => {
        if (handlerCollectorRef.current !== null) {
            throw new Error('wrapTimelineHandlers can only be called once')
        }
        handlerCollectorRef.current = []

        // Set the order tag so every registerByKey call inside handlerRegistrations() inherits it.
        currentWrapOrderRef.current = wrapOpts?.order ?? 'post'
        handlerRegistrations()
        currentWrapOrderRef.current = 'post' // reset to default after collection

        const handlers = handlerCollectorRef.current
        const cleanup = () => {
            handlers.forEach((handler) => handler())
        }

        handlerCollectorRef.current = null
        return cleanup
    }, [handlerCollectorRef])

    const getPayloadWithFallback = useCallback((rawIndex: number, eventKey: TimelineEventKey): unknown | null => {
        // fixme: performance of sorting each time is not optimal
        const atRaw = findKeyframeEntry(keyframesRef.current.get(rawIndex), eventKey)
        if (atRaw !== undefined) {
            return atRaw.payload
        }
        for (let j = rawIndex - 1; j >= 0; j--) {
            const hit = findKeyframeEntry(keyframesRef.current.get(j), eventKey)
            if (hit !== undefined) {
                return hit.payload
            }
        }
        return null
    }, [keyframesRef])

    const current = useMemo(
        (): TCurrent | null => getPayloadWithFallback(currentRawIndex, TIMELINE_CURRENT) as TCurrent | null,
        [getPayloadWithFallback, currentRawIndex, triggerRender],
    )

    /** One entry per keyframe index in the range; payload is only for `eventKey` at that exact index (no fallback). */
    const getPayloads = useCallback((rawIndex: number, groupSize: number, eventKey: TimelineEventKey): unknown[] => {
        const payloads: unknown[] = []
        for (let i = 0; i < groupSize; i++) {
            const hit = findKeyframeEntry(keyframesRef.current.get(rawIndex + i), eventKey)
            payloads.push(hit !== undefined ? hit.payload : null)
        }
        return payloads
    }, [keyframesRef])

    const registerByKey = useCallback(
        (eventKey: TimelineEventKey, callback: (payload: DispatchPayload) => void, options?: HandlerOptions) => {
            const handler: RegisteredHandler = {
                eventKey,
                callback,
                options: options ?? {},
                order: currentWrapOrderRef.current,
            }

            if (handlerCollectorRef.current === null) {
                throw new Error('registerByKey can only be called within a wrapTimelineHandlers block')
            }

            const handlers = handlersRef.current.get(eventKey) ?? []
            handlers.push(handler)
            handlersRef.current.set(eventKey, handlers)

            handlerCollectorRef.current.push(() => handlers.splice(handlers.indexOf(handler), 1))
        },
        [handlersRef]
    )

    const register = useCallback(
        (eventName: keyof TEvents & string, callback: (payload: DispatchPayload) => void, options?: HandlerOptions) => {
            registerByKey(eventName, callback, options)
        },
        [registerByKey]
    )

    const on = register as unknown as TimelineOn<TEvents>

    const before = useCallback(
        ((eventName: keyof TEvents & string, callback: (payload: DispatchPayload) => void, options?: Omit<HandlerOptions, 'globalRelativeOffset'>) => {
            register(eventName, callback, { ...options, globalRelativeOffset: -1 })
        }) as TimelineRelative<TEvents>,
        [register]
    )

    const after = useCallback(
        ((eventName: keyof TEvents & string, callback: (payload: DispatchPayload) => void, options?: Omit<HandlerOptions, 'globalRelativeOffset'>) => {
            register(eventName, callback, { ...options, globalRelativeOffset: +1 })
        }) as TimelineRelative<TEvents>,
        [register]
    )

    const once = useCallback(
        ((eventName: keyof TEvents & string, handler: (payload: DispatchPayload) => void, options?: HandlerOptions) => {
            const handlerId = nextHandlerIdRef.current++
            register(eventName, parameter => {
                if (onceFiredRef.current.has(handlerId)) {
                    return
                }
                onceFiredRef.current.add(handlerId)
                console.log('once', {handlerId, eventName, parameter})
                handler(parameter)
            }, { ...options })
        }) as TimelineOnce<TEvents>,
        [register]
    )

    const chunked = useCallback(
        <TEventName extends keyof TEvents & string>(
            eventName: TEventName,
            chunkSize: number,
            /** Return `false` to veto grouping — keyframes stay as individual steps. */
            handler: (payload: TEvents[TEventName][]) => false | void
        ) => {
            if (chunkSize <= 1) {
                throw new Error("chunkSize must be at least 2")
            }
            register(eventName, handler as (payload: DispatchPayload) => false | void, { chunked: chunkSize, grouped: true })
        },
        [register]
    )

    const assertRenderOrder = useCallback(() => {
        // For each group of size > 1, count how many TIMELINE_CURRENT keyframes exist
        // across all raw indices in the group. More than one means a handler wrote
        // at multiple slots without group knowledge — a render-ordering violation.
        for (const [rawIndex, groupSize] of groupsRef.current.entries()) {
            let count = 0
            for (let i = rawIndex; i < rawIndex + groupSize; i++) {
                const keyframes = keyframesRef.current.get(i) ?? []
                if (keyframes.some(kf => kf.eventKey === TIMELINE_CURRENT)) {
                    count++
                }
            }
            if (count > 1) {
                console.error(
                    `Timeline '${debugName}': group at rawIndex ${rawIndex} (size ${groupSize})`
                    + ` has ${count} TIMELINE_CURRENT entries — expected at most 1.`
                    + ` A handler wrote without group knowledge (render-ordering violation).`
                )
            }
        }
        // Recurse into dependencies
        dependenciesRef.current.forEach(dep => dep.assertRenderOrder?.())
    }, [groupsRef, keyframesRef, dependenciesRef, debugName])

    const render = useCallback(
        () => {
            // TODO: remove this once its working
            if (keyframesRef.current.size === 0 || handlersRef.current.size === 0) {
                console.log('render', debugName, 'noop')
                return
            }

            console.log('render', debugName, { dependencies: dependenciesRef.current.size, handlers: handlersRef.current.size, keyframes: keyframesRef.current.size })

            // Reset only keyframes of dependencies, not their handlers
            dependenciesRef.current.forEach((timeline) => {
                timeline.resetKeyframes()
            })

            type Scheduled = {
                callback: (payload: DispatchPayload) => false | void
                eventKey: TimelineEventKey
                placementIndex: number
                payloadIndex: number
                isSinglePayload: boolean
                /** Chunked handlers carry group metadata; createGroup is deferred until the handler runs. */
                isChunked: boolean
                chunkGroupStart?: number
                chunkGroupSize?: number
                order: 'pre' | 'post'
            }

            const lastIndex = Math.max(...keyframesRef.current.keys())
            const chunkedHandlers = new Map<RegisteredHandler, number>()

            const fullList: Scheduled[] = []

            for (let i = 0; i <= lastIndex; ++i) {
                const keyframesAt = keyframesRef.current.get(i)
                if (!keyframesAt?.length) {
                    continue
                }

                for (const keyframe of keyframesAt) {
                    const handlers = handlersRef.current.get(keyframe.eventKey) ?? []
                    for (const handler of handlers) {
                        const chunkSize = handler.options.chunked
                        if (typeof chunkSize === 'number') {
                            const count = (chunkedHandlers.get(handler) ?? 0) + 1
                            if (count < chunkSize) {
                                // Accumulate — don't emit yet
                                chunkedHandlers.set(handler, count)
                                continue
                            } else {
                                // Chunk is complete: schedule without creating the group yet.
                                // Group creation is deferred to execution time so the handler
                                // can veto it by returning false.
                                chunkedHandlers.set(handler, 0)
                                const groupStart = i - chunkSize + 1
                                fullList.push({
                                    callback: handler.callback,
                                    eventKey: keyframe.eventKey,
                                    payloadIndex: groupStart,
                                    placementIndex: groupStart,
                                    isSinglePayload: false,
                                    isChunked: true,
                                    chunkGroupStart: groupStart,
                                    chunkGroupSize: chunkSize,
                                    order: handler.order,
                                })
                                continue
                            }
                        }
                        fullList.push({
                            callback: handler.callback,
                            eventKey: keyframe.eventKey,
                            payloadIndex: i,
                            placementIndex: i + (handler.options.globalRelativeOffset ?? 0),
                            isSinglePayload: !handler.options.grouped,
                            isChunked: false,
                            order: handler.order,
                        })
                    }
                }
            }

            const sortScheduled = (a: Scheduled, b: Scheduled) => {
                if (a.placementIndex !== b.placementIndex) return a.placementIndex - b.placementIndex
                // Chunked handlers run first within a keyframe so their veto is known
                // before non-chunked handlers at the same index execute
                return (b.isChunked ? 1 : 0) - (a.isChunked ? 1 : 0)
            }

            // --- Pass 1 (pre): execute pre-tagged handlers, then render pre deps ---
            // Pre-pass uses the simple execution path — groups are being created here,
            // so grouped dedup is not yet applicable.
            fullList
                .filter(s => s.order === 'pre')
                .toSorted(sortScheduled)
                .forEach(schedule => {
                    if (schedule.isChunked) {
                        // Fetch payloads directly by chunk size — group doesn't exist yet
                        const payloads = getPayloads(schedule.chunkGroupStart!, schedule.chunkGroupSize!, schedule.eventKey)
                        const result = wrapWithIndex(schedule.chunkGroupStart!, () => schedule.callback(payloads))
                        if (result !== false) {
                            createGroup(schedule.chunkGroupStart!, schedule.chunkGroupSize!)
                        }
                    } else {
                        const payloadGroup = getGroup(schedule.payloadIndex)
                        const payloads = getPayloads(payloadGroup.rawIndex, payloadGroup.size, schedule.eventKey)
                        const parameter = schedule.isSinglePayload ? payloads[0] : payloads
                        wrapWithIndex(schedule.placementIndex, () => schedule.callback(parameter))
                    }
                })

            dependenciesRef.current.forEach(dep => {
                if (dep.order !== 'post') dep.render()
            })

            // --- Pass 2 (post): execute post-tagged handlers with grouped dedup, then render post deps ---
            // Groups are fully established; use execution-time grouped dedup so grouped
            // handlers fire once per group and non-grouped handlers are warned when inside a group.
            fullList
                .filter(s => s.order === 'post')
                .toSorted(sortScheduled)
                .forEach(schedule => {
                    const group = getGroup(schedule.payloadIndex)

                    if (!schedule.isSinglePayload) {
                        // Grouped handler: fires ONCE per group, at groupStart only.
                        // Skip if this entry is for a non-groupStart index of a multi-element group.
                        if (group.size > 1 && schedule.payloadIndex !== group.rawIndex) {
                            return
                        }
                        const payloads = getPayloads(group.rawIndex, group.size, schedule.eventKey)
                        wrapWithIndex(group.rawIndex, () => schedule.callback(payloads))
                    } else {
                        // Non-grouped handler: asserts the group is actually size 1.
                        // If not, the handler is inside a multi-element group without knowing it —
                        // it should have been registered with { grouped: true } instead.
                        if (group.size > 1) {
                            console.warn(
                                `Handler for "${formatEventKeyForError(schedule.eventKey)}" at rawIndex ${schedule.payloadIndex}`
                                + ` is not grouped but is inside a group of size ${group.size}.`
                                + ` Consider { grouped: true } if this handler writes TIMELINE_CURRENT.`
                            )
                        }
                        // group.size === 1: unwrap — pass the single payload value directly (not an array)
                        const payload = getPayloads(schedule.payloadIndex, 1, schedule.eventKey)[0]
                        wrapWithIndex(schedule.placementIndex, () => schedule.callback(payload))
                    }
                })

            dependenciesRef.current.forEach(dep => {
                if (dep.order === 'post') dep.render()
            })

            assertRenderOrder()
            console.log('rendered', debugName)
            debug()

            // Signal React to recompute `current` from the now-populated keyframe refs
            setTriggerRender(v => v + 1)
        }, [assertRenderOrder, createGroup, getGroup, getPayloads, keyframesRef, handlersRef, wrapWithIndex, setTriggerRender])

    // const render = useCallback(
    //     () => {
    //         setTriggerRender(value => value + 1)
    //     }, [setTriggerRender]
    // )

    const fullRender = useCallback(
        () => {
            return;
            if (parent) {
                parent.fullRender()
            } else {
                render()
            }
        }, [render, parent]
    )

    const emit = useCallback(
        <K extends keyof TEvents & string>(
            eventName: K,
            payloadOrUpdater: TEvents[K] | ((previous: TEvents[K] | null) => TEvents[K]),
            options: { rawIndex?: number } = {}
        ) => {
            const index = options.rawIndex ?? wrappedIndexRef.current
            let payload: TEvents[K]
            if (typeof payloadOrUpdater === 'function') {
                const updater = payloadOrUpdater as (previous: TEvents[K] | null) => TEvents[K]
                const previousRaw = getPayloadWithFallback(index, eventName)
                const previous =
                    previousRaw === null
                        ? null
                        : (structuredClone(previousRaw) as TEvents[K])
                payload = updater(previous)
            } else {
                payload = payloadOrUpdater
            }
            const existing = keyframesRef.current.get(index) ?? []
            assertNoDuplicateEventAtIndex(existing, eventName, index)
            keyframesRef.current.set(index, [...existing, { eventKey: eventName, payload }])
        },
        [getPayloadWithFallback, keyframesRef, wrappedIndexRef]
    )

    const set = useCallback(
        (
            payloadOrUpdater: TCurrent | ((previous: TCurrent | null) => TCurrent),
            options: { rawIndex?: number } = {}
        ) => {
            const index = options.rawIndex ?? wrappedIndexRef.current
            let payload: TCurrent
            if (typeof payloadOrUpdater === 'function') {
                const updater = payloadOrUpdater as (previous: TCurrent | null) => TCurrent
                const previousRaw = getPayloadWithFallback(index, TIMELINE_CURRENT)
                const previous =
                    previousRaw === null
                        ? null
                        : (structuredClone(previousRaw) as TCurrent)
                payload = updater(previous)
            } else {
                payload = payloadOrUpdater
            }
            console.log(`${debugName}.set(${index}, ${payload})`)
            const existing = keyframesRef.current.get(index) ?? []
            assertNoDuplicateEventAtIndex(existing, TIMELINE_CURRENT, index)
            keyframesRef.current.set(index, [...existing, { eventKey: TIMELINE_CURRENT, payload }])
        },
        [getPayloadWithFallback, keyframesRef, wrappedIndexRef]
    )

    const resetKeyframes = useCallback(() => {
        console.log('resetKeyframes', debugName)
        keyframesRef.current.clear()
        onceFiredRef.current.clear()
        nextHandlerIdRef.current = 0
    }, [keyframesRef, onceFiredRef, nextHandlerIdRef])

    const reset = useCallback(() => {
        console.log('reset', debugName)
        keyframesRef.current.clear()
        handlersRef.current.clear()
        onceFiredRef.current.clear()
        nextHandlerIdRef.current = 0
    }, [keyframesRef, handlersRef, onceFiredRef, nextHandlerIdRef])

    const debug = useCallback(() => {
        const steps = Object.fromEntries(keyframesRef.current.entries().map(([index, keyframes]) => [index, Object.fromEntries(keyframes.map(kf => [formatEventKeyForError(kf.eventKey), kf.payload]))]))
        console.log('debug', debugName, '\n', {
            handlers: handlersRef.current.size,
            steps
        })
    }, [debugName])

    const addDependency = useCallback((childTimeline: AnyTimeline): void => {
        dependenciesRef.current.add(childTimeline)
        // If the child is 'pre', this timeline must also become 'pre' so that its own
        // parent (if any) will render it before 'post' siblings — propagating upward.
        if (childTimeline.order === 'pre' && orderRef.current !== 'pre') {
            if (orderExplicitRef.current) {
                console.warn(
                    `Timeline '${debugName}' was explicitly set to 'post' but child `
                    + `'${childTimeline.debugName}' is 'pre'. Overriding to 'pre'.`
                )
            }
            orderRef.current = 'pre'
        }
    }, [dependenciesRef, debugName])

    // useEffect(() => {
    //     if (triggerRender > 0) {
    //         internalRender()
    //     }
    // }, [triggerRender, internalRender])

    return useMemo(
        () => {
            const obj = {
                fullRender,
                debug,
                current,
                emit,
                set,
                before,
                on,
                after,
                once,
                chunked,
                reset,
                resetKeyframes,
                addDependency,
                render,
                assertRenderOrder,
                setParent,
                wrapTimelineHandlers,
                debugName,
            }
            // `order` is mutable (addDependency can propagate 'pre' upward), so expose
            // it as a live getter that always reads from the ref rather than a snapshot.
            Object.defineProperty(obj, 'order', {
                get: () => orderRef.current,
                enumerable: true,
                configurable: true,
            })
            return obj
        },
        [
            wrapTimelineHandlers,
            current,
            emit,
            set,
            before,
            on,
            after,
            once,
            chunked,
            reset,
            resetKeyframes,
            debug,
            addDependency,
            render,
            assertRenderOrder,
            setParent,
            fullRender,
            debugName,
        ]
    )
}

export type Timeline<
    TEvents extends Record<string, unknown> = Record<string, unknown>,
    TCurrent = unknown,
> = ReturnType<typeof useTimeline<TEvents, TCurrent>>

export type TimelineApi<
    TEvents extends Record<string, unknown> = Record<string, unknown>,
    TCurrent = unknown,
> = Timeline<TEvents, TCurrent>
