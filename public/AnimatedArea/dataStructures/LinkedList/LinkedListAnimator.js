/**
 * 链表动画与可视化模块
 * 负责处理链表的绘制、动画及各种操作的可视化
 */

// 链表操作信息映射
const LINKED_LIST_OP_INFO = {
  'search': (value) => `搜索值 ${value}`,
  'insertHead': (value) => `在头部插入节点 ${value}`,
  'insertTail': (value) => `在尾部插入节点 ${value}`,
  'insertAt': (value, position) => `在位置 ${position} 插入节点 ${value}`,
  'removeHead': () => '移除头部节点',
  'removeTail': () => '移除尾部节点',
  'removeAt': (_, position) => `移除位置 ${position} 的节点`,
  'reset': () => '重置链表'
};

/**
 * 链表动画器类
 */
class LinkedListAnimator {
  /**
   * 创建链表动画器实例
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    // 保存配置
    this.options = options;
    
    // 初始化状态
    this.initialized = false;
    
    // 绑定方法
    this.initControls = this.initControls.bind(this);
    this.handleAction = this.handleAction.bind(this);
    this.getOperationInfo = this.getOperationInfo.bind(this);
  }

  /**
   * 初始化链表控件
   * @param {Object} app - Vue应用实例
   */
  initControls(app) {
    // 保存应用引用
    this.app = app;
    
    // 检查是否已初始化
    if (this.initialized) {
      // 确保输入框有默认值
      const inputElement = document.querySelector('.linkedlist-input');
      if (inputElement && inputElement.value === '') {
        inputElement.value = '42'; // 设置默认值
        console.log('链表输入框已设置默认值');
      }
      return;
    }

    console.log('初始化链表控制按钮');

    // 延迟初始化，确保DOM完全加载
    setTimeout(() => {
      // 获取输入框
      const inputElement = document.querySelector('.linkedlist-input');
      
      if (inputElement) {
        // 设置默认值
        if (!inputElement.value) {
          inputElement.value = '42';
        }
        console.log('链表输入框已设置默认值:', inputElement.value);
      } else {
        console.warn('找不到链表输入框元素，尝试稍后再初始化');
        // 再次尝试
        setTimeout(() => this.initControls(app), 1000);
        return;
      }

      // 搜索按钮
      const searchBtn = document.querySelector('.btn-search');
      if (searchBtn) {
        searchBtn.addEventListener('click', () => {
          if (!inputElement) {
            console.error('找不到输入框元素');
            app.writeToOutput('错误：找不到输入框元素');
            return;
          }

          console.log('输入框值：', inputElement.value);
          const value = inputElement.value !== '' ? parseInt(inputElement.value, 10) : 0;

          if (!isNaN(value)) {
            this.handleAction('search', value);
          } else {
            app.writeToOutput('请输入有效的数字进行搜索');
          }
        });
      }

      // 插入操作下拉菜单项
      const insertHeadBtn = document.querySelector('.dropdown-item[data-action="insertHead"]') ||
                           document.querySelector('.dropdown-item:contains("头部插入")');
      const insertTailBtn = document.querySelector('.dropdown-item[data-action="insertTail"]') ||
                           document.querySelector('.dropdown-item:contains("尾部插入")');
      const insertAtBtn = document.querySelector('.dropdown-item[data-action="insertAt"]') ||
                         document.querySelector('.dropdown-item:contains("指定位置插入")');

      if (insertHeadBtn) {
        insertHeadBtn.addEventListener('click', () => {
          if (!inputElement) {
            console.error('找不到输入框元素');
            app.writeToOutput('错误：找不到输入框元素');
            return;
          }

          console.log('头部插入输入框值：', inputElement.value);
          const value = inputElement.value !== '' ? parseInt(inputElement.value, 10) : 0;

          if (!isNaN(value)) {
            this.handleAction('insertHead', value);
          } else {
            app.writeToOutput('请输入有效的数字进行头部插入');
          }
        });
      }

      if (insertTailBtn) {
        insertTailBtn.addEventListener('click', () => {
          if (!inputElement) {
            console.error('找不到输入框元素');
            app.writeToOutput('错误：找不到输入框元素');
            return;
          }

          console.log('尾部插入输入框值：', inputElement.value);
          const value = inputElement.value !== '' ? parseInt(inputElement.value, 10) : 0;

          if (!isNaN(value)) {
            this.handleAction('insertTail', value);
          } else {
            app.writeToOutput('请输入有效的数字进行尾部插入');
          }
        });
      }

      if (insertAtBtn) {
        insertAtBtn.addEventListener('click', () => {
          if (!inputElement) {
            console.error('找不到输入框元素');
            app.writeToOutput('错误：找不到输入框元素');
            return;
          }

          console.log('指定位置插入输入框值：', inputElement.value);
          const value = inputElement.value !== '' ? parseInt(inputElement.value, 10) : 0;

          if (!isNaN(value)) {
            // 弹出对话框询问插入位置
            const position = prompt('请输入要插入的位置（索引从0开始）:');
            const posIndex = parseInt(position, 10);

            if (!isNaN(posIndex) && posIndex >= 0) {
              this.handleAction('insertAt', value, posIndex);
            } else {
              app.writeToOutput('请输入有效的位置进行插入');
            }
          } else {
            app.writeToOutput('请输入有效的数字和位置进行插入');
          }
        });
      }

      // 移除操作下拉菜单项
      const removeHeadBtn = document.querySelector('.dropdown-item[data-action="removeHead"]') ||
                           document.querySelector('.dropdown-item:contains("头部移除")');
      const removeTailBtn = document.querySelector('.dropdown-item[data-action="removeTail"]') ||
                           document.querySelector('.dropdown-item:contains("尾部移除")');
      const removeAtBtn = document.querySelector('.dropdown-item[data-action="removeAt"]') ||
                         document.querySelector('.dropdown-item:contains("指定位置移除")');

      if (removeHeadBtn) {
        removeHeadBtn.addEventListener('click', () => {
          this.handleAction('removeHead');
        });
      }

      if (removeTailBtn) {
        removeTailBtn.addEventListener('click', () => {
          this.handleAction('removeTail');
        });
      }

      if (removeAtBtn) {
        removeAtBtn.addEventListener('click', () => {
          // 弹出对话框询问删除位置
          const position = prompt('请输入要删除的位置（索引从0开始）:');
          const posIndex = parseInt(position, 10);

          if (!isNaN(posIndex) && posIndex >= 0) {
            this.handleAction('removeAt', null, posIndex);
          } else {
            app.writeToOutput('请输入有效的位置进行删除');
          }
        });
      }

      // 重置按钮
      const resetBtn = document.querySelector('.btn-reset');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          this.handleAction('reset');
        });
      }

      this.initialized = true;
    }, 500);
  }

  /**
   * 处理链表操作并更新动画
   * @param {string} action - 操作类型
   * @param {number} value - 操作值（如果适用）
   * @param {number} position - 操作位置（如果适用）
   */
  handleAction(action, value, position) {
    if (!this.app) {
      console.error('LinkedListAnimator未正确初始化，app引用缺失');
      return;
    }
    
    console.log("处理链表操作:", action, value, position);

    // 添加调试信息，检查输入值
    if (value !== undefined) {
      console.log(`输入值类型: ${typeof value}, 值: ${value}`);
      this.app.writeToOutput(`当前操作: ${action}, 输入值: ${value}`);
    } else {
      console.log('没有提供输入值');
      this.app.writeToOutput(`当前操作: ${action}, 没有输入值`);
    }

    // 检查可视化器是否已初始化
    if (!this.app.visualizer) {
      this.app.writeToOutput('错误：可视化器未初始化');
      return;
    }

    let steps = [];
    // 检查是否存在linkedList.js中的处理函数
    if (window.VisualizationSteps && typeof window.VisualizationSteps.handleLinkedListActionUI === 'function') {
      console.log('使用linkedList.js中的处理函数');

      try {
        // 调用linkedList.js中的函数处理链表操作
        const result = window.VisualizationSteps.handleLinkedListActionUI(action, value, position);
        console.log('链表操作结果:', result);

        if (result && result.steps && result.steps.length > 0) {
          // 更新动画步骤
          this.app.animationSteps = result.steps;
          this.app.currentAnimationStep = 0;
          this.app.isAnimationComplete = false;
          this.app.hasStarted = true; // 确保标记动画已开始

          // 更新输出信息
          if (result.operationInfo) {
            this.app.writeToOutput(`链表操作: ${result.operationInfo}`);
          }

          // 开始播放第一步
          this.app.isPlaying = true;
          this.app.isPaused = false;

          // 确保可视化器已准备好
          if (this.app.visualizer) {
            // 重置可视化器状态
            this.app.visualizer.animationState.type = 'linkedList';
            // 强制重绘一次
            this.app.visualizer.drawVisualization();
            // 播放第一步
            this.app.playNextStep();
          } else {
            console.error('可视化器未初始化');
            this.app.writeToOutput('错误：可视化器未初始化');
          }
        } else {
          console.error('未生成有效的步骤', result);
          this.app.writeToOutput(`链表操作失败: 未生成有效的步骤`);
        }
      } catch (error) {
        console.error('处理链表操作时出错:', error);
        this.app.writeToOutput(`链表操作错误: ${error.message || '未知错误'}`);
      }
    } else {
      console.log('未找到链表操作处理函数，使用visualizer内置方法');

      try {
        // 使用visualizer内置方法生成步骤
        let steps;
        if (typeof this.app.visualizer.generateSteps === 'function') {
          steps = this.app.visualizer.generateSteps('linkedList', {
            operation: action,
            value: value,
            position: position
          });
        } else if (typeof this.app.visualizer.generateLinkedListSteps === 'function') {
          steps = this.app.visualizer.generateLinkedListSteps(action, value, position);
        }

        console.log('生成的链表步骤:', steps);

        if (steps && steps.length > 0) {
          // 保存步骤并开始播放
          this.app.animationSteps = steps;
          this.app.currentAnimationStep = 0;
          this.app.isAnimationComplete = false;
          this.app.hasStarted = true; // 确保标记动画已开始

          // 输出操作信息
          const operationInfo = this.getOperationInfo(action, value, position);
          this.app.writeToOutput(`链表操作: ${operationInfo}`);

          // 开始播放第一步
          this.app.isPlaying = true;
          this.app.isPaused = false;

          // 确保可视化器已准备好
          if (this.app.visualizer) {
            // 重置可视化器状态
            this.app.visualizer.animationState.type = 'linkedList';
            // 强制重绘一次
            this.app.visualizer.drawVisualization();
            // 播放第一步
            this.app.playNextStep();
          }
        } else {
          console.error('未生成有效的步骤');
          this.app.writeToOutput(`链表操作失败: 未生成有效的步骤`);
        }
      } catch (error) {
        console.error('生成链表步骤时出错:', error);
        this.app.writeToOutput(`链表操作错误: ${error.message || '未知错误'}`);
      }
    }
  }

  /**
   * 获取链表操作的描述信息
   * @param {string} action - 操作类型
   * @param {*} value - 操作值
   * @param {number} position - 操作位置
   * @returns {string} 操作的描述信息
   */
  getOperationInfo(action, value, position) {
    return LINKED_LIST_OP_INFO[action] ? 
      LINKED_LIST_OP_INFO[action](value, position) : 
      `未知操作 ${action}`;
  }
}

// 创建全局实例方便访问
window.linkedListAnimator = new LinkedListAnimator();

// 导出类用于直接引用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LinkedListAnimator;
} 