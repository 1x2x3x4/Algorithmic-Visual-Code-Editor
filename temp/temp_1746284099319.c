#include <stdio.h>

// 冒泡排序算法实现
void bubbleSort(int arr[], int n) {
    int i, j;
    for (i = 0; i < n-1; i++) {
        // 最后i个元素已经在正确位置
        for (j = 0; j < n-i-1; ) {
            // 如果当前元素大于下一个元素，交换它们
            if (arr[j] > arr[j+1]) {
                int temp = arr[j];
                arr[j] = arr[j+1];
                arr[j+1] = temp;
            }
        }
    }
}

// 打印数组函数
void printArray(int arr[], int size) {
    int i;
    for (i = 0; i < size; i++)
        printf("%d ", arr[i]);
    printf("\n");
}

// 主函数演示冒泡排序
int main() {
    int arr[] = {64, 34, 25, 12, 22, 11, 90};
    int n = sizeof(arr) / sizeof(arr[0]);
    
    printf("原始数组: \n");
    printArray(arr, n);
    
    bubbleSort(arr, n);
    
    printf("排序后数组: \n");
    printArray(arr, n);
    
    return 0;
}