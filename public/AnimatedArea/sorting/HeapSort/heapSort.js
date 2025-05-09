/**
 * 堆排序算法的可视化步骤生成
 * 包含堆排序算法的实现和可视化步骤生成函数
 */

/**
 * 生成堆排序的可视化步骤
 * @param {Array<number>} arr 待排序数组
 * @returns {Array<Object>} 可视化步骤数组
 */
function generateHeapSortSteps(arr) {
  const steps = [];
  const n = arr.length;
  const workingArr = [...arr];
  const sortedIndices = [];
  
  // 内联定义getPositionDescription
  const getPositionDescription = function(index) {
    const positions = ['第一个', '第二个', '第三个', '第四个', '第五个', '第六个', '第七个', '第八个', '第九个', '第十个'];
    return positions[index] || `位置${index + 1}`;
  };
  
  // 构建最大堆
  steps.push({
    type: 'sorting',
    array: [...workingArr],
    currentIndex: -1,
    compareIndex: -1,
    description: '开始建立最大堆',
    sortedIndices: []
  });
  
  // 从最后一个非叶子节点开始向下调整
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    heapify(workingArr, n, i);
  }
  
  steps.push({
    type: 'sorting',
    array: [...workingArr],
    currentIndex: -1,
    compareIndex: -1,
    description: '最大堆构建完成，开始排序',
    sortedIndices: [...sortedIndices],
    heapStructure: true
  });
  
  // 一个个从堆顶取出最大元素
  for (let i = n - 1; i > 0; i--) {
    // 交换堆顶元素和当前末尾元素
    [workingArr[0], workingArr[i]] = [workingArr[i], workingArr[0]];
    
    steps.push({
      type: 'sorting',
      array: [...workingArr],
      currentIndex: 0,
      compareIndex: i,
      description: `交换堆顶元素 ${workingArr[i]} 和末尾元素 ${workingArr[0]}`,
      sortedIndices: [...sortedIndices],
      heapStructure: true
    });
    
    // 将当前处理的元素标记为已排序
    sortedIndices.push(i);
    
    steps.push({
      type: 'sorting',
      array: [...workingArr],
      currentIndex: -1,
      compareIndex: -1,
      description: `元素 ${workingArr[i]} 已排序`,
      sortedIndices: [...sortedIndices],
      heapStructure: true
    });
    
    // 重新调整堆
    heapify(workingArr, i, 0);
  }
  
  // 最后一个元素
  sortedIndices.push(0);
  
  steps.push({
    type: 'sorting',
    array: [...workingArr],
    currentIndex: -1,
    compareIndex: -1,
    description: '排序完成',
    sortedIndices: Array.from({length: n}, (_, index) => index)
  });
  
  return steps;
  
  /**
   * 调整堆
   * @param {Array<number>} arr 数组
   * @param {number} n 堆大小
   * @param {number} i 当前节点索引
   */
  function heapify(arr, n, i) {
    let largest = i;         // 初始化最大值为当前节点
    const left = 2 * i + 1;  // 左子节点
    const right = 2 * i + 2; // 右子节点
    
    steps.push({
      type: 'sorting',
      array: [...arr],
      currentIndex: i,
      compareIndex: -1,
      description: `检查节点 ${i} 的子节点`,
      sortedIndices: [...sortedIndices],
      heapStructure: true,
      heapNodeIndices: {
        current: i,
        left: left < n ? left : null,
        right: right < n ? right : null
      }
    });
    
    // 比较左子节点和根节点
    if (left < n) {
      steps.push({
        type: 'sorting',
        array: [...arr],
        currentIndex: i,
        compareIndex: left,
        description: `比较节点 ${i}(${arr[i]}) 和左子节点 ${left}(${arr[left]})`,
        sortedIndices: [...sortedIndices],
        heapStructure: true,
        heapNodeIndices: {
          current: i,
          left: left,
          right: right < n ? right : null
        }
      });
      
      if (arr[left] > arr[largest]) {
        largest = left;
        
        steps.push({
          type: 'sorting',
          array: [...arr],
          currentIndex: largest,
          compareIndex: -1,
          description: `节点 ${left}(${arr[left]}) 更大，成为新的最大值`,
          sortedIndices: [...sortedIndices],
          heapStructure: true,
          heapNodeIndices: {
            current: i,
            largest: largest,
            left: left,
            right: right < n ? right : null
          }
        });
      }
    }
    
    // 比较右子节点和当前最大值
    if (right < n) {
      steps.push({
        type: 'sorting',
        array: [...arr],
        currentIndex: largest,
        compareIndex: right,
        description: `比较当前最大值节点 ${largest}(${arr[largest]}) 和右子节点 ${right}(${arr[right]})`,
        sortedIndices: [...sortedIndices],
        heapStructure: true,
        heapNodeIndices: {
          current: i,
          largest: largest,
          left: left < n ? left : null,
          right: right
        }
      });
      
      if (arr[right] > arr[largest]) {
        largest = right;
        
        steps.push({
          type: 'sorting',
          array: [...arr],
          currentIndex: largest,
          compareIndex: -1,
          description: `节点 ${right}(${arr[right]}) 更大，成为新的最大值`,
          sortedIndices: [...sortedIndices],
          heapStructure: true,
          heapNodeIndices: {
            current: i,
            largest: largest,
            left: left < n ? left : null,
            right: right
          }
        });
      }
    }
    
    // 如果最大值不是当前节点，交换它们
    if (largest !== i) {
      [arr[i], arr[largest]] = [arr[largest], arr[i]];
      
      steps.push({
        type: 'sorting',
        array: [...arr],
        currentIndex: i,
        compareIndex: largest,
        description: `交换节点 ${i} 和 ${largest}`,
        sortedIndices: [...sortedIndices],
        heapStructure: true,
        heapNodeIndices: {
          current: i,
          largest: largest,
          left: left < n ? left : null,
          right: right < n ? right : null
        }
      });
      
      // 递归调整受影响的子树
      heapify(arr, n, largest);
    } else {
      steps.push({
        type: 'sorting',
        array: [...arr],
        currentIndex: i,
        compareIndex: -1,
        description: `节点 ${i} 已满足堆属性`,
        sortedIndices: [...sortedIndices],
        heapStructure: true
      });
    }
  }
}

// 为浏览器环境提供全局访问
if (typeof window !== 'undefined') {
  window.VisualizationSteps = window.VisualizationSteps || {};
  window.VisualizationSteps.generateHeapSortSteps = generateHeapSortSteps;
}

// ES6 模块导出
module.exports = {
  generateHeapSortSteps
}; 