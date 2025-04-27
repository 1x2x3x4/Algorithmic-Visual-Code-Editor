/**
 * 计数排序算法的可视化步骤生成
 * 包含计数排序算法的实现和可视化步骤生成函数
 */

/**
 * 生成计数排序的可视化步骤
 * @param {Array<number>} arr 待排序数组
 * @returns {Array<Object>} 可视化步骤数组
 */
function generateCountingSortSteps(arr) {
  const steps = [];
  if (!arr || arr.length <= 1) {
    return [{ 
      type: 'sorting', 
      array: [...(arr || [])], 
      description: '数组为空或仅有一个元素，无需排序',
      currentIndex: -1,
      compareIndex: -1,
      countingArray: [],
      outputArray: [],
      phase: 'init'
    }];
  }
  
  const n = arr.length;
  const workingArr = [...arr];
  
  // 内联定义getPositionDescription而不是依赖全局对象
  const getPositionDescription = function(index) {
    const positions = ['第一个', '第二个', '第三个', '第四个', '第五个', '第六个', '第七个', '第八个', '第九个', '第十个'];
    return positions[index] || `位置${index + 1}`;
  };
  
  // 找到数组中的最大值和最小值
  let min = Math.min(...workingArr);
  let max = Math.max(...workingArr);
  
  // 添加初始状态步骤
  steps.push({
    type: 'sorting',
    array: [...workingArr],
    description: `开始计数排序，找到最小值 ${min} 和最大值 ${max}`,
    currentIndex: -1,
    compareIndex: -1,
    countingArray: [],
    outputArray: [],
    phase: 'init'
  });
  
  // 创建计数数组
  const range = max - min + 1;
  const countingArray = new Array(range).fill(0);
  
  steps.push({
    type: 'sorting',
    array: [...workingArr],
    description: `创建长度为 ${range} 的计数数组，范围从 ${min} 到 ${max}`,
    currentIndex: -1,
    compareIndex: -1,
    countingArray: [...countingArray],
    outputArray: [],
    phase: 'create_counting'
  });
  
  // 计数阶段
  for (let i = 0; i < n; i++) {
    const value = workingArr[i];
    const countIndex = value - min;
    countingArray[countIndex]++;
    
    steps.push({
      type: 'sorting',
      array: [...workingArr],
      description: `统计元素 ${value} 出现次数：${countingArray[countIndex]}`,
      currentIndex: i,
      compareIndex: -1,
      countingArray: [...countingArray],
      outputArray: [],
      phase: 'counting',
      highlightCountingIndex: countIndex
    });
  }
  
  // 计数数组转为累积计数数组
  for (let i = 1; i < range; i++) {
    countingArray[i] += countingArray[i - 1];
    
    steps.push({
      type: 'sorting',
      array: [...workingArr],
      description: `将计数数组转换为累积和：索引 ${i} 的值变为 ${countingArray[i]}`,
      currentIndex: -1,
      compareIndex: -1,
      countingArray: [...countingArray],
      outputArray: [],
      phase: 'accumulate',
      highlightCountingIndex: i
    });
  }
  
  // 创建输出数组
  const outputArray = new Array(n);
  
  // 从后向前填充输出数组
  for (let i = n - 1; i >= 0; i--) {
    const value = workingArr[i];
    const countIndex = value - min;
    const position = countingArray[countIndex] - 1;
    outputArray[position] = value;
    countingArray[countIndex]--;
    
    steps.push({
      type: 'sorting',
      array: [...workingArr],
      description: `放置元素 ${value} 到输出数组位置 ${position}`,
      currentIndex: i,
      compareIndex: -1,
      countingArray: [...countingArray],
      outputArray: [...outputArray],
      phase: 'placement',
      highlightCountingIndex: countIndex,
      highlightOutputIndex: position
    });
  }
  
  // 将排序结果复制回原数组
  for (let i = 0; i < n; i++) {
    workingArr[i] = outputArray[i];
    
    steps.push({
      type: 'sorting',
      array: [...workingArr],
      description: `将排序后的元素 ${outputArray[i]} 复制回原数组位置 ${i}`,
      currentIndex: i,
      compareIndex: -1,
      countingArray: [...countingArray],
      outputArray: [...outputArray],
      phase: 'copy_back',
      sortedIndices: Array.from({length: i + 1}, (_, idx) => idx)
    });
  }
  
  // 最终步骤
  steps.push({
    type: 'sorting',
    array: [...workingArr],
    description: '计数排序完成',
    currentIndex: -1,
    compareIndex: -1,
    countingArray: [...countingArray],
    outputArray: [...outputArray],
    phase: 'complete',
    sortedIndices: Array.from({length: n}, (_, idx) => idx)
  });
  
  return steps;
}

// 为浏览器环境提供全局访问
if (typeof window !== 'undefined') {
  window.VisualizationSteps = window.VisualizationSteps || {};
  window.VisualizationSteps.generateCountingSortSteps = generateCountingSortSteps;
}

// ES6 模块导出
module.exports = {
  generateCountingSortSteps
}; 