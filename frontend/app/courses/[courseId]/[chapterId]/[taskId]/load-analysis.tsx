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

    const { codeToBeRun, runCount } = useUserCode()
    const {  setLoadingMessage, setIsLoading, setErrorMessage, setResult } = useVisualization()

    const { data: analysisResult, isLoading, error } = useSWR(
        ['analyzeCode', task.name, codeToBeRun, runCount],
        // () => runAnalysis(task, codeToBeRun.replaceAll('arr', 'arr2'), setLoadingMessage), // test if code structure can be malformed
        () => runAnalysis(task, codeToBeRun, setLoadingMessage),
        { revalidateOnFocus: false, suspense: false }
    )

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
        setErrorMessage(error?.message)
    }, [error, setErrorMessage])

    useEffect(() => {
        setResult(analysisResult)
    }, [analysisResult, setResult])

    return null
}