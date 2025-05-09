/**
 * 归并排序算法的可视化步骤生成
 * 包含归并排序算法的实现和可视化步骤生成函数
 */

/**
 * 生成归并排序的可视化步骤
 * @param {Array<number>} arr 待排序数组
 * @returns {Array<Object>} 可视化步骤数组
 */
function generateMergeSortSteps(arr) {
  const steps = [];
  const workingArr = [...arr];
  const n = workingArr.length;
  
  // 内联定义getPositionDescription
  const getPositionDescription = function(index) {
    const positions = ['第一个', '第二个', '第三个', '第四个', '第五个', '第六个', '第七个', '第八个', '第九个', '第十个'];
    return positions[index] || `位置${index + 1}`;
  };
  
  // 跟踪排序结果
  const sortedIndices = new Set();
  
  // 初始化辅助数组
  const auxArray = new Array(n);
  
  function mergeSort(left, right) {
    if (left >= right) {
      return;
    }
    
    const mid = Math.floor((left + right) / 2);
    
    steps.push({
      type: 'sorting',
      array: [...workingArr],
      currentIndex: -1,
      compareIndex: -1,
      description: `分割区域 [${left}...${right}] 为 [${left}...${mid}] 和 [${mid+1}...${right}]`,
      highlightRange: [left, right]
    });
    
    // 递归排序左半部分
    mergeSort(left, mid);
    
    // 递归排序右半部分
    mergeSort(mid + 1, right);
    
    // 合并两个有序子数组
    merge(left, mid, right);
  }
  
  function merge(left, mid, right) {
    // 复制到辅助数组
    for (let i = left; i <= right; i++) {
      auxArray[i] = workingArr[i];
    }
    
    steps.push({
      type: 'sorting',
      array: [...workingArr],
      currentIndex: -1,
      compareIndex: -1,
      description: `准备合并区域 [${left}...${mid}] 和 [${mid+1}...${right}]`,
      highlightRange: [left, right],
      auxArray: auxArray.slice(left, right + 1)
    });
    
    let i = left;     // 左半部分起始索引
    let j = mid + 1;  // 右半部分起始索引
    let k = left;     // 工作数组当前索引
    
    // 合并两个子数组
    while (i <= mid && j <= right) {
      steps.push({
        type: 'sorting',
        array: [...workingArr],
        currentIndex: i,
        compareIndex: j,
        description: `比较元素 ${auxArray[i]} 和 ${auxArray[j]}`,
        highlightRange: [left, right],
        auxArray: auxArray.slice(left, right + 1)
      });
      
      if (auxArray[i] <= auxArray[j]) {
        workingArr[k] = auxArray[i];
        
        steps.push({
          type: 'sorting',
          array: [...workingArr],
          currentIndex: k,
          compareIndex: -1,
          description: `将左侧元素 ${auxArray[i]} 放入位置 ${k}`,
          highlightRange: [left, right],
          auxArray: auxArray.slice(left, right + 1)
        });
        
        i++;
      } else {
        workingArr[k] = auxArray[j];
        
        steps.push({
          type: 'sorting',
          array: [...workingArr],
          currentIndex: k,
          compareIndex: -1,
          description: `将右侧元素 ${auxArray[j]} 放入位置 ${k}`,
          highlightRange: [left, right],
          auxArray: auxArray.slice(left, right + 1)
        });
        
        j++;
      }
      k++;
    }
    
    // 处理剩余元素
    while (i <= mid) {
      workingArr[k] = auxArray[i];
      
      steps.push({
        type: 'sorting',
        array: [...workingArr],
        currentIndex: k,
        compareIndex: -1,
        description: `复制剩余左侧元素 ${auxArray[i]} 到位置 ${k}`,
        highlightRange: [left, right],
        auxArray: auxArray.slice(left, right + 1)
      });
      
      i++;
      k++;
    }
    
    while (j <= right) {
      workingArr[k] = auxArray[j];
      
      steps.push({
        type: 'sorting',
        array: [...workingArr],
        currentIndex: k,
        compareIndex: -1,
        description: `复制剩余右侧元素 ${auxArray[j]} 到位置 ${k}`,
        highlightRange: [left, right],
        auxArray: auxArray.slice(left, right + 1)
      });
      
      j++;
      k++;
    }
    
    // 标记已排序的区域
    if (left === 0 && right === n - 1) {
      for (let i = left; i <= right; i++) {
        sortedIndices.add(i);
      }
    }
    
    steps.push({
      type: 'sorting',
      array: [...workingArr],
      currentIndex: -1,
      compareIndex: -1,
      description: `合并完成，区域 [${left}...${right}] 已有序`,
      highlightRange: [left, right],
      sortedIndices: left === 0 && right === n - 1 ? Array.from(sortedIndices) : undefined
    });
  }
  
  // 开始归并排序
  if (n <= 1) {
    steps.push({
      type: 'sorting',
      array: [...workingArr],
      currentIndex: -1,
      compareIndex: -1,
      description: '数组元素少于2个，已经有序',
      sortedIndices: Array.from({length: n}, (_, index) => index)
    });
  } else {
    mergeSort(0, n - 1);
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
  window.VisualizationSteps.generateMergeSortSteps = generateMergeSortSteps;
}

// ES6 模块导出
module.exports = {
  generateMergeSortSteps
}; 