/**
 * 基数排序算法的可视化步骤生成
 * 包含基数排序算法的实现和可视化步骤生成函数
 */

/**
 * 生成基数排序的可视化步骤
 * @param {Array<number>} arr 待排序数组
 * @returns {Array<Object>} 可视化步骤数组
 */
function generateRadixSortSteps(arr) {
  console.log("开始生成基数排序步骤，数组长度：", arr.length);
  const steps = [];
  const n = arr.length;
  const workingArr = [...arr];
  
  // 内联定义getPositionDescription
  const getPositionDescription = function(index) {
    const positions = ['第一个', '第二个', '第三个', '第四个', '第五个', '第六个', '第七个', '第八个', '第九个', '第十个'];
    return positions[index] || `位置${index + 1}`;
  };
  
  // 找到数组中的最大值，确定最大位数
  let max = Math.max(...workingArr);
  steps.push({
    type: 'sorting',
    array: [...workingArr],
    currentIndex: -1,
    compareIndex: -1,
    description: `找到最大值 ${max} 来确定排序的位数`,
    highlightRange: [],
    custom: {
      highlight: workingArr.indexOf(max)  // 高亮最大值
    }
  });
  
  // 确定最大位数
  let maxDigits = max.toString().length;
  steps.push({
    type: 'sorting',
    array: [...workingArr],
    currentIndex: -1,
    compareIndex: -1,
    description: `最大数字 ${max} 有 ${maxDigits} 位，需要进行 ${maxDigits} 轮排序`,
    highlightRange: [],
    custom: {
      highlight: workingArr.indexOf(max),  // 继续高亮最大值
      showDigits: true,                    // 显示数字的位数
      maxValue: max
    }
  });
  
  // 按照每一位进行排序 - 修复循环条件
  // 使用固定的最大位数迭代，而不是使用可能导致浮点精度问题的除法条件
  for (let exp = 0; exp < maxDigits; exp++) {
    let digitPlace = Math.pow(10, exp);
    
    console.log(`开始第 ${exp+1}/${maxDigits} 轮排序，digitPlace=${digitPlace}`);
    
    let digit = Math.floor(digitPlace / 10);
    let digitName = "";
    
    if (digit === 0) {
      digitName = "个位";
    } else if (digit === 1) {
      digitName = "十位";
    } else if (digit === 10) {
      digitName = "百位";
    } else if (digit === 100) {
      digitName = "千位";
    } else {
      digitName = `${digit}位`;
    }
    
    steps.push({
      type: 'sorting',
      array: [...workingArr],
      currentIndex: -1,
      compareIndex: -1,
      description: `开始按${digitName}进行排序`,
      custom: {
        digitPlace: digitPlace,
        showDigitPlace: true
      }
    });
    
    // 创建桶
    const buckets = Array.from({length: 10}, () => []);
    
    // 将元素放入对应的桶中
    for (let i = 0; i < n; i++) {
      const digit = Math.floor(workingArr[i] / digitPlace) % 10;
      buckets[digit].push(workingArr[i]);
      
      steps.push({
        type: 'sorting',
        array: [...workingArr],
        currentIndex: i,
        compareIndex: -1,
        description: `元素 ${workingArr[i]} 的${digitName}是 ${digit}，放入桶 ${digit}`,
        custom: {
          digitPlace: digitPlace,
          buckets: JSON.parse(JSON.stringify(buckets)),
          currentDigit: digit,
          showBuckets: true
        }
      });
    }
    
    // 展示当前的桶
    steps.push({
      type: 'sorting',
      array: [...workingArr],
      currentIndex: -1,
      compareIndex: -1,
      description: `所有元素已分配到桶中，准备收集`,
      custom: {
        digitPlace: digitPlace,
        buckets: JSON.parse(JSON.stringify(buckets)),
        showBuckets: true
      }
    });
    
    // 从桶中收集元素
    let index = 0;
    for (let j = 0; j < 10; j++) {
      for (let k = 0; k < buckets[j].length; k++) {
        steps.push({
          type: 'sorting',
          array: [...workingArr],
          currentIndex: -1,
          compareIndex: -1,
          description: `从桶 ${j} 取出元素 ${buckets[j][k]}`,
          custom: {
            digitPlace: digitPlace,
            buckets: JSON.parse(JSON.stringify(buckets)),
            currentBucket: j,
            currentBucketItem: k,
            showBuckets: true
          }
        });
        
        workingArr[index] = buckets[j][k];
        
        steps.push({
          type: 'sorting',
          array: [...workingArr],
          currentIndex: index,
          compareIndex: -1,
          description: `将元素 ${buckets[j][k]} 放回原数组位置 ${index}`,
          custom: {
            digitPlace: digitPlace,
            buckets: JSON.parse(JSON.stringify(buckets)),
            currentBucket: j,
            showBuckets: true
          }
        });
        
        index++;
      }
    }
    
    steps.push({
      type: 'sorting',
      array: [...workingArr],
      currentIndex: -1,
      compareIndex: -1,
      description: `完成按${digitName}的排序`,
      custom: {
        digitPlace: digitPlace
      }
    });
  }
  
  steps.push({
    type: 'sorting',
    array: [...workingArr],
    currentIndex: -1,
    compareIndex: -1,
    description: '排序完成',
    sortedIndices: Array.from({length: n}, (_, i) => i)
  });
  
  console.log(`基数排序生成完成，共 ${steps.length} 个步骤`);
  return steps;
}

// 为浏览器环境提供全局访问
if (typeof window !== 'undefined') {
  window.VisualizationSteps = window.VisualizationSteps || {};
  window.VisualizationSteps.generateRadixSortSteps = generateRadixSortSteps;
}

// ES6 模块导出
module.exports = {
  generateRadixSortSteps
}; 