/**
 * 桶排序算法的可视化步骤生成
 * 包含桶排序算法的实现和可视化步骤生成函数
 */

/**
 * 生成桶排序的可视化步骤
 * @param {Array<number>} arr 待排序数组
 * @returns {Array<Object>} 可视化步骤数组
 */
function generateBucketSortSteps(arr) {
  const steps = [];
  const n = arr.length;
  
  // 空数组检查
  if (!arr || n === 0) {
    steps.push({
      type: 'sorting',
      array: [],
      currentIndex: -1,
      compareIndex: -1,
      description: '数组为空，无需排序',
    });
    return steps;
  }
  
  const workingArr = [...arr];
  
  // 内联定义getPositionDescription
  const getPositionDescription = function(index) {
    const positions = ['第一个', '第二个', '第三个', '第四个', '第五个', '第六个', '第七个', '第八个', '第九个', '第十个'];
    return positions[index] || `位置${index + 1}`;
  };
  
  // 找出数组中的最大值和最小值
  let maxVal = Math.max(...workingArr);
  let minVal = Math.min(...workingArr);
  
  steps.push({
    type: 'sorting',
    array: [...workingArr],
    currentIndex: -1,
    compareIndex: -1,
    description: `找到最小值 ${minVal} 和最大值 ${maxVal}`,
    custom: {
      minIndex: workingArr.indexOf(minVal),
      maxIndex: workingArr.indexOf(maxVal)
    }
  });
  
  // 设置桶的数量，默认使用元素个数
  const bucketCount = Math.min(n, 10);  // 最多10个桶，便于可视化
  
  steps.push({
    type: 'sorting',
    array: [...workingArr],
    currentIndex: -1,
    compareIndex: -1,
    description: `创建 ${bucketCount} 个桶`,
    custom: {
      bucketCount: bucketCount
    }
  });
  
  // 计算每个桶的范围
  const range = (maxVal - minVal) / bucketCount;
  
  // 创建桶
  const buckets = Array.from({length: bucketCount}, () => []);
  
  // 将元素分配到桶中
  for (let i = 0; i < n; i++) {
    // 确定元素应该放在哪个桶中
    let bucketIndex = Math.min(Math.floor((workingArr[i] - minVal) / range), bucketCount - 1);
    
    steps.push({
      type: 'sorting',
      array: [...workingArr],
      currentIndex: i,
      compareIndex: -1,
      description: `元素 ${workingArr[i]} 将放入桶 ${bucketIndex + 1}`,
      custom: {
        buckets: JSON.parse(JSON.stringify(buckets)),
        currentBucket: bucketIndex
      }
    });
    
    // 将元素放入相应的桶中
    buckets[bucketIndex].push(workingArr[i]);
    
    steps.push({
      type: 'sorting',
      array: [...workingArr],
      currentIndex: i,
      compareIndex: -1,
      description: `将元素 ${workingArr[i]} 放入桶 ${bucketIndex + 1}`,
      custom: {
        buckets: JSON.parse(JSON.stringify(buckets)),
        currentBucket: bucketIndex,
        lastAddedToBucket: workingArr[i]
      }
    });
  }
  
  // 显示所有桶的当前状态
  steps.push({
    type: 'sorting',
    array: [...workingArr],
    currentIndex: -1,
    compareIndex: -1,
    description: `所有元素已分配到桶中，开始对每个桶进行排序`,
    custom: {
      buckets: JSON.parse(JSON.stringify(buckets)),
      showAllBuckets: true
    }
  });
  
  // 对每个桶进行排序
  for (let i = 0; i < bucketCount; i++) {
    if (buckets[i].length <= 1) {
      // 桶中只有0或1个元素，无需排序
      if (buckets[i].length === 1) {
        steps.push({
          type: 'sorting',
          array: [...workingArr],
          currentIndex: -1,
          compareIndex: -1,
          description: `桶 ${i + 1} 中只有一个元素 ${buckets[i][0]}，无需排序`,
          custom: {
            buckets: JSON.parse(JSON.stringify(buckets)),
            currentBucket: i
          }
        });
      } else {
        steps.push({
          type: 'sorting',
          array: [...workingArr],
          currentIndex: -1,
          compareIndex: -1,
          description: `桶 ${i + 1} 为空，跳过`,
          custom: {
            buckets: JSON.parse(JSON.stringify(buckets)),
            currentBucket: i
          }
        });
      }
      continue;
    }
    
    steps.push({
      type: 'sorting',
      array: [...workingArr],
      currentIndex: -1,
      compareIndex: -1,
      description: `对桶 ${i + 1} 进行排序`,
      custom: {
        buckets: JSON.parse(JSON.stringify(buckets)),
        currentBucket: i,
        sortingBucket: true
      }
    });
    
    // 使用插入排序对桶进行排序
    for (let j = 1; j < buckets[i].length; j++) {
      let key = buckets[i][j];
      let k = j - 1;
      
      steps.push({
        type: 'sorting',
        array: [...workingArr],
        currentIndex: -1,
        compareIndex: -1,
        description: `在桶 ${i + 1} 中，选择元素 ${key} 进行插入排序`,
        custom: {
          buckets: JSON.parse(JSON.stringify(buckets)),
          currentBucket: i,
          bucketCurrentIndex: j,
          bucketCompareIndex: k
        }
      });
      
      while (k >= 0 && buckets[i][k] > key) {
        steps.push({
          type: 'sorting',
          array: [...workingArr],
          currentIndex: -1,
          compareIndex: -1,
          description: `比较元素 ${buckets[i][k]} 和 ${key}`,
          custom: {
            buckets: JSON.parse(JSON.stringify(buckets)),
            currentBucket: i,
            bucketCurrentIndex: j,
            bucketCompareIndex: k
          }
        });
        
        buckets[i][k + 1] = buckets[i][k];
        k--;
        
        steps.push({
          type: 'sorting',
          array: [...workingArr],
          currentIndex: -1,
          compareIndex: -1,
          description: `元素后移`,
          custom: {
            buckets: JSON.parse(JSON.stringify(buckets)),
            currentBucket: i,
            bucketCurrentIndex: k + 1
          }
        });
      }
      
      buckets[i][k + 1] = key;
      
      steps.push({
        type: 'sorting',
        array: [...workingArr],
        currentIndex: -1,
        compareIndex: -1,
        description: `将元素 ${key} 插入到桶 ${i + 1} 的正确位置`,
        custom: {
          buckets: JSON.parse(JSON.stringify(buckets)),
          currentBucket: i,
          bucketCurrentIndex: k + 1
        }
      });
    }
    
    // 显示当前桶排序完成
    steps.push({
      type: 'sorting',
      array: [...workingArr],
      currentIndex: -1,
      compareIndex: -1,
      description: `桶 ${i + 1} 内部排序完成: [${buckets[i].join(', ')}]`
    });
  }
  
  // 合并所有桶，形成排序后的数组
  let sortedArr = [];
  for (let i = 0; i < bucketCount; i++) {
    sortedArr = sortedArr.concat(buckets[i]);
  }
  
  // 用排序后的数组更新原数组，并在视觉上展示结果
  for (let i = 0; i < sortedArr.length; i++) {
    workingArr[i] = sortedArr[i];
    
    steps.push({
      type: 'sorting',
      array: [...workingArr],
      currentIndex: i,
      compareIndex: -1,
      description: `将排序后的元素 ${sortedArr[i]} 放回原数组的位置 ${i}`,
      sorted: Array.from({length: i+1}, (_, idx) => idx)
    });
  }

  // 添加最终步骤
  steps.push({
    type: 'sorting',
    array: [...workingArr],
    currentIndex: -1,
    compareIndex: -1,
    description: '桶排序完成',
    sorted: Array.from({length: workingArr.length}, (_, i) => i)
  });

  return steps;
}

// 为浏览器环境提供全局访问
if (typeof window !== 'undefined') {
  window.VisualizationSteps = window.VisualizationSteps || {};
  window.VisualizationSteps.generateBucketSortSteps = generateBucketSortSteps;
}

// ES6 模块导出
module.exports = {
  generateBucketSortSteps
};