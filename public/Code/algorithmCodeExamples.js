/**
 * 算法代码示例集合
 * 包含各种算法的C语言实现
 */
window.algorithmCodeExamples = {
    // 排序算法
    'bubbleSort': {
        'c': `#include <stdio.h>

// 冒泡排序算法实现
void bubbleSort(int arr[], int n) {
    int i, j;
    for (i = 0; i < n-1; i++) {
        // 最后i个元素已经在正确位置
        for (j = 0; j < n-i-1; j++) {
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
    printf("\\n");
}

// 主函数演示冒泡排序
int main() {
    int arr[] = {64, 34, 25, 12, 22, 11, 90};
    int n = sizeof(arr) / sizeof(arr[0]);
    
    printf("原始数组: \\n");
    printArray(arr, n);
    
    bubbleSort(arr, n);
    
    printf("排序后数组: \\n");
    printArray(arr, n);
    
    return 0;
}`
    },
    
    'selectionSort': {
        'c': `#include <stdio.h>

// 选择排序算法实现
void selectionSort(int arr[], int n) {
    int i, j, min_idx;
    
    // 一个一个移动边界
    for (i = 0; i < n-1; i++) {
        // 找出未排序部分中的最小元素
        min_idx = i;
        for (j = i+1; j < n; j++) {
            if (arr[j] < arr[min_idx])
                min_idx = j;
        }
        
        // 将找到的最小元素与未排序部分的第一个元素交换
        if (min_idx != i) {
            int temp = arr[min_idx];
            arr[min_idx] = arr[i];
            arr[i] = temp;
        }
    }
}

// 打印数组函数
void printArray(int arr[], int size) {
    int i;
    for (i = 0; i < size; i++)
        printf("%d ", arr[i]);
    printf("\\n");
}

// 主函数演示选择排序
int main() {
    int arr[] = {64, 25, 12, 22, 11};
    int n = sizeof(arr) / sizeof(arr[0]);
    
    printf("原始数组: \\n");
    printArray(arr, n);
    
    selectionSort(arr, n);
    
    printf("排序后数组: \\n");
    printArray(arr, n);
    
    return 0;
}`
    },
    
    'insertionSort': {
        'c': `#include <stdio.h>

// 插入排序算法实现
void insertionSort(int arr[], int n) {
    int i, key, j;
    for (i = 1; i < n; i++) {
        key = arr[i];  // 当前要插入的元素
        j = i - 1;     // 已排序部分的最后位置
        
        // 将比key大的元素向右移
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j = j - 1;
        }
        
        // 找到适当位置后将key插入
        arr[j + 1] = key;
    }
}

// 打印数组函数
void printArray(int arr[], int size) {
    int i;
    for (i = 0; i < size; i++)
        printf("%d ", arr[i]);
    printf("\\n");
}

// 主函数演示插入排序
int main() {
    int arr[] = {12, 11, 13, 5, 6};
    int n = sizeof(arr) / sizeof(arr[0]);
    
    printf("原始数组: \\n");
    printArray(arr, n);
    
    insertionSort(arr, n);
    
    printf("排序后数组: \\n");
    printArray(arr, n);
    
    return 0;
}`
    },
    
    'quickSort': {
        'c': `#include <stdio.h>

// 交换两个元素的函数
void swap(int* a, int* b) {
    int t = *a;
    *a = *b;
    *b = t;
}

// 划分数组的函数
int partition(int arr[], int low, int high) {
    int pivot = arr[high];  // 选择最后一个元素作为基准
    int i = (low - 1);      // 较小元素的索引
    
    for (int j = low; j <= high - 1; j++) {
        // 如果当前元素小于等于基准
        if (arr[j] <= pivot) {
            i++;  // 增加较小元素的索引
            swap(&arr[i], &arr[j]);
        }
    }
    
    // 将基准放到正确的位置
    swap(&arr[i + 1], &arr[high]);
    return (i + 1);  // 返回基准的位置
}

// 快速排序的主函数
void quickSort(int arr[], int low, int high) {
    if (low < high) {
        // pi是基准的位置，arr[pi]现在在正确的位置上
        int pi = partition(arr, low, high);
        
        // 分别对基准左边和右边的子数组进行排序
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}

// 打印数组函数
void printArray(int arr[], int size) {
    int i;
    for (i = 0; i < size; i++)
        printf("%d ", arr[i]);
    printf("\\n");
}

// 主函数演示快速排序
int main() {
    int arr[] = {10, 7, 8, 9, 1, 5};
    int n = sizeof(arr) / sizeof(arr[0]);
    
    printf("原始数组: \\n");
    printArray(arr, n);
    
    quickSort(arr, 0, n - 1);
    
    printf("排序后数组: \\n");
    printArray(arr, n);
    
    return 0;
}`
    },
    
    'linkedList': {
        'c': `#include <stdio.h>
#include <stdlib.h>

// 定义链表节点结构体
struct Node {
    int data;
    struct Node* next;
};

// 创建新节点
struct Node* createNode(int data) {
    struct Node* newNode = (struct Node*)malloc(sizeof(struct Node));
    if (newNode == NULL) {
        printf("内存分配失败");
        exit(1);
    }
    newNode->data = data;
    newNode->next = NULL;
    return newNode;
}

// 在链表末尾插入节点
void append(struct Node** headRef, int data) {
    struct Node* newNode = createNode(data);
    
    // 如果链表为空，新节点就是头节点
    if (*headRef == NULL) {
        *headRef = newNode;
        return;
    }
    
    // 否则，遍历到链表末尾并插入
    struct Node* last = *headRef;
    while (last->next != NULL) {
        last = last->next;
    }
    last->next = newNode;
}

// 在链表开头插入节点
void prepend(struct Node** headRef, int data) {
    struct Node* newNode = createNode(data);
    newNode->next = *headRef;
    *headRef = newNode;
}

// 在指定位置插入节点
void insertAfter(struct Node* prevNode, int data) {
    if (prevNode == NULL) {
        printf("前一个节点不能为空");
        return;
    }
    
    struct Node* newNode = createNode(data);
    newNode->next = prevNode->next;
    prevNode->next = newNode;
}

// 删除指定值的节点
void deleteNode(struct Node** headRef, int key) {
    struct Node* temp = *headRef;
    struct Node* prev = NULL;
    
    // 如果头节点就是要删除的节点
    if (temp != NULL && temp->data == key) {
        *headRef = temp->next;
        free(temp);
        return;
    }
    
    // 寻找要删除的节点
    while (temp != NULL && temp->data != key) {
        prev = temp;
        temp = temp->next;
    }
    
    // 如果没有找到要删除的节点
    if (temp == NULL) {
        return;
    }
    
    // 断开要删除的节点
    prev->next = temp->next;
    free(temp);
}

// 打印链表
void printList(struct Node* node) {
    while (node != NULL) {
        printf("%d -> ", node->data);
        node = node->next;
    }
    printf("NULL\\n");
}

// 释放链表内存
void freeList(struct Node** headRef) {
    struct Node* current = *headRef;
    struct Node* next;
    
    while (current != NULL) {
        next = current->next;
        free(current);
        current = next;
    }
    
    *headRef = NULL;
}

// 主函数
int main() {
    struct Node* head = NULL;
    
    // 构建链表
    append(&head, 6);
    prepend(&head, 7);
    prepend(&head, 1);
    append(&head, 4);
    insertAfter(head->next, 8);
    
    printf("创建的链表: ");
    printList(head);
    
    // 删除节点
    deleteNode(&head, 8);
    printf("删除8后的链表: ");
    printList(head);
    
    // 释放链表
    freeList(&head);
    
    return 0;
}`
    },
    
    'binaryTree': {
        'c': `#include <stdio.h>
#include <stdlib.h>

// 定义二叉树节点结构体
struct Node {
    int data;
    struct Node* left;
    struct Node* right;
};

// 创建新节点
struct Node* createNode(int data) {
    struct Node* newNode = (struct Node*)malloc(sizeof(struct Node));
    if (newNode == NULL) {
        printf("内存分配失败");
        exit(1);
    }
    newNode->data = data;
    newNode->left = NULL;
    newNode->right = NULL;
    return newNode;
}

// 插入节点到二叉搜索树
struct Node* insert(struct Node* root, int data) {
    // 如果树为空，返回新节点
    if (root == NULL) {
        return createNode(data);
    }
    
    // 递归向下遍历并插入
    if (data < root->data) {
        root->left = insert(root->left, data);
    } else if (data > root->data) {
        root->right = insert(root->right, data);
    }
    
    // 返回根节点指针
    return root;
}

// 中序遍历
void inorder(struct Node* root) {
    if (root != NULL) {
        inorder(root->left);
        printf("%d ", root->data);
        inorder(root->right);
    }
}

// 前序遍历
void preorder(struct Node* root) {
    if (root != NULL) {
        printf("%d ", root->data);
        preorder(root->left);
        preorder(root->right);
    }
}

// 后序遍历
void postorder(struct Node* root) {
    if (root != NULL) {
        postorder(root->left);
        postorder(root->right);
        printf("%d ", root->data);
    }
}

// 查找最小值节点
struct Node* findMin(struct Node* root) {
    struct Node* current = root;
    
    // 一直向左遍历找到最小值
    while (current && current->left != NULL) {
        current = current->left;
    }
    
    return current;
}

// 删除节点
struct Node* deleteNode(struct Node* root, int key) {
    // 基本情况：树为空
    if (root == NULL) return root;
    
    // 如果要删除的键小于根节点的键，则在左子树中
    if (key < root->data) {
        root->left = deleteNode(root->left, key);
    }
    // 如果要删除的键大于根节点的键，则在右子树中
    else if (key > root->data) {
        root->right = deleteNode(root->right, key);
    }
    // 找到要删除的节点
    else {
        // 情况1：叶子节点（没有子节点）
        if (root->left == NULL && root->right == NULL) {
            free(root);
            return NULL;
        }
        // 情况2：只有一个子节点
        else if (root->left == NULL) {
            struct Node* temp = root->right;
            free(root);
            return temp;
        }
        else if (root->right == NULL) {
            struct Node* temp = root->left;
            free(root);
            return temp;
        }
        // 情况3：有两个子节点
        struct Node* temp = findMin(root->right);
        root->data = temp->data;
        root->right = deleteNode(root->right, temp->data);
    }
    return root;
}

// 释放二叉树内存
void freeTree(struct Node* root) {
    if (root != NULL) {
        freeTree(root->left);
        freeTree(root->right);
        free(root);
    }
}

// 主函数
int main() {
    struct Node* root = NULL;
    
    // 插入节点构建二叉搜索树
    root = insert(root, 50);
    insert(root, 30);
    insert(root, 20);
    insert(root, 40);
    insert(root, 70);
    insert(root, 60);
    insert(root, 80);
    
    printf("中序遍历: ");
    inorder(root);
    printf("\\n");
    
    printf("前序遍历: ");
    preorder(root);
    printf("\\n");
    
    printf("后序遍历: ");
    postorder(root);
    printf("\\n");
    
    // 删除节点
    root = deleteNode(root, 20);
    printf("删除20后的中序遍历: ");
    inorder(root);
    printf("\\n");
    
    // 释放树内存
    freeTree(root);
    
    return 0;
}`
    },
    
    'heapSort': {
        'c': `#include <stdio.h>

// 交换两个元素
void swap(int *a, int *b) {
    int temp = *a;
    *a = *b;
    *b = temp;
}

// 堆化过程 - 将以root为根的子树转换为最大堆
// n为堆大小，i为根节点索引
void heapify(int arr[], int n, int i) {
    // 初始化最大值为根节点
    int largest = i;
    // 左子节点
    int left = 2 * i + 1;
    // 右子节点
    int right = 2 * i + 2;
    
    // 如果左子节点大于根节点
    if (left < n && arr[left] > arr[largest])
        largest = left;
    
    // 如果右子节点大于当前最大值
    if (right < n && arr[right] > arr[largest])
        largest = right;
    
    // 如果最大值不是根节点
    if (largest != i) {
        // 交换根节点和最大值
        swap(&arr[i], &arr[largest]);
        
        // 递归地堆化受影响的子树
        heapify(arr, n, largest);
    }
}

// 堆排序主函数
void heapSort(int arr[], int n) {
    // 构建最大堆
    // 从最后一个非叶子节点开始，自底向上构建最大堆
    for (int i = n / 2 - 1; i >= 0; i--)
        heapify(arr, n, i);
    
    // 逐个从堆中提取元素
    for (int i = n - 1; i > 0; i--) {
        // 将当前根节点（最大值）移到末尾
        swap(&arr[0], &arr[i]);
        
        // 对剩余堆进行堆化
        heapify(arr, i, 0);
    }
}

// 打印数组函数
void printArray(int arr[], int n) {
    for (int i = 0; i < n; i++)
        printf("%d ", arr[i]);
    printf("\\n");
}

// 主函数演示堆排序
int main() {
    int arr[] = {12, 11, 13, 5, 6, 7};
    int n = sizeof(arr) / sizeof(arr[0]);
    
    printf("原始数组: \\n");
    printArray(arr, n);
    
    heapSort(arr, n);
    
    printf("排序后数组: \\n");
    printArray(arr, n);
    
    return 0;
}`
    },
    
    'mergeSort': {
        'c': `#include <stdio.h>
#include <stdlib.h>

// 合并两个已排序的子数组
void merge(int arr[], int l, int m, int r) {
    int i, j, k;
    int n1 = m - l + 1;
    int n2 = r - m;
    
    // 创建临时数组
    int L[n1], R[n2];
    
    // 复制数据到临时数组 L[] 和 R[]
    for (i = 0; i < n1; i++)
        L[i] = arr[l + i];
    for (j = 0; j < n2; j++)
        R[j] = arr[m + 1 + j];
    
    // 合并临时数组回到 arr[l..r]
    i = 0; // L[] 的初始索引
    j = 0; // R[] 的初始索引
    k = l; // 合并后数组的初始索引
    
    while (i < n1 && j < n2) {
        if (L[i] <= R[j]) {
            arr[k] = L[i];
            i++;
        } else {
            arr[k] = R[j];
            j++;
        }
        k++;
    }
    
    // 复制 L[] 的剩余元素
    while (i < n1) {
        arr[k] = L[i];
        i++;
        k++;
    }
    
    // 复制 R[] 的剩余元素
    while (j < n2) {
        arr[k] = R[j];
        j++;
        k++;
    }
}

// 归并排序主函数
void mergeSort(int arr[], int l, int r) {
    if (l < r) {
        // 和 (l+r)/2 相同，但避免溢出
        int m = l + (r - l) / 2;
        
        // 排序前半部分
        mergeSort(arr, l, m);
        // 排序后半部分
        mergeSort(arr, m + 1, r);
        
        // 合并已排序的两半
        merge(arr, l, m, r);
    }
}

// 打印数组函数
void printArray(int A[], int size) {
    int i;
    for (i = 0; i < size; i++)
        printf("%d ", A[i]);
    printf("\\n");
}

// 主函数演示归并排序
int main() {
    int arr[] = {15, 11, 13, 5, 16, 32};
    int arr_size = sizeof(arr) / sizeof(arr[0]);
    
    printf("原始数组: \\n");
    printArray(arr, arr_size);
    
    mergeSort(arr, 0, arr_size - 1);
    
    printf("排序后数组: \\n");
    printArray(arr, arr_size);
    
    return 0;
}`
    }
};

// 添加基数排序的示例代码
window.algorithmCodeExamples['radixSortExample'] = {
    'c': `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// 查找数组中的最大值
int getMax(int arr[], int n) {
    int max = arr[0];
    for (int i = 1; i < n; i++) {
        if (arr[i] > max) {
            max = arr[i];
        }
    }
    return max;
}

// 使用计数排序对数组按照指定位数排序
void countSort(int arr[], int n, int exp) {
    int output[n]; // 输出数组
    int count[10] = {0}; // 计数数组
    
    // 统计当前位上各个数字出现的次数
    for (int i = 0; i < n; i++) {
        count[(arr[i] / exp) % 10]++;
    }
    
    // 累加计数，确定每个数字的位置
    for (int i = 1; i < 10; i++) {
        count[i] += count[i - 1];
    }
    
    // 从后向前遍历，确保排序的稳定性
    for (int i = n - 1; i >= 0; i--) {
        int digit = (arr[i] / exp) % 10;
        output[count[digit] - 1] = arr[i];
        count[digit]--;
    }
    
    // 将排序结果复制回原数组
    for (int i = 0; i < n; i++) {
        arr[i] = output[i];
    }
}

// 基数排序主函数
void radixSort(int arr[], int n) {
    // 找到数组中的最大值
    int max = getMax(arr, n);
    
    // 从最低位开始，对每一位进行计数排序
    for (int exp = 1; max / exp > 0; exp *= 10) {
        countSort(arr, n, exp);
        
        // 打印每一位排序后的数组状态
        printf("按 %d 位排序后: ", exp);
        for (int i = 0; i < n; i++) {
            printf("%d ", arr[i]);
        }
        printf("\\n");
    }
}

// 打印数组函数
void printArray(int arr[], int size) {
    for (int i = 0; i < size; i++) {
        printf("%d ", arr[i]);
    }
    printf("\\n");
}

// 主函数演示基数排序
int main() {
    // 创建测试数组
    int arr[] = {170, 45, 75, 90, 82, 24, 2, 66};
    int n = sizeof(arr) / sizeof(arr[0]);
    
    printf("原始数组: \\n");
    printArray(arr, n);
    
    // 执行基数排序
    printf("\\n开始基数排序...\\n\\n");
    radixSort(arr, n);
    
    // 打印最终排序结果
    printf("\\n排序结果: ");
    printArray(arr, n);
    
    return 0;
}`
};

// 保留原来的radixSort键，但将其指向新的radixSortExample
window.algorithmCodeExamples['radixSort'] = window.algorithmCodeExamples['radixSortExample'];

// 桶排序代码示例
window.algorithmCodeExamples.bucketSort = `#include <stdio.h>
#include <stdlib.h>
#include <math.h>

// 链表节点
struct Node {
    int data;
    struct Node* next;
};

// 创建新节点
struct Node* createNode(int data) {
    struct Node* newNode = (struct Node*)malloc(sizeof(struct Node));
    if (newNode == NULL) {
        printf("内存分配失败\\n");
        exit(1);
    }
    newNode->data = data;
    newNode->next = NULL;
    return newNode;
}

// 插入节点（使用插入排序）
void insertSorted(struct Node** head, int data) {
    // 创建新节点
    struct Node* newNode = createNode(data);
    struct Node* current;
    
    // 如果链表为空或第一个节点值大于新值，则插入到链表头部
    if (*head == NULL || (*head)->data >= data) {
        newNode->next = *head;
        *head = newNode;
        return;
    }
    
    // 否则，找到合适的位置插入
    current = *head;
    while (current->next != NULL && current->next->data < data) {
        current = current->next;
    }
    
    newNode->next = current->next;
    current->next = newNode;
}

// 打印桶内容（用于可视化）
void printBuckets(struct Node* buckets[], int bucketSize, int bucketCount) {
    printf("\\n桶的内容:\\n");
    for (int i = 0; i < bucketCount; i++) {
        printf("桶 %d [%d-%d]: ", i + 1, (int)(i * bucketSize), (int)((i + 1) * bucketSize - 1));
        struct Node* current = buckets[i];
        while (current) {
            printf("%d -> ", current->data);
            current = current->next;
        }
        printf("NULL\\n");
    }
    printf("\\n");
}

// 桶排序主函数
void bucketSort(int arr[], int n) {
    // 找到数组的最大值和最小值
    int maxValue = arr[0];
    int minValue = arr[0];
    for (int i = 1; i < n; i++) {
        if (arr[i] > maxValue) maxValue = arr[i];
        if (arr[i] < minValue) minValue = arr[i];
    }
    
    // 计算范围
    int range = maxValue - minValue + 1;
    
    // 确定桶的数量（这里使用 sqrt(n) 个桶）
    int bucketCount = (int)sqrt(n) + 1;
    // 计算每个桶的范围大小
    double bucketSize = (double)range / bucketCount;
    
    printf("总共 %d 个元素, 范围: %d-%d, 使用 %d 个桶, 每个桶范围大小约为 %.2f\\n\\n", 
           n, minValue, maxValue, bucketCount, bucketSize);
    
    // 创建桶（使用链表实现）
    struct Node** buckets = (struct Node**)malloc(bucketCount * sizeof(struct Node*));
    for (int i = 0; i < bucketCount; i++) {
        buckets[i] = NULL;
    }
    
    // 将元素分配到桶中
    printf("分配元素到桶:\\n");
    for (int i = 0; i < n; i++) {
        // 计算桶的索引
        int bucketIndex = (int)((arr[i] - minValue) / bucketSize);
        // 确保索引不会越界
        if (bucketIndex >= bucketCount) bucketIndex = bucketCount - 1;
        
        printf("元素 %d 放入桶 %d [%d-%d]\\n", 
               arr[i], bucketIndex + 1, 
               (int)(minValue + bucketIndex * bucketSize), 
               (int)(minValue + (bucketIndex + 1) * bucketSize - 1));
               
        // 将元素插入到对应桶的合适位置（保持有序）
        insertSorted(&buckets[bucketIndex], arr[i]);
    }
    
    // 打印桶的内容（用于可视化）
    printBuckets(buckets, bucketSize, bucketCount);
    
    // 从桶中收集元素，完成排序
    printf("从桶中收集元素:\\n");
    int index = 0;
    for (int i = 0; i < bucketCount; i++) {
        struct Node* current = buckets[i];
        while (current != NULL) {
            printf("从桶 %d 取出元素 %d 放回原数组位置 %d\\n", 
                   i + 1, current->data, index + 1);
            arr[index++] = current->data;
            struct Node* temp = current;
            current = current->next;
            free(temp); // 释放节点内存
        }
        buckets[i] = NULL; // 清空桶
    }
    
    free(buckets); // 释放桶数组
}

// 打印数组函数
void printArray(int arr[], int size) {
    for (int i = 0; i < size; i++) {
        printf("%d ", arr[i]);
    }
    printf("\\n");
}

// 主函数演示桶排序
int main() {
    // 创建测试数组
    int arr[] = {38, 27, 43, 3, 9, 82, 10};
    int n = sizeof(arr) / sizeof(arr[0]);
    
    printf("原始数组: ");
    printArray(arr, n);
    
    // 执行桶排序
    printf("\\n开始桶排序...\\n");
    bucketSort(arr, n);
    
    // 打印最终排序结果
    printf("\\n排序结果: ");
    printArray(arr, n);
    
    return 0;
}`;

// 添加计数排序的代码示例
window.algorithmCodeExamples.countingSort = `#include <stdio.h>
#include <stdlib.h>

// 计数排序算法实现
void countingSort(int arr[], int n) {
    if (n <= 1) return; // 数组为空或只有一个元素，无需排序
    
    // 找出数组中的最大值和最小值
    int max = arr[0], min = arr[0];
    for (int i = 1; i < n; i++) {
        if (arr[i] > max) max = arr[i];
        if (arr[i] < min) min = arr[i];
    }
    
    // 计算计数数组的大小
    int range = max - min + 1;
    printf("数组范围为 [%d, %d]，创建大小为 %d 的计数数组\\n", min, max, range);
    
    // 创建并初始化计数数组
    int* count = (int*)calloc(range, sizeof(int));
    if (count == NULL) {
        printf("内存分配失败\\n");
        return;
    }
    
    // 计数每个元素出现的次数
    printf("\\n统计每个元素出现的次数:\\n");
    for (int i = 0; i < n; i++) {
        int index = arr[i] - min;
        count[index]++;
        printf("元素 %d 的计数增加到 %d\\n", arr[i], count[index]);
    }
    
    // 累加计数数组
    printf("\\n累加计数数组:\\n");
    for (int i = 1; i < range; i++) {
        count[i] += count[i - 1];
        printf("位置 %d 的累计计数为 %d\\n", i, count[i]);
    }
    
    // 创建结果数组
    int* output = (int*)malloc(n * sizeof(int));
    if (output == NULL) {
        free(count);
        printf("内存分配失败\\n");
        return;
    }
    
    // 从后向前遍历原数组，根据计数数组放置元素到结果数组中
    printf("\\n根据计数数组放置元素:\\n");
    for (int i = n - 1; i >= 0; i--) {
        int value = arr[i];
        int countIndex = value - min;
        int outputIndex = count[countIndex] - 1;
        
        output[outputIndex] = value;
        count[countIndex]--;
        
        printf("元素 %d 放置到结果数组位置 %d\\n", value, outputIndex);
    }
    
    // 将结果复制回原数组
    printf("\\n最终排序结果:\\n");
    for (int i = 0; i < n; i++) {
        arr[i] = output[i];
        printf("%d ", arr[i]);
    }
    printf("\\n");
    
    // 释放内存
    free(count);
    free(output);
}

// 打印数组
void printArray(int arr[], int size) {
    for (int i = 0; i < size; i++) {
        printf("%d ", arr[i]);
    }
    printf("\\n");
}

int main() {
    int arr[] = {38, 27, 43, 3, 9, 82, 10};
    int n = sizeof(arr) / sizeof(arr[0]);
    
    printf("原始数组: ");
    printArray(arr, n);
    
    countingSort(arr, n);
    
    printf("排序后数组: ");
    printArray(arr, n);
    
    return 0;
}
`;

// 添加栈的示例代码
window.algorithmCodeExamples['stack'] = {
    'c': `#include <stdio.h>
#include <stdlib.h>

#define MAX_SIZE 100

// 栈结构体定义
typedef struct {
    int items[MAX_SIZE];
    int top;
} Stack;

// 初始化栈
void initStack(Stack* s) {
    s->top = -1;
}

// 检查栈是否为空
int isEmpty(Stack* s) {
    return s->top == -1;
}

// 检查栈是否已满
int isFull(Stack* s) {
    return s->top == MAX_SIZE - 1;
}

// 入栈操作
void push(Stack* s, int value) {
    if (isFull(s)) {
        printf("错误：栈已满\\n");
        return;
    }
    s->items[++(s->top)] = value;
    printf("入栈: %d\\n", value);
}

// 出栈操作
int pop(Stack* s) {
    if (isEmpty(s)) {
        printf("错误：栈为空\\n");
        return -1;
    }
    int value = s->items[s->top];
    s->top--;
    printf("出栈: %d\\n", value);
    return value;
}

// 查看栈顶元素
int peek(Stack* s) {
    if (isEmpty(s)) {
        printf("错误：栈为空\\n");
        return -1;
    }
    return s->items[s->top];
}

// 打印栈的内容
void printStack(Stack* s) {
    if (isEmpty(s)) {
        printf("栈为空\\n");
        return;
    }
    
    printf("栈内容 (从顶到底): ");
    for (int i = s->top; i >= 0; i--) {
        printf("%d ", s->items[i]);
    }
    printf("\\n");
}

// 主函数演示栈的操作
int main() {
    Stack stack;
    initStack(&stack);
    
    // 演示入栈操作
    printf("\\n=== 入栈操作 ===\\n");
    push(&stack, 10);
    push(&stack, 20);
    push(&stack, 30);
    push(&stack, 40);
    
    // 打印当前栈的内容
    printf("\\n当前栈的状态:\\n");
    printStack(&stack);
    
    // 演示出栈操作
    printf("\\n=== 出栈操作 ===\\n");
    pop(&stack);
    pop(&stack);
    
    // 再次打印栈的内容
    printf("\\n出栈后的栈状态:\\n");
    printStack(&stack);
    
    // 演示查看栈顶元素
    printf("\\n=== 查看栈顶元素 ===\\n");
    int topElement = peek(&stack);
    printf("栈顶元素: %d\\n", topElement);
    
    // 演示栈的边界情况
    printf("\\n=== 测试边界情况 ===\\n");
    // 尝试从几乎空的栈中弹出所有元素
    pop(&stack);
    pop(&stack);
    // 尝试从空栈中弹出元素
    pop(&stack);
    
    return 0;
}`
};
