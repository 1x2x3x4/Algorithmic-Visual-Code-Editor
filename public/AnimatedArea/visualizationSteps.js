/**
 * 后端算法步骤生成器集成模块（独立的js文件）
 * 仅供服务器端使用，集中收集所有算法步骤生成函数
 */

const fs = require('fs');
const path = require('path');

// 创建集成器对象
const AlgorithmIntegrator = {
  // 通用工具函数
  getPositionDescription: function(index) {
    const positions = ['第一个', '第二个', '第三个', '第四个', '第五个', '第六个', '第七个', '第八个', '第九个', '第十个'];
    return positions[index] || `位置${index + 1}`;
  },
  
  // 加载所有算法和数据结构模块
  loadAll: function(basePath) {
    console.log("开始加载算法和数据结构模块...");
    
    // 定义算法和数据结构配置
    const modules = [
      // 排序算法
      { name: "冒泡排序", path: path.join(basePath, 'public/AnimatedArea/sorting/BubbleSort/bubbleSort.js'), functionName: "generateBubbleSortSteps" },
      { name: "选择排序", path: path.join(basePath, 'public/AnimatedArea/sorting/SelectionSort/selectionSort.js'), functionName: "generateSelectionSortSteps" },
      { name: "插入排序", path: path.join(basePath, 'public/AnimatedArea/sorting/InsertionSort/insertionSort.js'), functionName: "generateInsertionSortSteps" },
      { name: "快速排序", path: path.join(basePath, 'public/AnimatedArea/sorting/QuickSort/quickSort.js'), functionName: "generateQuickSortSteps" },
      { name: "堆排序", path: path.join(basePath, 'public/AnimatedArea/sorting/HeapSort/heapSort.js'), functionName: "generateHeapSortSteps" },
      { name: "归并排序", path: path.join(basePath, 'public/AnimatedArea/sorting/MergeSort/mergeSort.js'), functionName: "generateMergeSortSteps" },
      { name: "基数排序", path: path.join(basePath, 'public/AnimatedArea/sorting/RadixSort/radixSort.js'), functionName: "generateRadixSortSteps" },
      { name: "桶排序", path: path.join(basePath, 'public/AnimatedArea/sorting/BucketSort/bucketSort.js'), functionName: "generateBucketSortSteps" },
      { name: "计数排序", path: path.join(basePath, 'public/AnimatedArea/sorting/CountingSort/countingSort.js'), functionName: "generateCountingSortSteps" },
      
      // 数据结构
      { name: "链表", path: path.join(basePath, 'public/AnimatedArea/dataStructures/LinkedList/linkedList.js'), functionName: "generateLinkedListSteps" },
      { name: "二叉树", path: path.join(basePath, 'public/AnimatedArea/dataStructures/BinaryTree/binaryTree.js'), functionName: "generateBinaryTreeSteps" },
      { name: "栈", path: path.join(basePath, 'public/AnimatedArea/dataStructures/Stack/stack.js'), functionName: "generateStackSteps" }
    ];
    
    // 加载所有模块
    modules.forEach(module => {
      try {
        if (fs.existsSync(module.path)) {
          const loadedModule = require(module.path);
          if (loadedModule && typeof loadedModule[module.functionName] === 'function') {
            this[module.functionName] = loadedModule[module.functionName];
            console.log(`✓ ${module.name} 已加载`);
          } else {
            console.error(`× ${module.name} 加载失败: 未找到 ${module.functionName} 函数`);
          }
        } else {
          console.error(`× ${module.name} 加载失败: 文件不存在`);
        }
      } catch (error) {
        console.error(`× ${module.name} 加载失败: ${error.message}`);
      }
    });
    
    return this;
  },
  
  // 算法步骤生成函数
  generateSteps: function(algorithm, data) {
    try {
      switch(algorithm) {
        // 数据结构
        case 'linkedList':
          if (typeof this.generateLinkedListSteps !== 'function')
            throw new Error('链表步骤生成函数未加载');
          return this.generateLinkedListSteps(data);
          
        case 'stack':
          if (typeof this.generateStackSteps !== 'function')
            throw new Error('栈步骤生成函数未加载');
          return this.generateStackSteps(data);
          
        case 'binaryTree':
          if (typeof this.generateBinaryTreeSteps !== 'function')
            throw new Error('二叉树步骤生成函数未加载');
          return this.generateBinaryTreeSteps(data);
        
        // 排序算法
        case 'bubbleSort':
          if (typeof this.generateBubbleSortSteps !== 'function')
            throw new Error('冒泡排序步骤生成函数未加载');
          return this.generateBubbleSortSteps(data.array || []);
          
        case 'selectionSort':
          if (typeof this.generateSelectionSortSteps !== 'function')
            throw new Error('选择排序步骤生成函数未加载');
          return this.generateSelectionSortSteps(data.array || []);
          
        case 'insertionSort':
          if (typeof this.generateInsertionSortSteps !== 'function')
            throw new Error('插入排序步骤生成函数未加载');
          return this.generateInsertionSortSteps(data.array || []);
          
        case 'quickSort':
          if (typeof this.generateQuickSortSteps !== 'function')
            throw new Error('快速排序步骤生成函数未加载');
          return this.generateQuickSortSteps(data.array || []);
          
        case 'heapSort':
          if (typeof this.generateHeapSortSteps !== 'function')
            throw new Error('堆排序步骤生成函数未加载');
          return this.generateHeapSortSteps(data.array || []);
          
        case 'mergeSort':
          if (typeof this.generateMergeSortSteps !== 'function')
            throw new Error('归并排序步骤生成函数未加载');
          return this.generateMergeSortSteps(data.array || []);
          
        case 'radixSort':
          if (typeof this.generateRadixSortSteps !== 'function')
            throw new Error('基数排序步骤生成函数未加载');
          return this.generateRadixSortSteps(data.array || []);
          
        case 'bucketSort':
          if (typeof this.generateBucketSortSteps !== 'function')
            throw new Error('桶排序步骤生成函数未加载');
          return this.generateBucketSortSteps(data.array || []);
          
        case 'countingSort':
          if (typeof this.generateCountingSortSteps !== 'function')
            throw new Error('计数排序步骤生成函数未加载');
          return this.generateCountingSortSteps(data.array || []);
          
        default:
          throw new Error(`不支持的算法: ${algorithm}`);
      }
    } catch (error) {
      console.error(`生成步骤失败: ${error.message}`);
      throw error;
    }
  }
};

module.exports = AlgorithmIntegrator;