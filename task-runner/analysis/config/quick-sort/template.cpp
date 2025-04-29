// insert custom functions here (or prototypes)
// <user-code-start>
void swap(int* a, int* b);

// <user-code-end>
void quickSort(int* arr, int n) {
// <user-code-start>
    quickSortRecursive(arr, 0, n - 1);
// <user-code-end>
}

void quickSortRecursive(int* arr, int low, int high) {
// <user-code-start>
    // todo: add your code here
// <user-code-end>
}

int partition(int* arr, int low, int high) {
// <user-code-start>
    // todo: add your code here
// <user-code-end>
}

// insert custom functions here (if prototype is defined above)
// <user-code-start>
void swap(int* a, int* b) {
    int temp = *a;
    *a = *b;
    *b = temp;
}
// <user-code-end>