/**
 * 冒泡排序算法的可视化步骤生成
 * 包含冒泡排序算法的实现和可视化步骤生成函数
 */

/**
 * 生成冒泡排序的可视化步骤
 * @param {Array<number>} arr 待排序数组
 * @returns {Array<Object>} 可视化步骤数组
 */
function generateBubbleSortSteps(arr) {
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
    for (let j = 0; j < n - i - 1; j++) {
      steps.push({
        type: 'sorting',
        array: [...workingArr],
        currentIndex: j,
        compareIndex: j + 1,
        description: `比较${getPositionDescription(j)}元素 ${workingArr[j]} 和${getPositionDescription(j + 1)}元素 ${workingArr[j + 1]}`,
        sortedIndices: [...sortedIndices]
      });

      if (workingArr[j] > workingArr[j + 1]) {
        [workingArr[j], workingArr[j + 1]] = [workingArr[j + 1], workingArr[j]];
        
        steps.push({
          type: 'sorting',
          array: [...workingArr],
          currentIndex: j,
          compareIndex: j + 1,
          description: `交换${getPositionDescription(j)}元素和${getPositionDescription(j + 1)}元素`,
          sortedIndices: [...sortedIndices]
        });
      }
    }
    
    // 每轮冒泡完成后，最大的元素被放到了正确的位置
    sortedIndices.push(n - i - 1);
    
    steps.push({
      type: 'sorting',
      array: [...workingArr],
      currentIndex: -1,
      compareIndex: -1,
      description: `第 ${i + 1} 轮冒泡完成，${getPositionDescription(n - i - 1)}元素 ${workingArr[n - i - 1]} 已冒泡到正确位置`,
      sortedIndices: [...sortedIndices]
    });
  }

  // 当所有元素都排序完成后，第一个元素也是有序的
  if (n > 0 && !sortedIndices.includes(0)) {
    sortedIndices.push(0);
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
  window.VisualizationSteps.generateBubbleSortSteps = generateBubbleSortSteps;
}

// ES6 模块导出
module.exports = {
  generateBubbleSortSteps
}; 