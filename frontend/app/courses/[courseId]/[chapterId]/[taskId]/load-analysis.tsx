import { runAnalysis } from "@/lib/build"
import { useEffect } from "react"
import useSWR from "swr"
import { useUserCode, useVisualization } from "./stores"
import { Task } from "@/lib/tasks"

interface LoadAnalysisProps {
    task: Task
}

export default function LoadAnalysis({ task }: LoadAnalysisProps): null {
    const firstLoadingMessage = 'Waiting for compilation...'

    const { functionBodiesToBeRun, runCount } = useUserCode()
    const {  setLoadingMessage, setIsLoading, setErrorMessage, setResult } = useVisualization()

    const { data: analysisResult, isLoading, error } = useSWR(
        ['analyzeCode', task.name, functionBodiesToBeRun, runCount],
        () => runAnalysis(task, functionBodiesToBeRun, setLoadingMessage),
        { revalidateOnFocus: false, suspense: false }
    )

    useEffect(() => {
        if (isLoading && functionBodiesToBeRun) {
            setLoadingMessage(firstLoadingMessage)
            setIsLoading(true)
        } else {
            setLoadingMessage(null)
            setIsLoading(false)
        }
    }, [isLoading, setIsLoading, setLoadingMessage, functionBodiesToBeRun])

    useEffect(() => {
        setErrorMessage(error?.message)
    }, [error, setErrorMessage])

    useEffect(() => {
        setResult(analysisResult)
        if (analysisResult) {
            console.log(analysisResult)
        }
    }, [analysisResult, setResult])

    return null
}