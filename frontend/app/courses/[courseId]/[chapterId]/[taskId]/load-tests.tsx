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

    const { functionBodiesToBeRun } = useUserCode()
    const {  setLoadingMessage, setIsLoading, setErrorMessage, setResult } = useTests()

    const { data: testResult, isLoading, error } = useSWR(
        ['testCode', task.name, functionBodiesToBeRun],
        () => runTests(task, functionBodiesToBeRun, setLoadingMessage),
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
        setResult(testResult)
    }, [testResult, setResult])

    return null
}