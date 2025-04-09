export interface TestCase {
    id: string
    suite: string
    input: number[]
    expectedOutput: number[]
}

export interface Task {
    name: string
    longName: string
    description: string
    difficulty: string
    presetName: string
    functionPrototype: string
}

export async function getTask(name: string): Promise<Task | null> {
    if (name === 'bubble-sort') {
        return {
            name,
            longName: 'Bubble Sort',
            description: `Bubble sort is a simple sorting algorithm that repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order. The pass through the list is repeated until the list is sorted.\nHere's how it works step-by-step:\n1.  **Start at the beginning of the list.**\n2.  **Compare the first two elements.**\n3.  **If the first element is greater than the second element, swap them.**\n4.  **Move to the next pair of adjacent elements (second and third) and repeat step 3.**\n5.  **Continue this process until the end of the list is reached.** At this point, the largest element will have "bubbled" to the end of the list.\n6.  **Repeat steps 1-5 for the remaining unsorted portion of the list.** In each subsequent pass, the range of the unsorted portion decreases by one because the largest element from the previous pass is now in its correct position.\n7.  **Keep repeating the passes until no more swaps are needed.** This indicates that the list is sorted.\n**Example:**\nLet's say we have the list \`[5, 1, 4, 2, 8]\`.\n**Pass 1:**\n* Compare 5 and 1: Swap (1, 5, 4, 2, 8)\n* Compare 5 and 4: Swap (1, 4, 5, 2, 8)\n* Compare 5 and 2: Swap (1, 4, 2, 5, 8)\n* Compare 5 and 8: No swap (1, 4, 2, 5, 8)\n    *(8 is now in its correct position)*\n**Pass 2:**\n* Compare 1 and 4: No swap (1, 4, 2, 5, 8)\n* Compare 4 and 2: Swap (1, 2, 4, 5, 8)\n* Compare 4 and 5: No swap (1, 2, 4, 5, 8)\n    *(5 is now in its correct position)*\n**Pass 3:**\n* Compare 1 and 2: No swap (1, 2, 4, 5, 8)\n* Compare 2 and 4: No swap (1, 2, 4, 5, 8)\n    *(4 is now in its correct position)*\n**Pass 4:**\n* Compare 1 and 2: No swap (1, 2, 4, 5, 8)\n    *(2 is now in its correct position)*\nThe list is now sorted: \`[1, 2, 4, 5, 8]\`.\n**Time Complexity:**\n* **Worst-case and average-case:** O(n^2), where n is the number of elements in the list. This is because we might need to make multiple passes through the list, and in each pass, we compare and potentially swap elements.\n* **Best-case:** O(n), if the list is already sorted. In this case, only one pass is needed to confirm the order.\n**Space Complexity:**\n* O(1) because bubble sort is an in-place sorting algorithm, meaning it doesn't require any significant extra space.\n**Advantages:**\n* Simple to understand and implement.\n* Easy to debug.\n**Disadvantages:**\n* Inefficient for large lists due to its quadratic time complexity.\n* Not practical for real-world applications where performance is critical.\nIn summary, bubble sort is a basic sorting algorithm that works by repeatedly comparing and swapping adjacent elements. While easy to understand, its poor performance makes it unsuitable for sorting large datasets.`,
            difficulty: 'Easy',
            presetName: 'sort',
            functionPrototype: 'void bubbleSort(int arr[], int n)',
        }
    }
    return null
}