import { runAnalysis } from "@/lib/build"
import { useEffect, useMemo } from "react"
import useSWR from "swr"
import { useUserCode, useVisualization } from "./stores"
import { Task } from "@/lib/tasks"

interface LoadAnalysisProps {
    task: Task
}

export default function LoadAnalysis({ task }: LoadAnalysisProps): null {
    const firstLoadingMessage = 'Waiting for compilation...'

    const { codeToBeRun, runCount, setMarkers } = useUserCode()
    const {  setLoadingMessage, setIsLoading, setErrorMessage, setResult } = useVisualization()

    const { data, isLoading, error: err } = useSWR(
        ['analyzeCode', task.name, codeToBeRun, runCount],
        // () => runAnalysis(task, codeToBeRun.replaceAll('arr', 'arr2'), setLoadingMessage), // test if code structure can be malformed
        () => runAnalysis(task, codeToBeRun, setLoadingMessage),
        { revalidateOnFocus: false, suspense: false }
    )

    const error = useMemo(() => {
        if (err) {
            return err.message
        }
        if (data?.status === 'user-error') {
            return data.message
        }
        if (data?.status === 'compilation-error') {
            return 'Compilation failed. See code editor for more details.'
        }
        return null
    }, [err, data])

    const analysisResult = useMemo(() => data?.status === 'success' ? data.result : null, [data])

    useEffect(() => {
        if (data?.status === 'compilation-error') {
            setMarkers(data.markers)
        } else if (data?.status === 'success') {
            setMarkers([])
        }
    }, [data, setMarkers])

    useEffect(() => {
        if (isLoading && codeToBeRun) {
            setLoadingMessage(firstLoadingMessage)
            setIsLoading(true)
        } else {
            setLoadingMessage(null)
            setIsLoading(false)
        }
    }, [isLoading, setIsLoading, setLoadingMessage, codeToBeRun])

    useEffect(() => {
        setErrorMessage(error)
    }, [error, setErrorMessage])

    useEffect(() => {
        setResult(analysisResult)
    }, [analysisResult, setResult])

    return null
}