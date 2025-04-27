# 桶排序 (Bucket Sort)

桶排序是一种分布式排序算法，它将元素分到有限数量的桶里，然后对每个桶再单独排序（可以使用其他排序算法或是递归使用桶排序），最后将各个桶中的元素有序地合并起来。

## 算法原理

桶排序的基本思想是：

1. 确定待排序数组的范围（最大值和最小值）
2. 创建指定数量的桶（通常为n个桶，n为数组大小）
3. 将数组元素分配到不同的桶中
4. 对每个非空桶进行排序（可使用插入排序等算法）
5. 按顺序将桶中的元素合并，得到排序后的数组

## 适用场景

桶排序在以下情况下特别有效：

- 输入数据均匀分布在一个范围内
- 数据可以很容易地划分成为若干个子范围
- 需要排序的元素数量较大

## 算法复杂度

- 平均时间复杂度：O(n+k)，其中n是数组大小，k是桶的数量
- 最坏时间复杂度：O(n²)，当所有元素都被分到同一个桶中
- 空间复杂度：O(n+k)
- 稳定性：稳定（取决于对桶内排序使用的算法）

<img src="/AnimatedArea/sorting/BucketSort/bucketsort.png" alt="桶排序示意图" width="500px" />

## 算法实现

桶排序的关键步骤是：

```javascript
function bucketSort(arr, bucketSize = 5) {
    if (arr.length <= 1) return arr;
    
    // 找到数组中的最大值和最小值
    let min = Math.min(...arr);
    let max = Math.max(...arr);
    
    // 计算桶的数量
    const bucketCount = Math.floor((max - min) / bucketSize) + 1;
    const buckets = Array.from({ length: bucketCount }, () => []);
    
    // 将数组元素分配到桶中
    for (let i = 0; i < arr.length; i++) {
        const bucketIndex = Math.floor((arr[i] - min) / bucketSize);
        buckets[bucketIndex].push(arr[i]);
    }
    
    // 对每个桶进行排序
    const result = [];
    for (let i = 0; i < buckets.length; i++) {
        // 使用插入排序对桶内元素排序
        insertionSort(buckets[i]);
        // 将排序后的桶合并到结果数组
        result.push(...buckets[i]);
    }
    
    return result;
}

// 用于桶内排序的插入排序
function insertionSort(arr) {
    for (let i = 1; i < arr.length; i++) {
        const current = arr[i];
        let j = i - 1;
        while (j >= 0 && arr[j] > current) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = current;
    }
    return arr;
}
```

## 桶排序的优缺点

### 优点
- 在元素分布均匀的情况下，效率很高
- 可以并行处理不同的桶
- 适合外部排序（数据量大，无法一次性载入内存）

### 缺点
- 对数据分布有较强的依赖性
- 如果数据分布不均匀，可能导致桶之间的数据分布极不平衡
- 额外的空间开销较大
- 桶的数量和大小需要合理选择，否则会影响排序效率

## 桶排序与其他排序算法的比较

桶排序与计数排序和基数排序都属于分布式排序算法，它们都不基于比较操作：

- 相比计数排序，桶排序更适合于范围较大的数据
- A相比基数排序，桶排序可以处理浮点数
- 当数据分布均匀时，桶排序可以达到线性时间复杂度，优于比较排序算法

桶排序适合用于大数据量、外部排序的场景，特别是当数据分布均匀时，它的效率非常高。
