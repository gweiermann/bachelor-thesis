'use client'

import useSWR from 'swr'
import { FullLoadingSpinner } from '@/components/loading-spinner'
import { useEffect } from 'react'
import { analyzeCode } from '@/lib/code-analysis'

export default function Visualization({ code, task, onIsLoading }) {
    const { data: analysis, isLoading, error } = useSWR(['analyzeCode', task.name, code], () => analyzeCode(task.name, code), { revalidateOnFocus: false, suspense: false })

    useEffect(() => {
        onIsLoading?.(isLoading)
    }, [onIsLoading, isLoading])

    if (isLoading) {
        return <FullLoadingSpinner />
    }

    if (error) {
        return <div>Error: {error.message}</div>
    }

    return (
        <div>
            <h1>Visualization</h1>
            <pre>{JSON.stringify(analysis?.result, null, 2)}</pre>
        </div>
    )
}