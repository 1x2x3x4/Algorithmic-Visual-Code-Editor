/**
 * 插入排序算法的可视化步骤生成
 * 包含插入排序算法的实现和可视化步骤生成函数
 */

/**
 * 生成插入排序的可视化步骤
 * @param {Array<number>} arr 待排序数组
 * @returns {Array<Object>} 可视化步骤数组
 */
function generateInsertionSortSteps(arr) {
  const steps = [];
  const n = arr.length;
  const workingArr = [...arr];
  const sortedIndices = [0];  // 初始时，第一个元素视为已排序
  
  // 内联定义getPositionDescription
  const getPositionDescription = function(index) {
    const positions = ['第一个', '第二个', '第三个', '第四个', '第五个', '第六个', '第七个', '第八个', '第九个', '第十个'];
    return positions[index] || `位置${index + 1}`;
  };
  
  // 初始步骤
  steps.push({
    type: 'sorting',
    array: [...workingArr],
    currentIndex: 0,
    compareIndex: -1,
    description: '初始状态，第一个元素已视为有序',
    sortedIndices: [...sortedIndices]
  });
  
  for (let i = 1; i < n; i++) {
    const key = workingArr[i];
    
    steps.push({
      type: 'sorting',
      array: [...workingArr],
      currentIndex: i,
      compareIndex: -1,
      description: `选取${getPositionDescription(i)}元素 ${key} 进行插入`,
      sortedIndices: [...sortedIndices]
    });
    
    let j = i - 1;
    
    while (j >= 0 && workingArr[j] > key) {
      steps.push({
        type: 'sorting',
        array: [...workingArr],
        currentIndex: i,
        compareIndex: j,
        description: `比较 ${key} 和 ${workingArr[j]}`,
        sortedIndices: [...sortedIndices]
      });
      
      workingArr[j + 1] = workingArr[j];
      
      steps.push({
        type: 'sorting',
        array: [...workingArr],
        currentIndex: j + 1,
        compareIndex: j,
        description: `将元素 ${workingArr[j]} 后移一位`,
        sortedIndices: [...sortedIndices]
      });
      
      j--;
    }
    
    workingArr[j + 1] = key;
    
    steps.push({
      type: 'sorting',
      array: [...workingArr],
      currentIndex: j + 1,
      compareIndex: -1,
      description: `将元素 ${key} 插入到位置 ${j + 1}`,
      sortedIndices: [...sortedIndices]
    });
    
    sortedIndices.push(i);
    
    steps.push({
      type: 'sorting',
      array: [...workingArr],
      currentIndex: -1,
      compareIndex: -1,
      description: `完成第 ${i} 轮插入排序`,
      sortedIndices: [...sortedIndices]
    });
  }
  
  steps.push({
    type: 'sorting',
    array: [...workingArr],
    currentIndex: -1,
    compareIndex: -1,
    description: '排序完成',
    sortedIndices: Array.from({length: n}, (_, index) => index)
  });
  
  return steps;
}

// 为浏览器环境提供全局访问
if (typeof window !== 'undefined') {
  window.VisualizationSteps = window.VisualizationSteps || {};
  window.VisualizationSteps.generateInsertionSortSteps = generateInsertionSortSteps;
}

// ES6 模块导出
module.exports = {
  generateInsertionSortSteps
}; 