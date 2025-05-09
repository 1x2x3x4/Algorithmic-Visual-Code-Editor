/**
 * 快速排序算法的可视化步骤生成
 * 包含快速排序算法的实现和可视化步骤生成函数
 */

/**
 * 生成快速排序的可视化步骤
 * @param {Array<number>} arr 待排序数组
 * @returns {Array<Object>} 可视化步骤数组
 */
function generateQuickSortSteps(arr) {
  const steps = [];
  const workingArr = [...arr];
  const sortedIndices = new Set();
  
  // 获取位置描述函数 - 直接定义，不依赖全局对象
  const getPositionDescription = function(index) {
    const positions = ['第一个', '第二个', '第三个', '第四个', '第五个', '第六个', '第七个', '第八个', '第九个', '第十个'];
    return positions[index] || `位置${index + 1}`;
  };
  
  function quickSort(low, high) {
    if (low < high) {
      // 分区过程
      const pivotIndex = partition(low, high);
      
      // 将基准元素标记为已排序
      sortedIndices.add(pivotIndex);
      
      // 排序基准元素左边的子数组
      quickSort(low, pivotIndex - 1);
      
      // 排序基准元素右边的子数组
      quickSort(pivotIndex + 1, high);
    } else if (low === high) {
      // 处理单元素子数组
      sortedIndices.add(low);
      
      steps.push({
        type: 'sorting',
        array: [...workingArr],
        currentIndex: low,
        compareIndex: -1,
        description: `单元素区域 [${low}] 已排序`,
        sortedIndices: Array.from(sortedIndices),
        pivotIndex: -1
      });
    }
  }
  
  function partition(low, high) {
    const pivot = workingArr[high];
    
    steps.push({
      type: 'sorting',
      array: [...workingArr],
      currentIndex: high,
      compareIndex: -1,
      description: `选择 ${getPositionDescription(high)} 元素 ${pivot} 作为基准`,
      sortedIndices: Array.from(sortedIndices),
      pivotIndex: high
    });
    
    let i = low - 1;
    
    for (let j = low; j <= high - 1; j++) {
      steps.push({
        type: 'sorting',
        array: [...workingArr],
        currentIndex: j,
        compareIndex: high,
        description: `比较元素 ${workingArr[j]} 和基准元素 ${pivot}`,
        sortedIndices: Array.from(sortedIndices),
        pivotIndex: high
      });
      
      if (workingArr[j] < pivot) {
        i++;
        
        if (i !== j) {
          [workingArr[i], workingArr[j]] = [workingArr[j], workingArr[i]];
          
          steps.push({
            type: 'sorting',
            array: [...workingArr],
            currentIndex: i,
            compareIndex: j,
            description: `交换元素 ${workingArr[i]} 和 ${workingArr[j]}`,
            sortedIndices: Array.from(sortedIndices),
            pivotIndex: high
          });
        }
      }
    }
    
    [workingArr[i + 1], workingArr[high]] = [workingArr[high], workingArr[i + 1]];
    
    steps.push({
      type: 'sorting',
      array: [...workingArr],
      currentIndex: i + 1,
      compareIndex: high,
      description: `将基准元素 ${pivot} 放到正确位置`,
      sortedIndices: Array.from(sortedIndices),
      pivotIndex: i + 1
    });
    
    return i + 1;
  }
  
  // 开始快速排序
  if (arr.length > 1) {
    quickSort(0, arr.length - 1);
  } else {
    steps.push({
      type: 'sorting',
      array: [...workingArr],
      currentIndex: -1,
      compareIndex: -1,
      description: '数组长度小于2，无需排序',
      sortedIndices: Array.from({length: arr.length}, (_, i) => i)
    });
  }
  
  steps.push({
    type: 'sorting',
    array: [...workingArr],
    currentIndex: -1,
    compareIndex: -1,
    description: '排序完成',
    sortedIndices: Array.from({length: arr.length}, (_, index) => index)
  });

  return steps;
}

// 为浏览器环境提供全局访问
if (typeof window !== 'undefined') {
  window.VisualizationSteps = window.VisualizationSteps || {};
  window.VisualizationSteps.generateQuickSortSteps = generateQuickSortSteps;
}

// ES6 模块导出
module.exports = {
  generateQuickSortSteps
}; 