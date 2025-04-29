void quickSort(int*, int);
void quickSortRecursive(int*, int, int);
int partition(int*, int, int);
// your own prototypes:
// <user-code-start>
void swap(int&, int&);

// <user-code-end>
void quickSort(int* arr, int n) {
// <user-code-start>
    quickSortRecursive(arr, 0, n - 1);
// <user-code-end>
}

// -------- what you need to implement: ------------------

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

// -----------------------------------------------------------

// your own functions:
// <user-code-start>
void swap(int& a, int& b) {
    int temp = a;
    a = b;
    b = temp;
}
// <user-code-end>