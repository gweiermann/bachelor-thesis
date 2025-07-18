export interface TestCase {
    id: string
    suite: string
    input: number[]
    expected: number[]
}

export type TaskStatus = 'completed' | 'in-progress' | 'not-started'
 
const db = [
    {
        id: "ads",
        title: "Algorithmen und Datenstrukturen (ADS)",
        description: "Master algorithms and data structures",
        progress: 0,
        chapters: [
            {
                id: "sorting",
                title: "Sorting",
                progress: 0,
                tasks: [
                    {
                        id: "bubble-sort",
                        presetName: 'sort',
                        title: "Bubble Sort",
                        status: 'completed',
                        description: `Bubble sort is a simple sorting algorithm that repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order. The pass through the list is repeated until the list is sorted.\nHere's how it works step-by-step:\n1.  **Start at the beginning of the list.**\n2.  **Compare the first two elements.**\n3.  **If the first element is greater than the second element, swap them.**\n4.  **Move to the next pair of adjacent elements (second and third) and repeat step 3.**\n5.  **Continue this process until the end of the list is reached.** At this point, the largest element will have "bubbled" to the end of the list.\n6.  **Repeat steps 1-5 for the remaining unsorted portion of the list.** In each subsequent pass, the range of the unsorted portion decreases by one because the largest element from the previous pass is now in its correct position.\n7.  **Keep repeating the passes until no more swaps are needed.** This indicates that the list is sorted.\n**Example:**\nLet's say we have the list \`[5, 1, 4, 2, 8]\`.\n**Pass 1:**\n* Compare 5 and 1: Swap (1, 5, 4, 2, 8)\n* Compare 5 and 4: Swap (1, 4, 5, 2, 8)\n* Compare 5 and 2: Swap (1, 4, 2, 5, 8)\n* Compare 5 and 8: No swap (1, 4, 2, 5, 8)\n    *(8 is now in its correct position)*\n**Pass 2:**\n* Compare 1 and 4: No swap (1, 4, 2, 5, 8)\n* Compare 4 and 2: Swap (1, 2, 4, 5, 8)\n* Compare 4 and 5: No swap (1, 2, 4, 5, 8)\n    *(5 is now in its correct position)*\n**Pass 3:**\n* Compare 1 and 2: No swap (1, 2, 4, 5, 8)\n* Compare 2 and 4: No swap (1, 2, 4, 5, 8)\n    *(4 is now in its correct position)*\n**Pass 4:**\n* Compare 1 and 2: No swap (1, 2, 4, 5, 8)\n    *(2 is now in its correct position)*\nThe list is now sorted: \`[1, 2, 4, 5, 8]\`.\n**Time Complexity:**\n* **Worst-case and average-case:** O(n^2), where n is the number of elements in the list. This is because we might need to make multiple passes through the list, and in each pass, we compare and potentially swap elements.\n* **Best-case:** O(n), if the list is already sorted. In this case, only one pass is needed to confirm the order.\n**Space Complexity:**\n* O(1) because bubble sort is an in-place sorting algorithm, meaning it doesn't require any significant extra space.\n**Advantages:**\n* Simple to understand and implement.\n* Easy to debug.\n**Disadvantages:**\n* Inefficient for large lists due to its quadratic time complexity.\n* Not practical for real-world applications where performance is critical.\nIn summary, bubble sort is a basic sorting algorithm that works by repeatedly comparing and swapping adjacent elements. While easy to understand, its poor performance makes it unsuitable for sorting large datasets.`,
                    },
                    {
                        id: "insertion-sort",
                        presetName: 'sort',
                        title: "Insertion Sort",
                        status: 'completed',
                        description: 'Lorem Ipsum...'
                    },
                    {
                        id: "selection-sort",
                        presetName: 'sort',
                        title: "Selection Sort",
                        status: 'in-progress',
                        description: 'Lorem Ipsum...'
                    },
                ]
            },
            {
                id: "sorting-recursion",
                title: "Sorting with Recursion",
                progress: 0,
                tasks: [
                    {
                        id: "quick-sort",
                        presetName: 'quick-sort',
                        title: "Quick Sort",
                        status: 'not-started',
                        description: "## Quick Sort Erklärung\n\n**Quick Sort** ist ein **rekursiver Sortieralgorithmus**, der das **Teile-und-herrsche-Prinzip** verwendet. Die grundlegende Idee ist:\n\n1. Wähle ein **Pivot-Element** (in unserem Fall **immer das rechte Element des aktuellen Bereichs**).\n2. **Partitioniere** das Array so, dass alle Elemente, die **kleiner oder gleich** dem Pivot sind, **links** und alle größeren **rechts** liegen.\n3. Rufe den Algorithmus **rekursiv** auf die linken und rechten Teillisten auf.\n\n### Anforderungen an die Implementierung\n\n- Die Funktion `quickSort(array, length)` ist bereits vorhanden und stellt den Einstiegspunkt dar.\n- Die eigentliche Sortierlogik wird in `quickSortRecursive(array, low, high)` umgesetzt.\n- Die Partitionierung wird in der Funktion `partition(array, low, high)` durchgeführt.\n- Das Pivot-Element ist **immer das rechte Element des aktuellen Bereichs** `array[high]`."
                    },
                    { 
                        id: "merge-sort",
                        presetName: 'merge-sort',
                        title: "Merge Sort",
                        status: 'not-started',
                        description: 'Lorem Ipsum...'
                    },
                ]
            },
            {
                id: "bst",
                title: "Binary Search Trees",
                progress: 0,
                tasks: [
                    {
                        id: "bst-insert",
                        presetName: 'bst-insert',
                        title: "Insertion in BST",
                        status: 'completed',
                        description: 'Insert a new node into a binary search tree (BST) while maintaining the BST property.',
                    }
                ]
            },
        ],
    }
] satisfies Course[]

export interface CourseSlim {
    id: string
    title: string
    description: string
    progress: number
}

export interface Course extends CourseSlim {
    chapters: ChapterSlim[]
}

export interface ChapterSlim {
    id: string
    title: string
    progress: number
}

export interface Chapter extends ChapterSlim {
    tasks: Task[]
}

export interface Task {
    id: string
    title: string
    description: string
    status: TaskStatus,
    presetName: string
    courseId: string
    chapterId: string
}


export async function getCourses(): Promise<CourseSlim[]> {
    return db
}

export async function getCourse(courseId: string): Promise<Course> {
    return db.find(({id}) => id === courseId)
}

export async function getChapter(courseId: string, chapterId: string): Promise<Chapter> {
    return db
        .find(({id}) => id === courseId)
        ?.chapters.find(({id}) => id === chapterId)
}

export async function getTask(courseId: string, chapterId: string, taskId: string): Promise<Task> {
    const task = db
        .find(({id}) => id === courseId)
        ?.chapters.find(({id}) => id === chapterId)
        ?.tasks.find(({id}) => id === taskId)
    return {
        ...task,
        courseId,
        chapterId
    }
}
