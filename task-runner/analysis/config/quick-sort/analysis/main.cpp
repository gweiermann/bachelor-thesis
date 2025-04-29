#include "user-input.h"

int main() {
    int arr[] = {5, 2, 7, 1, 8, 3, 6, 4};
    int n = sizeof(arr)/sizeof(arr[0]);
    quickSort(arr, n);
}
