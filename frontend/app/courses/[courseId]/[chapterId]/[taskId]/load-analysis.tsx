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

    task = {
        "id": "bubble-sort",
        "presetName": "sort",
        "title": "Bubble Sort",
        "status": "completed",
        "description": "Bubble sort is a simple sorting algorithm that repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order. The pass through the list is repeated until the list is sorted.\nHere's how it works step-by-step:\n1.  **Start at the beginning of the list.**\n2.  **Compare the first two elements.**\n3.  **If the first element is greater than the second element, swap them.**\n4.  **Move to the next pair of adjacent elements (second and third) and repeat step 3.**\n5.  **Continue this process until the end of the list is reached.** At this point, the largest element will have \"bubbled\" to the end of the list.\n6.  **Repeat steps 1-5 for the remaining unsorted portion of the list.** In each subsequent pass, the range of the unsorted portion decreases by one because the largest element from the previous pass is now in its correct position.\n7.  **Keep repeating the passes until no more swaps are needed.** This indicates that the list is sorted.\n**Example:**\nLet's say we have the list `[5, 1, 4, 2, 8]`.\n**Pass 1:**\n* Compare 5 and 1: Swap (1, 5, 4, 2, 8)\n* Compare 5 and 4: Swap (1, 4, 5, 2, 8)\n* Compare 5 and 2: Swap (1, 4, 2, 5, 8)\n* Compare 5 and 8: No swap (1, 4, 2, 5, 8)\n    *(8 is now in its correct position)*\n**Pass 2:**\n* Compare 1 and 4: No swap (1, 4, 2, 5, 8)\n* Compare 4 and 2: Swap (1, 2, 4, 5, 8)\n* Compare 4 and 5: No swap (1, 2, 4, 5, 8)\n    *(5 is now in its correct position)*\n**Pass 3:**\n* Compare 1 and 2: No swap (1, 2, 4, 5, 8)\n* Compare 2 and 4: No swap (1, 2, 4, 5, 8)\n    *(4 is now in its correct position)*\n**Pass 4:**\n* Compare 1 and 2: No swap (1, 2, 4, 5, 8)\n    *(2 is now in its correct position)*\nThe list is now sorted: `[1, 2, 4, 5, 8]`.\n**Time Complexity:**\n* **Worst-case and average-case:** O(n^2), where n is the number of elements in the list. This is because we might need to make multiple passes through the list, and in each pass, we compare and potentially swap elements.\n* **Best-case:** O(n), if the list is already sorted. In this case, only one pass is needed to confirm the order.\n**Space Complexity:**\n* O(1) because bubble sort is an in-place sorting algorithm, meaning it doesn't require any significant extra space.\n**Advantages:**\n* Simple to understand and implement.\n* Easy to debug.\n**Disadvantages:**\n* Inefficient for large lists due to its quadratic time complexity.\n* Not practical for real-world applications where performance is critical.\nIn summary, bubble sort is a basic sorting algorithm that works by repeatedly comparing and swapping adjacent elements. While easy to understand, its poor performance makes it unsuitable for sorting large datasets.",
        "courseId": "ads",
        "chapterId": "sorting"
    }

    const codeToBeRun = `
#pragma region prototypes
// insert custom functions here (or prototypes)
void swap(int& a, int& b);

#pragma endregion prototypes

void sort(int* arr, int n) {
    arr[0] = 0;
}

#pragma region custom_functions
// insert custom functions here

void swap(int& a, int& b) {
    int temp = a;
    a = b;
    b = temp;
}

#pragma endregion custom_functions
`

    
    // const { codeToBeRun, runCount, setMarkers } = useUserCode()
    const { runCount, setMarkers } = useUserCode()
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
            return 'Compilation failed. See code editor for more details.\n' + data.message
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