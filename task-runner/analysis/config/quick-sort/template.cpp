#pragma region prototypes

void quickSort(int*, int);
void quickSortRecursive(int*, int, int);
int partition(int*, int, int);
// <user-code-start>
// add custom prototypes here:
void swap(int&, int&);

// <user-code-end>
#pragma endregion prototypes


void quickSort(int* arr, int n) {
// <user-code-start>
    quickSortRecursive(arr, 0, n - 1); // already implemented for you ;)
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


#pragma region custom_functions
// <user-code-start>
// insert custom functions here:

void swap(int& a, int& b) {
    int temp = a;
    a = b;
    b = temp;
}

// <user-code-end>
#pragma endregion custom_functions