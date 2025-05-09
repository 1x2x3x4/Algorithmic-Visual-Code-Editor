# 计数排序 (Counting Sort)

计数排序是一种非比较排序算法，它的时间复杂度为O(n+k)，其中n是数组大小，k是数据范围（最大值与最小值的差）。这使得它在特定条件下比传统的O(n log n)排序算法更高效。

## 算法原理

计数排序的基本思想是：

1. 找出待排序数组中的最大值和最小值
2. 创建一个计数数组，大小为`max-min+1`
3. 遍历原数组，统计每个元素出现的次数
4. 修改计数数组，使其存储元素在排序后数组中的实际位置
5. 创建输出数组，根据计数数组将元素放到正确的位置
6. 将排序后的数组复制回原数组

## 适用场景

计数排序在以下情况下特别有效：

- 待排序的数据范围相对较小
- 数据都是非负整数（或可以映射为非负整数）
- 需要一种稳定的排序算法

## 算法复杂度

- 时间复杂度：O(n+k)，其中n是数组大小，k是数据范围
- 空间复杂度：O(k)，用于存储计数数组
- 稳定性：稳定
<img src="/AnimatedArea/sorting/CountingSort/计数排序.png" alt="计数排序示意图" width="500px" />

## 算法实现

计数排序的关键步骤是：

```javascript
function countingSort(arr) {
    // 找到数组中的最大值和最小值
    let min = Math.min(...arr);
    let max = Math.max(...arr);
    
    // 创建计数数组
    const range = max - min + 1;
    const count = new Array(range).fill(0);
    
    // 统计每个元素出现的次数
    for (let i = 0; i < arr.length; i++) {
        count[arr[i] - min]++;
    }
    
    // 累加计数数组的值
    for (let i = 1; i < range; i++) {
        count[i] += count[i - 1];
    }
    
    // 创建输出数组
    const output = new Array(arr.length);
    
    // 从后向前遍历原数组，将元素放到正确的位置
    for (let i = arr.length - 1; i >= 0; i--) {
        const current = arr[i];
        const countIndex = current - min;
        const sortedIndex = count[countIndex] - 1;
        
        output[sortedIndex] = current;
        count[countIndex]--;
    }
    
    // 将排序后的数组复制回原数组
    for (let i = 0; i < arr.length; i++) {
        arr[i] = output[i];
    }
    
    return arr;
}
```

## 计数排序的优缺点

### 优点
- 对于特定数据范围的数据，排序速度非常快
- 是一种稳定的排序算法
- 时间复杂度为O(n+k)，可以优于O(n log n)的比较排序算法

### 缺点
- 只适用于非负整数或可以映射为非负整数的数据
- 当数据范围很大时，会浪费大量空间
- 不适用于浮点数等非整数数据 