import { runTests } from "@/lib/build"
import { useEffect } from "react"
import useSWR from "swr"
import { useTests, useUserCode } from "./stores"
import { Task } from "@/lib/tasks"

interface LoadTestsProps {
    task: Task
}

export default function LoadTests({ task }: LoadTestsProps): null {
    const firstLoadingMessage = 'Waiting for compilation...'

    const { codeToBeRun, runCount } = useUserCode()
    const {  setLoadingMessage, setIsLoading, setErrorMessage, setResult } = useTests()

    const { data: testResult, isLoading, error } = useSWR(
        ['testCode', task.name, codeToBeRun, runCount],
        () => runTests(task, codeToBeRun, setLoadingMessage),
        { revalidateOnFocus: false, suspense: false, shouldRetryOnError: false }
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
        setResult(testResult)
    }, [testResult, setResult])

    return null
}