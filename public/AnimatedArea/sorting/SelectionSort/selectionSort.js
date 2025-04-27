/**
 * 选择排序算法的可视化步骤生成
 * 包含选择排序算法的实现和可视化步骤生成函数
 */

/**
 * 生成选择排序的可视化步骤
 * @param {Array<number>} arr 待排序数组
 * @returns {Array<Object>} 可视化步骤数组
 */
function generateSelectionSortSteps(arr) {
  const steps = [];
  const n = arr.length;
  const workingArr = [...arr];
  const sortedIndices = [];  // 已排序元素的索引集合
  
  // 获取位置描述函数 - 直接定义，不依赖全局对象
  const getPositionDescription = function(index) {
    const positions = ['第一个', '第二个', '第三个', '第四个', '第五个', '第六个', '第七个', '第八个', '第九个', '第十个'];
    return positions[index] || `位置${index + 1}`;
  };

  for (let i = 0; i < n - 1; i++) {
    let minIndex = i;
    
    steps.push({
      type: 'sorting',
      array: [...workingArr],
      currentIndex: i,
      compareIndex: -1,
      description: `开始第 ${i + 1} 轮选择，从位置 ${i} 开始查找最小元素`,
      sortedIndices: [...sortedIndices],
      minIndex: minIndex
    });
    
    for (let j = i + 1; j < n; j++) {
      steps.push({
        type: 'sorting',
        array: [...workingArr],
        currentIndex: minIndex,
        compareIndex: j,
        description: `比较当前最小元素 ${workingArr[minIndex]} 和元素 ${workingArr[j]}`,
        sortedIndices: [...sortedIndices],
        minIndex: minIndex
      });
      
      if (workingArr[j] < workingArr[minIndex]) {
        minIndex = j;
        
        steps.push({
          type: 'sorting',
          array: [...workingArr],
          currentIndex: minIndex,
          compareIndex: -1,
          description: `找到新的最小元素 ${workingArr[minIndex]} 在位置 ${minIndex}`,
          sortedIndices: [...sortedIndices],
          minIndex: minIndex
        });
      }
    }
    
    if (minIndex !== i) {
      [workingArr[i], workingArr[minIndex]] = [workingArr[minIndex], workingArr[i]];
      
      steps.push({
        type: 'sorting',
        array: [...workingArr],
        currentIndex: i,
        compareIndex: minIndex,
        description: `交换位置 ${i} 和位置 ${minIndex} 的元素`,
        sortedIndices: [...sortedIndices],
        minIndex: -1
      });
    }
    
    sortedIndices.push(i);
    
    steps.push({
      type: 'sorting',
      array: [...workingArr],
      currentIndex: -1,
      compareIndex: -1,
      description: `第 ${i + 1} 轮选择完成，位置 ${i} 的元素 ${workingArr[i]} 已排序`,
      sortedIndices: [...sortedIndices]
    });
  }
  
  // 最后一个元素也是有序的
  sortedIndices.push(n - 1);
  
  steps.push({
    type: 'sorting',
    array: [...workingArr],
    currentIndex: -1,
    compareIndex: -1,
    description: '排序完成',
    sortedIndices: [...sortedIndices]
  });

  return steps;
}

// 为浏览器环境提供全局访问
if (typeof window !== 'undefined') {
  window.VisualizationSteps = window.VisualizationSteps || {};
  window.VisualizationSteps.generateSelectionSortSteps = generateSelectionSortSteps;
}

// ES6 模块导出
module.exports = {
  generateSelectionSortSteps
}; 