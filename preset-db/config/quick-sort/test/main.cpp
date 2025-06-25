#include <iostream>
void quickSort(int* arr, int n);

int main() {
    int testCases;
    std::cin >> testCases;
    while (testCases--) {
        int n;
        std::cin >> n;
        int* arr = new int[n];
        for (int i = 0; i < n; i++) {
            std::cin >> arr[i];
        }
        quickSort(arr, n);
        std::cout << n << " ";
        for (int i = 0; i < n; i++) {
            std::cout << arr[i] << " ";
        }
        delete[] arr;
    }
}