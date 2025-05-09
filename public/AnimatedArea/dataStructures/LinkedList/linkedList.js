/**
 * 链表操作的可视化步骤生成
 * 包含链表的基本操作和可视化步骤生成函数
 */

// 使用立即执行函数表达式(IIFE)创建模块化的链表操作功能
(function() {
  // 判断当前环境，获取适当的全局对象
  var globalObject = typeof window !== 'undefined' ? window : 
                     typeof global !== 'undefined' ? global : 
                     typeof self !== 'undefined' ? self : {};
  
  // 获取全局对象中的可视化步骤对象或创建新对象
  var VisualizationSteps = globalObject.VisualizationSteps || {};
  
  // 保存当前链表状态
  let currentLinkedList = null;
  
  // 定义链表操作类型
  const OPERATIONS = {
    INIT: 'init',          // 初始化链表
    SEARCH: 'search',      // 搜索节点
    INSERT_HEAD: 'insertHead', // 头部插入
    INSERT_TAIL: 'insertTail', // 尾部插入
    INSERT_AT: 'insertAt',  // 指定位置插入
    REMOVE_HEAD: 'removeHead', // 头部删除
    REMOVE_TAIL: 'removeTail', // 尾部删除
    REMOVE_AT: 'removeAt',  // 指定位置删除
    RESET: 'reset'         // 重置链表
  };
  
  /**
   * 生成链表初始化的步骤
   * @param {Array<number>} values 链表节点的值数组
   * @returns {Array<Object>} 可视化步骤数组
   */
  function generateInitSteps(values) {
    const steps = [];

    // 如果没有传入值，使用默认值
    if (!Array.isArray(values)) {
      values = [6, 1, 7, 4, 8];
      steps.push({
        type: 'linkedList',
        description: '使用默认链表数据',
        current: null,
        highlight: []
      });
    }

    // 创建链表节点，结构与C语言定义一致
    const nodes = values.map((val, i) => ({
      id: i,
      value: val,
      next: i < values.length - 1 ? i + 1 : null // 模拟指针
    }));
    
    // 保存当前链表状态
    currentLinkedList = JSON.parse(JSON.stringify(nodes));

    // 初始状态
    let initialDescription = '初始化链表，头节点值为 ' + nodes[0].value;
    for (let i = 0; i < nodes.length - 1; i++) {
      initialDescription += ` -> [${nodes[i + 1].value}]`;
    }
    steps.push({
      type: 'linkedList',
      nodes: JSON.parse(JSON.stringify(nodes)),
      description: initialDescription,
      current: 0,
      highlight: [0]
    });

    // 清除高亮，显示静态状态
    steps.push({
      type: 'linkedList',
      nodes: JSON.parse(JSON.stringify(nodes)),
      description: '链表初始化完成，请使用操作按钮进行交互',
      current: null,
      highlight: []
    });

    return steps;
  }
  
  /**
   * 在链表中搜索特定值
   * @param {number} value 要搜索的值
   * @returns {Array<Object>} 可视化步骤数组
   */
  function generateSearchSteps(value) {
    const steps = [];
    
    // 如果链表不存在或为空，返回错误状态
    if (!currentLinkedList || !Array.isArray(currentLinkedList) || currentLinkedList.length === 0) {
      steps.push({
        type: 'linkedList',
        nodes: [],
        description: '搜索操作失败: 链表为空',
        current: null,
        highlight: []
      });
      return steps;
    }
    
    // 克隆当前链表
    const nodes = JSON.parse(JSON.stringify(currentLinkedList));
    
    // 描述当前状态
    let currentDescription = '当前链表: ';
    for (let i = 0; i < nodes.length; i++) {
      currentDescription += `[${nodes[i].value}]`;
      if (i < nodes.length - 1) {
        currentDescription += ' -> ';
      }
    }
    
    steps.push({
      type: 'linkedList',
      nodes: JSON.parse(JSON.stringify(nodes)),
      description: currentDescription,
      current: null,
      highlight: []
    });
    
    // 初始描述
    steps.push({
      type: 'linkedList',
      nodes: JSON.parse(JSON.stringify(nodes)),
      description: `开始搜索值为 ${value} 的节点`,
      current: 0,
      highlight: [0]
    });
    
    // 模拟搜索过程
    let foundIndex = -1;
    for (let i = 0; i < nodes.length; i++) {
      let searchDescription = `检查节点 [${nodes[i].value}]`;
      
      steps.push({
        type: 'linkedList',
        nodes: JSON.parse(JSON.stringify(nodes)),
        description: searchDescription,
        current: i,
        highlight: [i]
      });
      
      if (nodes[i].value === value) {
        foundIndex = i;
        break;
      }
    }
    
    // 搜索结果
    if (foundIndex !== -1) {
      let resultDescription = `找到了值为 ${value} 的节点`;
      steps.push({
        type: 'linkedList',
        nodes: JSON.parse(JSON.stringify(nodes)),
        description: resultDescription,
        current: foundIndex,
        highlight: [foundIndex]
      });
    } else {
      let resultDescription = `链表中不存在值为 ${value} 的节点`;
      steps.push({
        type: 'linkedList',
        nodes: JSON.parse(JSON.stringify(nodes)),
        description: resultDescription,
        current: null,
        highlight: []
      });
    }
    
    return steps;
  }
  
  /**
   * 在链表头部插入节点
   * @param {number} value 要插入的值
   * @returns {Array<Object>} 可视化步骤数组
   */
  function generateInsertHeadSteps(value) {
    const steps = [];
    
    // 如果链表不存在，初始化一个空链表
    if (!currentLinkedList || !Array.isArray(currentLinkedList) || currentLinkedList.length === 0) {
      currentLinkedList = [];
    }
    
    // 克隆当前链表
    const nodes = JSON.parse(JSON.stringify(currentLinkedList));
    
    // 描述当前状态
    let currentDescription = '当前链表: ';
    if (nodes.length > 0) {
      for (let i = 0; i < nodes.length; i++) {
        currentDescription += `[${nodes[i].value}]`;
        if (i < nodes.length - 1) {
          currentDescription += ' -> ';
        }
      }
    } else {
      currentDescription += '空';
    }
    
    steps.push({
      type: 'linkedList',
      nodes: JSON.parse(JSON.stringify(nodes)),
      description: currentDescription,
      current: nodes.length > 0 ? 0 : null,
      highlight: nodes.length > 0 ? [0] : []
    });
    
    // 创建新节点
    const newNode = {
      id: 0, // 将成为新的头节点
      value: value,
      next: nodes.length > 0 ? 0 : null
    };
    
    // 更新现有节点的id
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].id = i + 1;
      if (i > 0) {
        nodes[i-1].next = i + 1;
      }
    }
    
    // 插入新节点到头部
    nodes.unshift(newNode);
    
    // 更新当前链表状态
    currentLinkedList = JSON.parse(JSON.stringify(nodes));
    
    // 描述插入操作
    let insertDescription = `在头部插入新节点 [${value}]`;
    if (nodes.length > 1) {
      insertDescription += ' -> ';
      for (let i = 1; i < nodes.length; i++) {
        insertDescription += `[${nodes[i].value}]`;
        if (i < nodes.length - 1) {
          insertDescription += ' -> ';
        }
      }
    }
    
    steps.push({
      type: 'linkedList',
      nodes: JSON.parse(JSON.stringify(nodes)),
      description: insertDescription,
      current: 0,
      highlight: [0, 1]
    });
    
    // 最终状态
    steps.push({
      type: 'linkedList',
      nodes: JSON.parse(JSON.stringify(nodes)),
      description: '头部插入操作完成',
      current: 0,
      highlight: [0]
    });
    
    return steps;
  }
  
  /**
   * 在链表头部删除节点
   * @returns {Array<Object>} 可视化步骤数组
   */
  function generateRemoveHeadSteps() {
    const steps = [];
    
    // 如果链表不存在或为空，返回错误状态
    if (!currentLinkedList || !Array.isArray(currentLinkedList) || currentLinkedList.length === 0) {
      steps.push({
        type: 'linkedList',
        nodes: [],
        description: '头部删除操作失败: 链表为空',
        current: null,
        highlight: []
      });
      return steps;
    }
    
    // 克隆当前链表
    const nodes = JSON.parse(JSON.stringify(currentLinkedList));
    
    // 描述当前状态
    let currentDescription = '当前链表: ';
    for (let i = 0; i < nodes.length; i++) {
      currentDescription += `[${nodes[i].value}]`;
      if (i < nodes.length - 1) {
        currentDescription += ' -> ';
      }
    }
    
    steps.push({
      type: 'linkedList',
      nodes: JSON.parse(JSON.stringify(nodes)),
      description: currentDescription,
      current: 0,
      highlight: [0]
    });
    
    // 保存要移除的头节点值
    const removedValue = nodes[0].value;
    
    // 删除头节点
    nodes.shift();
    
    // 更新节点id和next指针
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].id = i;
      if (i < nodes.length - 1) {
        nodes[i].next = i + 1;
      } else {
        nodes[i].next = null;
      }
    }
    
    // 更新当前链表状态
    currentLinkedList = JSON.parse(JSON.stringify(nodes));
    
    // 描述删除操作
    let deleteDescription = `删除头节点 [${removedValue}]`;
    if (nodes.length > 0) {
      deleteDescription += ', 新的链表: ';
      for (let i = 0; i < nodes.length; i++) {
        deleteDescription += `[${nodes[i].value}]`;
        if (i < nodes.length - 1) {
          deleteDescription += ' -> ';
        }
      }
    } else {
      deleteDescription += ', 链表现在为空';
    }
    
    steps.push({
      type: 'linkedList',
      nodes: JSON.parse(JSON.stringify(nodes)),
      description: deleteDescription,
      current: nodes.length > 0 ? 0 : null,
      highlight: nodes.length > 0 ? [0] : []
    });
    
    return steps;
  }
  
  /**
   * 重置链表到初始状态
   * @returns {Array<Object>} 可视化步骤数组
   */
  function generateResetSteps() {
    // 重置为默认链表
    const defaultValues = [6, 1, 7, 4, 8];
    
    // 创建初始链表
    const nodes = defaultValues.map((val, i) => ({
      id: i,
      value: val,
      next: i < defaultValues.length - 1 ? i + 1 : null
    }));
    
    // 更新当前链表状态
    currentLinkedList = JSON.parse(JSON.stringify(nodes));
    
    const steps = [{
      type: 'linkedList',
      nodes: JSON.parse(JSON.stringify(nodes)),
      description: '链表已重置为初始状态',
      current: 0,
      highlight: [0]
    }];
    
    // 清除高亮
    steps.push({
      type: 'linkedList',
      nodes: JSON.parse(JSON.stringify(nodes)),
      description: '链表重置完成',
      current: null,
      highlight: []
    });
    
    return steps;
  }
  
  /**
   * 统一的链表操作函数，处理所有类型的操作
   * @param {string} operation 操作类型
   * @param {number} value 操作需要的值（如果适用）
   * @param {number} position 操作需要的位置（如果适用）
   * @returns {Array<Object>} 可视化步骤数组
   */
  function handleLinkedListOperation(operation, value, position) {
    console.log(`处理链表操作: ${operation}, 值: ${value}, 位置: ${position}`);
    
    let steps = [];
    
    // 根据操作类型调用相应的函数
    switch (operation) {
      case OPERATIONS.INIT:
        steps = generateInitSteps(value);
        break;
      case OPERATIONS.SEARCH:
      case 'find': // 兼容旧API
        steps = generateSearchSteps(value);
        break;
      case OPERATIONS.INSERT_HEAD:
      case 'push': // 兼容旧API
        steps = generateInsertHeadSteps(value);
        break;
      case OPERATIONS.INSERT_TAIL:
        steps = generateInsertTailSteps(value);
        break;
      case OPERATIONS.INSERT_AT:
        steps = generateInsertAtSteps(value, position);
        break;
      case OPERATIONS.REMOVE_HEAD:
      case 'pop': // 兼容旧API
        steps = generateRemoveHeadSteps();
        break;
      case OPERATIONS.REMOVE_TAIL:
        steps = generateRemoveTailSteps();
        break;
      case OPERATIONS.REMOVE_AT:
        steps = generateRemoveAtSteps(position);
        break;
      case OPERATIONS.RESET:
      case 'reset': // 兼容旧API
        steps = generateResetSteps();
        break;
      default:
        steps = [{
          type: 'linkedList',
          description: `不支持的操作: ${operation}`,
          current: null,
          highlight: []
        }];
    }
    
    return steps;
  }
  
  /**
   * UI层处理链表操作的函数，提供给前端调用
   * @param {string} action 操作类型
   * @param {number} value 操作值（如果适用）
   * @param {number} position 操作位置（如果适用）
   * @returns {Object} 包含步骤和操作信息的对象
   */
  function handleLinkedListActionUI(action, value, position) {
    console.log(`链表UI操作: ${action}, 值: ${value}, 位置: ${position}`);
    
    // 生成操作对应的步骤
    const steps = handleLinkedListOperation(action, value, position);
    
    // 生成操作描述信息
    let operationInfo = '';
    switch(action) {
      case OPERATIONS.SEARCH:
      case 'search':
      case 'find':
        operationInfo = `搜索值 ${value}`;
        break;
      case OPERATIONS.INSERT_HEAD:
      case 'insertHead':
      case 'push':
        operationInfo = `在头部插入节点 ${value}`;
        break;
      case OPERATIONS.INSERT_TAIL:
      case 'insertTail':
        operationInfo = `在尾部插入节点 ${value}`;
        break;
      case OPERATIONS.INSERT_AT:
      case 'insertAt':
        operationInfo = `在位置 ${position} 插入节点 ${value}`;
        break;
      case OPERATIONS.REMOVE_HEAD:
      case 'removeHead':
      case 'pop':
        operationInfo = '移除头部节点';
        break;
      case OPERATIONS.REMOVE_TAIL:
      case 'removeTail':
        operationInfo = '移除尾部节点';
        break;
      case OPERATIONS.REMOVE_AT:
      case 'removeAt':
        operationInfo = `移除位置 ${position} 的节点`;
        break;
      case OPERATIONS.RESET:
      case 'reset':
        operationInfo = '重置链表';
        break;
      default:
        operationInfo = `未知操作: ${action}`;
    }
    
    // 返回步骤和操作信息
    return {
      steps: steps,
      operationInfo: operationInfo
    };
  }
  
  // 将接口函数添加到全局对象
  VisualizationSteps.handleLinkedListOperation = handleLinkedListOperation;
  VisualizationSteps.handleLinkedListActionUI = handleLinkedListActionUI;
  VisualizationSteps.generateLinkedListSteps = generateInitSteps; // 兼容旧API
  
  // 导出操作类型常量
  VisualizationSteps.LINKED_LIST_OPERATIONS = OPERATIONS;
  
  // 确保将VisualizationSteps对象挂载到全局对象
  globalObject.VisualizationSteps = VisualizationSteps;
  
  // 如果是Node.js环境，则导出模块
  if (typeof module !== 'undefined' && module.exports) {
    // 导出所有需要的函数
    module.exports = {
      handleLinkedListOperation: handleLinkedListOperation,
      handleLinkedListActionUI: handleLinkedListActionUI,
      OPERATIONS: OPERATIONS
    };
  }
})(); 