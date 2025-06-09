import { runTests } from "@/lib/build"
import { useEffect, useMemo } from "react"
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

    const { data, isLoading, error: err } = useSWR(
        ['testCode', task.name, codeToBeRun, runCount],
        () => runTests(task, codeToBeRun, setLoadingMessage),
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
    const testResult = useMemo(() => data?.status === 'success' ? data.result : null, [data])

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
        setResult(testResult)
    }, [testResult, setResult])

    return null
}