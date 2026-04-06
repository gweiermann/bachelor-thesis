'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
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
    callback: (payload: DispatchPayload) => void
    options: HandlerOptions
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

export function useTimeline<
    TEvents extends Record<string, unknown> = Record<string, unknown>,
    TCurrent = unknown,
>() {
    const keyframesRef = useRef<Map<number, TimelineKeyframe[]>>(new Map()) // keyframeIndex -> keyframes at that step
    const handlersRef = useRef<Map<TimelineEventKey, RegisteredHandler[]>>(new Map())
    const onceFiredRef = useRef<Set<Function>>(new Set()) // handler callbacks
    const { currentRawIndex, createGroup, getGroup, wrapWithIndex, wrappedIndex, registerBakingRecipe } = useVisualizationBaking()

    const getPayloadWithFallback = useCallback((rawIndex: number, eventKey: TimelineEventKey): unknown | null => {
        // fixme: performance of sorting each time is not optimal
        const atRaw = findKeyframeEntry(keyframesRef.current.get(rawIndex), eventKey)
        if (atRaw !== undefined) {
            return atRaw.payload
        }
        for (let j = rawIndex; j >= 0; j--) {
            const hit = findKeyframeEntry(keyframesRef.current.get(j), eventKey)
            if (hit !== undefined) {
                return hit.payload
            }
        }
        return null
    }, [keyframesRef])

    const current = useMemo(
        (): TCurrent | null => getPayloadWithFallback(currentRawIndex, TIMELINE_CURRENT) as TCurrent | null,
        [getPayloadWithFallback, currentRawIndex],
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
            const handlers = handlersRef.current.get(eventKey) ?? []
            handlers.push({
                eventKey,
                callback,
                options: options ?? {}
            })
            handlersRef.current.set(eventKey, handlers)
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
            register(eventName, parameter => {
                if (onceFiredRef.current.has(handler)) {
                    return
                }
                onceFiredRef.current.add(handler)
                handler(parameter)
            }, { ...options })
        }) as TimelineOnce<TEvents>,
        [register, onceFiredRef]
    )

    const chunked = useCallback(
        <TEventName extends keyof TEvents & string>(eventName: TEventName, chunkSize: number, handler: (payload: TEvents[TEventName][]) => void) => {
            if (chunkSize <= 1) {
                throw new Error("chunkSize must be at least 2")
            }
            register(eventName, handler as (payload: DispatchPayload) => void, { chunked: chunkSize, grouped: true })
        },
        [register]
    )

    const runEventHandlers = useCallback(
        () => {
            type Scheduled = {
                callback: (payload: DispatchPayload) => void
                eventKey: TimelineEventKey
                placementIndex: number
                payloadIndex: number
                isSinglePayload: boolean
            }

            const lastIndex = Math.max(...keyframesRef.current.keys())
            const chunkedHandlers = new Map<RegisteredHandler, number>()

            const fullList: Scheduled[] = []

            for (let i = 0; i < lastIndex; ++i) {
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
                                chunkedHandlers.set(handler, count)
                                createGroup(i - chunkSize, chunkSize)
                                continue
                            } else {
                                chunkedHandlers.set(handler, 0)
                            }
                        }
                        fullList.push({
                            callback: handler.callback,
                            eventKey: keyframe.eventKey,
                            payloadIndex: i,
                            placementIndex: i + handler.options.globalRelativeOffset,
                            isSinglePayload: !handler.options.grouped,
                        })
                    }
                }
            }

            fullList
                .toSorted((a, b) => a.placementIndex - b.placementIndex)
                .forEach(schedule => {
                    const payloadGroup = getGroup(schedule.payloadIndex)
                    const payloads = getPayloads(payloadGroup.rawIndex, payloadGroup.size, schedule.eventKey)
                    if (payloads.length === 0) {
                        throw new Error('well somethings wrong here')
                    }
                    if (schedule.isSinglePayload && payloads.length > 1) {
                        console.error(`event handler didn't expect a group at step ${payloadGroup.stepIndex}`)
                    }
                    const parameter = schedule.isSinglePayload ? payloads[0] : payloads
                    wrapWithIndex(schedule.placementIndex, () => schedule.callback(parameter))
                })
        }, [createGroup, getGroup, getPayloads, handlersRef, wrapWithIndex])

    const emit = useCallback(
        <K extends keyof TEvents & string>(
            eventName: K,
            payloadOrUpdater: TEvents[K] | ((previous: TEvents[K] | null) => TEvents[K]),
            options: { rawIndex?: number } = {}
        ) => {
            const index = options.rawIndex ?? wrappedIndex
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
        [wrappedIndex, getPayloadWithFallback]
    )

    const set = useCallback(
        (
            payloadOrUpdater: TCurrent | ((previous: TCurrent | null) => TCurrent),
            options: { rawIndex?: number } = {}
        ) => {
            const index = options.rawIndex ?? wrappedIndex
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
            const existing = keyframesRef.current.get(index) ?? []
            assertNoDuplicateEventAtIndex(existing, TIMELINE_CURRENT, index)
            keyframesRef.current.set(index, [...existing, { eventKey: TIMELINE_CURRENT, payload }])
        },
        [wrappedIndex, getPayloadWithFallback]
    )

    const reset = useCallback(() => {
        keyframesRef.current.clear()
        handlersRef.current.clear()
        onceFiredRef.current = new Set()
    }, [keyframesRef, handlersRef, onceFiredRef])

    useEffect(() => {
        registerBakingRecipe({
            reset,
            bake: runEventHandlers
        })
    }, [reset, runEventHandlers, registerBakingRecipe])


    return useMemo(
        () => ({
            current,
            emit,
            set,
            before,
            on,
            after,
            once,
            chunked,
            reset,
        }),
        [
            current,
            emit,
            set,
            before,
            on,
            after,
            once,
            chunked,
            reset,
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
