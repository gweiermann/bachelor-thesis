'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useVisualizationBaking } from './visualization-baking-context'

export type TimelineKeyframe = {
    eventName: string
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
    eventName: string
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

export function useTimeline<TEvents extends Record<string, unknown> = Record<string, unknown>>() {
    const keyframesRef = useRef<Map<number, TimelineKeyframe[]>>(new Map()) // keyframeIndex -> keyframes at that step
    const handlersRef = useRef<Map<string, RegisteredHandler[]>>(new Map()) // eventName -> handlers
    const onceFiredRef = useRef<Set<Function>>(new Set()) // handler callbacks
    const { currentRawIndex, createGroup, getGroup, wrapWithIndex, wrappedIndex, registerBakingRecipe } = useVisualizationBaking()

    const getPayloadWithFallback = useCallback((rawIndex: number): TEvents[string] | null => {
        // fixme: performance of sorting each time is not optimal
        const keyframesAt = keyframesRef.current.get(rawIndex)
        if (keyframesAt?.length) {
            return Object.assign({}, ...keyframesAt.map(k => k.payload)) as TEvents[string]
        }
        const indices = [...keyframesRef.current.keys()].toSorted((a, b) => a - b)
        const ind = indices.findLastIndex(i => i < rawIndex)
        if (ind === -1) {
            return null
        }
        const payloads = keyframesRef.current.get(indices[ind])?.map(k => k.payload)
        return Object.assign({}, ...payloads)
    }, [keyframesRef])

    const current = useMemo(() => getPayloadWithFallback(currentRawIndex), [getPayloadWithFallback, currentRawIndex])

    const getPayloads = useCallback((rawIndex: number, groupSize: number): TEvents[string][] => {
        const payloads: TEvents[string][] = []
        for (let i = 0; i < groupSize; i++) {
            const keyframesAt = keyframesRef.current.get(rawIndex + i) ?? []
            payloads.push(Object.assign({}, ...keyframesAt.map(k => k.payload)))
        }
        return payloads
    }, [keyframesRef])
    
    const register = useCallback(
        (eventName: keyof TEvents & string, callback: (payload: DispatchPayload) => void, options?: HandlerOptions) => {
            const handlers = handlersRef.current.get(eventName) ?? []
            handlers.push({
                eventName,
                callback,
                options: options ?? {}
            })
            handlersRef.current.set(eventName, handlers)
        },
        [handlersRef]
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
                    const handlers = handlersRef.current.get(keyframe.eventName) ?? []
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
                    const payloads = getPayloads(payloadGroup.rawIndex, payloadGroup.size)
                    if (payloads.length === 0) {
                        throw new Error('well somethings wrong here')
                    }
                    if (schedule.isSinglePayload && payloads.length > 1) {
                        console.error(`event handler didn't expect a group at step ${payloadGroup.stepIndex}`)
                    }
                    const parameter = schedule.isSinglePayload ? payloads[0] : payloads
                    wrapWithIndex(schedule.placementIndex, () => schedule.callback(parameter))
                })
        }, [handlersRef])

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
                const previousRaw = getPayloadWithFallback(index)
                const previous =
                    previousRaw === null
                        ? null
                        : (structuredClone(previousRaw) as TEvents[K])
                payload = updater(previous)
            } else {
                payload = payloadOrUpdater
            }
            const existing = keyframesRef.current.get(index) ?? []
            existing.push({ eventName, payload })
            keyframesRef.current.set(index, existing)
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
            before,
            on,
            after,
            once,
            chunked,
            reset,
        }),
        [
            emit,
            before,
            on,
            after,
            once,
            chunked,
            reset,
        ]
    )
}

export type Timeline<TEvents extends Record<string, unknown> = Record<string, unknown>> = ReturnType<typeof useTimeline<TEvents>>

export type TimelineApi<TEvents extends Record<string, unknown> = Record<string, unknown>> = Timeline<TEvents>
