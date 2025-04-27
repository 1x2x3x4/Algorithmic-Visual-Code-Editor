// 创建算法类型映射对象
const ALG_TYPE = {
  // 排序算法
  'bubbleSort': 'sort',
  'selectionSort': 'sort',
  'insertionSort': 'sort',
  'quickSort': 'sort',
  'heapSort': 'sort',
  'mergeSort': 'sort',
  'radixSort': 'sort',
  'bucketSort': 'sort',
  'countingSort': 'sort',
  
  // 数据结构
  'linkedList': 'dataStructure',
  'binaryTree': 'dataStructure',
  'stack': 'dataStructure',
  'queue': 'dataStructure'
};

// 文档路径映射对象
const DOC_PATH_MAP = {
  // 排序算法
  'bubbleSort': '/AnimatedArea/sorting/BubbleSort/README.md',
  'selectionSort': '/AnimatedArea/sorting/SelectionSort/README.md',
  'insertionSort': '/AnimatedArea/sorting/InsertionSort/README.md',
  'quickSort': '/AnimatedArea/sorting/QuickSort/README.md',
  'heapSort': '/AnimatedArea/sorting/HeapSort/README.md',
  'mergeSort': '/AnimatedArea/sorting/MergeSort/README.md',
  'radixSort': '/AnimatedArea/sorting/RadixSort/README.md',
  'bucketSort': '/AnimatedArea/sorting/BucketSort/README.md',
  'countingSort': '/AnimatedArea/sorting/CountingSort/README.md',

  // 数据结构
  'linkedList': '/AnimatedArea/dataStructures/LinkedList/README.md',
  'binaryTree': '/AnimatedArea/dataStructures/BinaryTree/README.md',
  'stack': '/AnimatedArea/dataStructures/Stack/README.md',
  'queue': '/AnimatedArea/dataStructures/Queue/README.md'
};

// 算法示例数组生成策略映射
const ALG_ARRAY_GENERATOR = {
  'linkedList': () => [1, 2, 3, 4, 5], // 与C语言链表示例一致
  'binaryTree': () => [1, 2, 3, 4, 5, 6, 7], // 完全二叉树结构
  'bubbleSort': (basicSize = 10, maxValue = 100) => 
    Array.from({ length: basicSize }, () => Math.floor(Math.random() * (maxValue - 5) + 5)),
  'selectionSort': (basicSize = 10, maxValue = 100) => 
    Array.from({ length: basicSize }, () => Math.floor(Math.random() * (maxValue - 5) + 5)),
  'insertionSort': (basicSize = 10, maxValue = 100) => {
    const partialSorted = Array.from({ length: Math.floor(basicSize/2) }, (_, i) => i * 5 + 5);
    const randomPart = Array.from({ length: Math.ceil(basicSize/2) }, () => 
      Math.floor(Math.random() * maxValue + 5));
    return [...partialSorted, ...randomPart];
  },
  'quickSort': (basicSize = 10, maxValue = 100) => 
    Array.from({ length: basicSize + 2 }, () => Math.floor(Math.random() * maxValue + 5)),
  'mergeSort': (basicSize = 10, maxValue = 100) => 
    Array.from({ length: basicSize + 2 }, () => Math.floor(Math.random() * maxValue + 5)),
  'radixSort': (basicSize = 10) => 
    Array.from({ length: basicSize }, () => Math.floor(Math.random() * 900 + 10)), // 10-909范围内的数字
  'heapSort': (basicSize = 10, maxValue = 100) => {
    const heap = [];
    for (let i = 1; i <= basicSize; i++) {
      // 确保父节点大于子节点的概率较高
      const val = i <= basicSize/3 ? 
        Math.floor(Math.random() * (maxValue - 30) + 30) : 
        Math.floor(Math.random() * 30 + 5);
      heap.push(val);
    }
    return heap;
  },
  'stack': (basicSize = 6) => Array.from({ length: basicSize }, (_, i) => i * 10 + 10),
  'queue': (basicSize = 6) => Array.from({ length: basicSize }, (_, i) => i * 10 + 10)
};

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

// 首字母大写工具函数
const upperFirst = (str) => str.charAt(0).toUpperCase() + str.slice(1);

// 创建WebSocket连接
let socket = null;
try {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host; // 自动获取当前域名和端口
  socket = new WebSocket(`${protocol}//${host}`);

  socket.onopen = () => {
    console.log('WebSocket连接已建立');
  };

  socket.onerror = (error) => {
    console.error('WebSocket错误:', error);
  };

  socket.onclose = () => {
    socket = null;
  };
} catch (e) {
  console.error('WebSocket连接失败');
  socket = null;
}

// 确保安全访问socket
function safeSocketSend(data) {
  try {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
      return true;
    }
    return false;
  } catch (e) {
    console.error('发送WebSocket消息失败');
    return false;
  }
}

// 跟踪初始化状态
const appState = {
  vueReady: false,
  terminalReady: false,
  editorReady: false
};

// 错误处理中心
function handleError(error, options = {}) {
  // 默认选项
  const opts = {
    logToConsole: true,
    showToUser: true,
    type: 'general',
    attempt: 0,
    container: '.visualization-area',
    ...options
  };

  // 提取错误消息
  const errorMessage = error instanceof Error ? error.message : String(error);

  // 记录到控制台
  if (opts.logToConsole) {
    console.error(`[${opts.type}]: ${errorMessage}`);
  }

  // 显示给用户
  if (opts.showToUser) {
    if (opts.type === 'visualization') {
      const container = document.querySelector(opts.container);
      if (container) {
        container.innerHTML = `<div class="error-message" style="color: red; padding: 20px; text-align: center;">${errorMessage}</div>`;
      }
    } else if (window.app && typeof window.app.writeToOutput === 'function') {
        window.app.writeToOutput(`错误: ${errorMessage}`);
    }
  }

  // 根据错误类型执行相应操作
  switch (opts.type) {
    case 'visualization':
      if (opts.attempt < 3 && window.app && typeof window.app.retryVisualizerInit === 'function') {
          setTimeout(() => window.app.retryVisualizerInit(opts.attempt + 1), 500 * (opts.attempt + 1));
      }
      break;
    case 'connection':
      if (opts.attempt < 3 && window.app && typeof window.app.attemptReconnect === 'function') {
          window.app.attemptReconnect(opts.attempt + 1);
      }
      break;
  }

  return errorMessage;
}

// 确保在Vue实例创建之前检查终端是否已加载
document.addEventListener('DOMContentLoaded', () => {
  // 检查终端是否已加载
  if (window.terminalUtils) {
    appState.terminalReady = true;
  }

  // 加载代码示例
  let codeExamples = {};
  if (typeof window.algorithmCodeExamples !== 'undefined') {
    codeExamples = window.algorithmCodeExamples;
  }

  // 监听编辑器就绪事件
  window.addEventListener('editor-ready', () => {
    appState.editorReady = true;
  });

  // 初始化Vue应用
  new Vue({
    el: '#app',
    data: {
      // 编辑器设置
      editorSettings: {
        language: 'c',
        theme: 'vs'
      },
      code: '', // 当前编辑器代码
      activeOutputTab: 'terminal',    // 当前活动的输出标签页
      output: '',
      // 问题筛选器
      problemsFilter: '',
      // 算法选项
      algorithms: {
        '排序算法': [
          { id: 'bubbleSort', name: '冒泡排序' },
          { id: 'selectionSort', name: '选择排序' },
          { id: 'insertionSort', name: '插入排序' },
          { id: 'quickSort', name: '快速排序' },
          { id: 'heapSort', name: '堆排序' },
          { id: 'mergeSort', name: '归并排序' },
          { id: 'radixSort', name: '基数排序' },
          { id: 'bucketSort', name: '桶排序' },
         // { id: 'countingSort', name: '计数排序' }
        ],
       // '数据结构': [
       //   { id: 'linkedList', name: '链表' },
       //   { id: 'binaryTree', name: '二叉树' },
       //   { id: 'stack', name: '栈' }
       // ]
      },
      foldedCategories: [], // 存储已折叠的分类
      selectedAlgorithm: null,
      visualizer: null,
      animationSpeed: '1.0', // 修改为字符串类型以匹配select的值
      hasStarted: false,
      isPlaying: false,
      isPaused: false, // 添加暂停状态
      progress: 0,
      sortArray: [38, 27, 43, 3, 9, 82, 10],
      currentAnimationStep: 0, // 添加当前动画步骤索引
      animationSteps: [], // 保存所有动画步骤
      stepInterval: null, // 控制步骤间隔
      isStepMode: false,  // 新增：标记是否处于步进模式
      isAnimationComplete: false, // 新增：标记动画是否已完成
      isDraggingProgress: false, // 新增：标记是否正在拖动进度条
      // 文件标签相关数据
      fileTabs: [
        { id: 1, name: '示例代码', icon: 'js-icon', content: '', active: true },
        { id: 2, name: '算法文档', icon: 'html-icon', content: '', active: false }
      ],
      activeFileTab: 1, // 当前活动的文件标签ID
      // 使用外部加载的代码示例
      algorithmCodeExamples: typeof window.algorithmCodeExamples !== 'undefined' ? window.algorithmCodeExamples : {},
      isPanelVisible: true,
      isPanelMaximized: false,
      isScrollLocked: false,
      isOutputScrollLocked: false, // 添加输出滚动锁定属性
      terminals: [
        { id: 1, name: '终端 1', active: true }
      ],
      problems: [
        // 示例问题数据
        { severity: 'error', message: '未定义的变量 "foo"', file: 'script.js', line: 15 },
        { severity: 'warning', message: '未使用的变量 "bar"', file: 'script.js', line: 23 }
      ],
      // 编辑器实例
      editorManager: null,
      isEditorReady: false,
      // 终端和Socket引用
      terminal: null,
      socket: socket,
      // 调试相关状态
      isDebugging: false,
      debugState: '',  // running, paused, stopped
      debugLine: 0,
      debugMessages: [],
      breakpoints: [],
      // 步骤记录系统
      stepOutputHistory: [], // 存储每个步骤的输出历史
      currentOutputSnapshot: '', // 当前输出的快照
    },
    computed: {
      // ... existing code ...
    },
    watch: {
      // 监听筛选器变化，过滤问题列表
      problemsFilter: function(newVal) {
        // 如果终端API存在，调用其筛选功能
        if (window.terminalAPI && typeof window.terminalAPI.filterProblems === 'function') {
          window.terminalAPI.filterProblems(newVal);
        }
      },

      // 监听编辑器设置变化
      'editorSettings.language': function(newVal) {
        if (this.editorManager) {
          this.editorManager.setLanguage(newVal);
        }
      },
      'editorSettings.theme': function(newVal) {
        if (this.editorManager) {
          this.editorManager.setTheme(newVal);
        }
      }
    },
    mounted() {
      // 将Vue实例设置到全局变量以便其他模块访问
      window.app = this;

      // 从本地存储加载用户的主题偏好
      const savedTheme = localStorage.getItem('preferred-theme');
      if (savedTheme) {
        // 设置编辑器主题
        this.editorSettings.theme = savedTheme;
        // 应用主题到整个页面
        this.changeEditorTheme(savedTheme);
      }

      // 添加调整大小事件监听器
      window.addEventListener('resize', this.handleResize);

      // 初始化可视化器
      this.initVisualizer();

      // 检查编辑器管理器是否已存在（如果编辑器在Vue前初始化）
      if (window.editorManager) {
        console.log('编辑器管理器已存在，直接使用');
        this.editorManager = window.editorManager;
        this.isEditorReady = true;

        // 连接到Vue应用
        this.editorManager.connectToVueApp(this);
      }

      // 处理编辑器就绪事件
      window.addEventListener('editor-ready', () => {
        console.log('编辑器就绪');
        this.isEditorReady = true;
        this.editorManager = window.editorManager;

        // 初始化终端
        if (!this.terminal) {
          // 检查终端API的可用性
          if (window.terminalAPI && typeof window.terminalAPI.init === 'function') {
            try {
              // 使用API初始化终端
              this.terminal = window.terminalAPI.init(this);
              console.log('终端已通过API初始化');
            } catch (err) {
              console.error('终端初始化失败:', err);
              // 备用方案：直接使用全局终端对象
              this.terminal = window.terminal || null;
            }
          } else {
            // 使用全局终端对象
            console.warn('terminalAPI.init未定义，使用备用方案');
            this.terminal = window.terminal || null;
          }
        }

        // 连接编辑器到Vue实例
        if (this.editorManager) {
          this.editorManager.connectToVueApp(this);
        }
      });

      // 正常情况下WebSocket应该在HTML页面加载过程中已经初始化
      // 在这里我们检查WebSocket的状态并确保连接正常
      this.checkWebSocketConnection();

      // 检查初始化选中的算法
      if (this.selectedAlgorithm) {
        this.resetVisualization();
      }

      // 添加对键盘快捷键的支持
      window.addEventListener('keydown', this.handleKeydown);

      // 同步终端状态 - 使用迁移后的接口
      this.$nextTick(() => {
        if (window.syncTerminalState) {
          window.syncTerminalState(this);
        }
      });

      // 初始化后延迟调整图例布局并强制重新调整画布大小
      this.$nextTick(() => {
        setTimeout(() => {
          this.adjustLegendLayout();
          // 强制调整画布大小
          if (this.visualizer) {
            this.visualizer.resizeCanvas();
            // 200ms后再次调整以确保DOM完全渲染
            setTimeout(() => {
              this.visualizer.resizeCanvas();
            }, 200);
          }
        }, 300);
      });

      // 初始化后强制适应容器
      this.$nextTick(() => {
        setTimeout(() => {
          this.adjustLegendLayout();
          this.forceFitCanvas();
        }, 300);
      });

      // 初始化链表交互控制按钮
      this.$nextTick(() => {
        this.initLinkedListControls();
      });
    },
    beforeDestroy() {
      // 移除事件监听器
      window.removeEventListener('resize', this.handleResize);
      document.removeEventListener('keydown', this.handleKeydown);

      // 停止所有动画计时器
      this.stopAllAnimationTimers();

      // 清理可视化器
      if (this.visualizer) {
        this.visualizer.destroy();
      }

      // 关闭WebSocket连接
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.close();
      }

      // 销毁编辑器实例
      if (this.editorManager) {
        this.editorManager.destroy();
      }
    },
    methods: {
      // 面板控制方法
      toggleMaximizePanel() {
        if (window.terminalAPI && typeof window.terminalAPI.toggleMaximizePanel === 'function') {
          window.terminalAPI.toggleMaximizePanel();
        } else {
          console.error('terminalAPI.toggleMaximizePanel 未定义');
        }
      },

      // 切换输出标签页
      switchTab(tabName) {
        this.activeOutputTab = tabName;

        // 更新UI显示
        this.$nextTick(() => {
          console.log('切换到标签页:', tabName);

          // 获取所有内容面板
          const allPanels = document.querySelectorAll('.content-panel');

          // 移除所有面板的active类
          allPanels.forEach(panel => {
            panel.classList.remove('active');
            panel.style.display = 'none';
          });

          // 根据当前标签找到对应面板
          let targetPanel = null;

          if (tabName === 'terminal') {
            targetPanel = document.querySelector('#terminal-container');
          } else if (tabName === 'result') {
            targetPanel = document.querySelector('.output-panel');
          } else if (tabName === 'problems') {
            targetPanel = document.querySelector('.problems-panel');
          } else if (tabName === 'debug') {
            targetPanel = document.querySelector('.debug-panel');
          }

          // 激活目标面板
          if (targetPanel) {
            targetPanel.classList.add('active');
            if (tabName === 'terminal') {
              targetPanel.style.display = 'block';
            } else {
              targetPanel.style.display = 'flex';
            }
          }

          // 同步到终端模块
          if (window.syncTerminalState) {
            window.syncTerminalState(this);
          }

          // 调整终端大小（如果切换到终端标签）
          if (tabName === 'terminal' && window.terminalAPI && window.terminalAPI.refreshLayout) {
            window.terminalAPI.refreshLayout();
          }

          // 更新输出内容（如果切换到输出标签）
          if (tabName === 'result' && window.terminalAPI && window.terminalAPI.updateOutputContent) {
            window.terminalAPI.updateOutputContent();
          }
        });
      },

      // 更改编辑器语言
      changeEditorLanguage(language) {
        this.editorSettings.language = language;
      },

      // 更新编辑器主题并同时更新页面主题
      changeEditorTheme(theme) {
        editorSettings.theme = theme;
        
        // 移除现有的主题类
        document.body.classList.remove('dark-theme', 'light-theme', 'high-contrast-theme');
        
        // 添加新的主题类
        if (theme === 'vs-dark') {
          document.body.classList.add('dark-theme');
        } else if (theme === 'vs') {
          document.body.classList.add('light-theme');
        } else if (theme === 'hc-black') {
          document.body.classList.add('high-contrast-theme');
        }
        
        // 将用户主题保存到本地存储
        localStorage.setItem('userTheme', theme);
        
        // 更新下拉菜单的值
        this.$nextTick(() => {
          const themeSelector = document.getElementById('theme-selector');
          if (themeSelector) {
            themeSelector.value = theme;
          }
        });
        
        // 如果编辑器存在，设置主题
        if (editorManager && editorManager.codeEditor) {
          editorManager.setTheme(theme);
        }
      },

      // 运行代码
      runCode() {
        if (!this.editorManager) {
          console.error('编辑器尚未初始化');
          return;
        }

        // 获取编辑器中的代码
        const code = this.editorManager.getValue();
        this.code = code; // 更新Vue的code属性

        // 清空输出
        this.clearOutput();
        this.writeToOutput('正在运行代码...');

        // 尝试通过WebSocket发送代码
        const language = this.editorSettings.language;
        const data = {
          type: 'runCode',
          code: code,
          language: language
        };

        // 使用安全发送函数
        if (safeSocketSend(data)) {
          console.log('通过WebSocket发送代码成功');
          // 不立即切换标签页，等待响应后再切换
        } else {
          // WebSocket不可用，使用HTTP请求
          this.writeToOutput('WebSocket连接不可用，尝试使用HTTP请求...');

          // 切换到输出标签页以显示结果
          this.switchTab('result');

          fetch('/run', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              code: code,
              language: language
            })
          })
          .then(response => response.json())
          .then(data => {
            if (data.output) {
              this.writeToOutput(data.output);
            } else {
              this.writeToOutput('执行完成，但没有输出');
            }
          })
          .catch(error => {
            console.error('HTTP请求出错:', error);
            this.writeToOutput('执行代码失败: ' + error.message);
          });
        }
      },

      // 强制刷新画布尺寸
      forceResizeCanvas() {
        const container = document.querySelector('.visualization-area');
        if (!container || !this.visualizer) return;

        const containerStyle = window.getComputedStyle(container);
        const containerWidth = parseInt(containerStyle.width) || 600;
        const containerHeight = parseInt(containerStyle.height) || 400;

        // 获取图例高度
        const legendElement = container.querySelector('.legend');
        let legendHeight = 0;
        if (legendElement) {
            const legendStyle = window.getComputedStyle(legendElement);
            legendHeight = legendElement.offsetHeight +
                parseInt(legendStyle.marginTop || 0) +
                parseInt(legendStyle.marginBottom || 0);
        }

        // 计算可用空间
        const availableWidth = containerWidth;
        const maxCanvasHeight = containerHeight - legendHeight;
        const availableHeight = maxCanvasHeight > 0 ? maxCanvasHeight : containerHeight * 0.75;

        // 调用visualizer的resizeCanvas方法
        this.visualizer.resizeCanvas(availableWidth, availableHeight);
      },

      // 初始化可视化器
      initVisualizer() {
        // 检查全局加载状态变量
        if (window.visualizerScriptsStatus && window.visualizerScriptsStatus.loaded) {
          // 脚本已加载完成，直接初始化
          this._doInitializeVisualizer();
        } else {
          // 脚本正在加载，等待加载完成事件
          console.log('可视化器脚本尚未加载完成，等待加载...');

          // 添加事件监听 - 针对脚本加载完成事件
          window.addEventListener('visualizer-loaded', () => {
            console.log('检测到可视化器脚本加载完成事件，开始初始化');
            this._doInitializeVisualizer();
          }, { once: true });

          // 添加事件监听 - 针对类定义完成事件
          window.addEventListener('algorithm-visualizer-defined', () => {
            console.log('检测到AlgorithmVisualizer类定义完成事件，开始初始化');
            this._doInitializeVisualizer();
          }, { once: true });

          // 设置超时检查（以防事件未触发）
          setTimeout(() => {
            if (!this.visualizer && typeof AlgorithmVisualizer !== 'undefined') {
              console.log('通过超时检查发现可视化器已可用，开始初始化');
              this._doInitializeVisualizer();
            }
          }, 2000);
        }
      },

      // 实际执行可视化器初始化
      _doInitializeVisualizer() {
        Vue.nextTick(() => {
          try {
            const canvasElement = document.getElementById('algorithmCanvas');
            if (canvasElement) {
              try {
                if (canvasElement.getContext) {
                  const ctx = canvasElement.getContext('2d');
                  if (ctx) {
                    // 创建初始画布（显示提示而非图形）
                    ctx.fillStyle = '#f8f8f8';
                    ctx.fillRect(0, 0, canvasElement.width, canvasElement.height);
                    ctx.fillStyle = '#666666';
                    ctx.font = '16px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('请选择算法', canvasElement.width/2, canvasElement.height/2);

                    // 检查AlgorithmVisualizer类是否已定义
                    if (typeof AlgorithmVisualizer !== 'undefined') {
                      // 初始化可视化器
                      this.visualizer = new AlgorithmVisualizer('algorithmCanvas');
                      console.log('可视化器初始化成功');

                      // 只在选择了算法时才初始化默认数据
                      if (this.selectedAlgorithm && this.sortArray && this.sortArray.length > 0) {
                        this.visualizer.resetAnimationState(this.sortArray);

                        // 特殊处理计数排序
                        if (this.selectedAlgorithm === 'countingSort') {
                          this.visualizer.animationState.type = 'sorting';
                          this.visualizer.animationState.countingArray = [];
                          this.visualizer.animationState.outputArray = [];
                          this.visualizer.animationState.phase = 'init';
                        }
                      }
                      // 如果选择了链表或二叉树，特殊处理初始化
                      else if (this.selectedAlgorithm === 'linkedList' || this.selectedAlgorithm === 'binaryTree') {
                        console.log(`可视化器初始化: 设置${this.selectedAlgorithm}类型视图`);
                        // 设置正确的算法类型
                        this.visualizer.animationState.type = this.selectedAlgorithm;

                        // 清除排序相关数据
                        this.visualizer.animationState.currentArray = [];
                        this.visualizer.animationState.comparing = [];
                        this.visualizer.animationState.swapping = [];
                        this.visualizer.animationState.sorted = [];

                        // 设置类型特定的初始化数据
                        if (this.selectedAlgorithm === 'linkedList') {
                          this.visualizer.animationState.nodes = [];
                          this.visualizer.animationState.current = null;
                          this.visualizer.animationState.highlight = [];
                          this.visualizer.animationState.description = '选择链表算法，点击开始按钮查看演示';
                        } else {
                          this.visualizer.animationState.tree = null;
                          this.visualizer.animationState.current = null;
                          this.visualizer.animationState.highlight = [];
                          this.visualizer.animationState.path = [];
                          this.visualizer.animationState.description = '选择二叉树算法，点击开始按钮查看演示';
                        }

                        // 强制立即绘制正确的视图
                        this.visualizer.drawVisualization();
                      }

                      // 强制刷新画布尺寸
                      this.forceResizeCanvas();

                      // 不再强制Canvas占满容器
                      // this.forceFitCanvas();
                    } else {
                      console.error('AlgorithmVisualizer类未定义，无法初始化可视化器');
                      // 显示错误消息
                      ctx.fillStyle = '#ffeeee';
                      ctx.fillRect(0, 0, canvasElement.width, canvasElement.height);
                      ctx.fillStyle = '#cc0000';
                      ctx.font = '16px Arial';
                      ctx.textAlign = 'center';
                      ctx.fillText('可视化器加载失败，请刷新页面重试', canvasElement.width/2, canvasElement.height/2);
                    }
                  } else {
                    console.error('无法获取canvas上下文');
                  }
                } else {
                  console.error('canvas元素不支持getContext方法');
                }
              } catch (error) {
                console.error('可视化器初始化失败:', error);
                // 延迟再次尝试
                this.retryVisualizerInit(1);
              }
            } else {
              console.warn('找不到canvas元素，可视化器初始化延迟');
              // 尝试创建canvas元素
              this.createCanvasElement();
              // 稍后再尝试初始化
              this.retryVisualizerInit(1);
            }
          } catch (error) {
            console.error('可视化器初始化过程发生错误:', error);
          }
        });
      },

      // 新增方法：创建canvas元素（如果不存在）
      createCanvasElement() {
        const container = document.querySelector('.visualization-area');
        if (!container) {
          console.error('找不到可视化区域容器');
          return;
        }

        // 检查是否已经存在canvas元素
        if (document.getElementById('algorithmCanvas')) {
          console.log('canvas元素已存在');
          return;
        }

        console.log('创建新的canvas元素');
        const canvas = document.createElement('canvas');
        canvas.id = 'algorithmCanvas';

        // 获取容器尺寸
        const containerHeight = container.clientHeight || 400;
        const legendElement = container.querySelector('.legend');
        const legendHeight = legendElement ? legendElement.offsetHeight + 10 : 0;

        // 初始尺寸设置
        canvas.width = container.clientWidth || 600;
        canvas.height = containerHeight - legendHeight;

        // 确保canvas占满整个可用空间
        canvas.style.border = '1px solid #ddd';
        canvas.style.display = 'block';
        canvas.style.margin = '0';
        canvas.style.padding = '0';
        canvas.style.width = '600px';
        canvas.style.height = '400px';
        canvas.style.boxSizing = 'border-box';
        canvas.style.minHeight = '0';

        // 清除容器内容并添加canvas
        container.innerHTML = '';
        container.appendChild(canvas);

        // 添加初始提示文字，不显示图形
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#f8f8f8';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#666666';
          ctx.font = '16px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('请选择算法', canvas.width/2, canvas.height/2);
        }
      },

      // 重试初始化可视化器（最多尝试3次）
      retryVisualizerInit(attempt) {
        if (attempt > 3) {
          console.warn('多次尝试初始化可视化器失败，放弃初始化');
          this.showErrorMessage('可视化器初始化失败，请刷新页面重试');
          return;
        }

        console.log(`尝试第${attempt}次初始化可视化器...`);

        // 检查脚本加载状态
        if (this.checkScriptLoading()) return;

        setTimeout(() => this.initializeCanvas(attempt), 500 * attempt);
      },

      // 显示错误信息 - 更新为使用中心错误处理函数
      showErrorMessage(message) {
        handleError(message, {type: 'visualization', container: '.visualization-area'});
      },

      // 检查脚本加载状态
      checkScriptLoading() {
        if (window.visualizerScriptsStatus && !window.visualizerScriptsStatus.loaded) {
          console.log('等待可视化器脚本加载...');
          window.addEventListener('visualizer-loaded', () => {
            console.log('检测到可视化器脚本已加载，再次尝试初始化');
            this.retryVisualizerInit(1);
          }, { once: true });
          return true;
        }
        return false;
      },

      // 初始化画布 - 更新错误处理
      initializeCanvas(attempt) {
        const canvas = document.getElementById('algorithmCanvas');
        if (!canvas) {
          console.warn(`第${attempt}次尝试，仍找不到canvas元素`);
          this.createCanvasElement();
          this.retryVisualizerInit(attempt + 1);
          return;
        }

        try {
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('无法获取canvas上下文');
          }

          // 清空并绘制初始状态
          this.drawInitialState(canvas, ctx, attempt);

          // 初始化可视化器
          if (typeof AlgorithmVisualizer !== 'undefined') {
            this.initializeVisualizer(canvas);
          } else {
            this.handleVisualizerNotDefined(canvas, ctx, attempt);
          }
        } catch (error) {
          handleError(error, {
            type: 'visualization',
            attempt: attempt,
            container: '.visualization-area'
          });
        }
      },

      // 绘制初始状态
      drawInitialState(canvas, ctx, attempt) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = this.selectedAlgorithm ? '#f0f0f0' : '#f8f8f8';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = this.selectedAlgorithm ? '#0078d4' : '#666666';
        ctx.fillText(
          this.selectedAlgorithm ?
          `正在尝试第${attempt}次初始化...` :
          '请选择算法',
          canvas.width/2,
          canvas.height/2
        );
      },

      // 初始化可视化器
      initializeVisualizer(canvas) {
        this.visualizer = new AlgorithmVisualizer('algorithmCanvas');
        console.log('可视化器延迟初始化成功');

        if (this.selectedAlgorithm === 'linkedList' || this.selectedAlgorithm === 'binaryTree') {
          this.initializeDataStructure();
        } else if (this.selectedAlgorithm && this.sortArray?.length > 0) {
          this.visualizer.resetAnimationState(this.sortArray);
        }
      },

      // 初始化数据结构
      initializeDataStructure() {
        console.log(`初始化: 设置${this.selectedAlgorithm}类型视图`);

        if (!this.visualizer || !this.visualizer.animationState) {
          console.error('可视化器未初始化或状态不可用');
          this.writeToOutput('错误: 可视化器未初始化');
          return;
        }

        const state = this.visualizer.animationState;

        // 重置基本状态
        state.type = this.selectedAlgorithm;
        state.currentArray = [];
        state.comparing = [];
        state.swapping = [];
        state.sorted = [];
        state.current = null;
        state.highlight = [];

        // 设置特定类型的状态
        if (this.selectedAlgorithm === 'linkedList') {
          // 初始化链表示例数据
          state.nodes = [
            { id: 0, value: 10, next: 1 },
            { id: 1, value: 20, next: 2 },
            { id: 2, value: 30, next: 3 },
            { id: 3, value: 40, next: null }
          ];
          state.description = '链表已初始化，请使用上方的链表操作按钮进行交互';

          // 重置动画步骤
          this.animationSteps = [];
          this.currentAnimationStep = 0;
          this.isAnimationComplete = false;

          // 如果有VisualizationSteps对象，使用它初始化链表
          if (window.VisualizationSteps && typeof window.VisualizationSteps.handleLinkedListOperation === 'function') {
            try {
              const initSteps = window.VisualizationSteps.handleLinkedListOperation('init');
              if (initSteps && initSteps.length > 0) {
                this.animationSteps = initSteps;
                // 应用第一步初始化状态
                if (initSteps[0].nodes) {
                  state.nodes = initSteps[0].nodes;
                }
              }
            } catch (error) {
              console.error('初始化链表时出错:', error);
            }
          }
        } else {
          state.tree = null;
          state.path = [];
          state.description = '选择二叉树算法，点击开始按钮查看演示';
        }

        // 绘制初始状态
        this.visualizer.drawVisualization();

        // 输出初始化消息
        if (this.selectedAlgorithm === 'linkedList') {
          this.writeToOutput('链表已初始化，请使用上方的链表操作按钮进行交互');
        }
      },

      // 处理可视化器未定义的情况
      handleVisualizerNotDefined(canvas, ctx, attempt) {
        console.error('AlgorithmVisualizer类仍未定义，继续重试');
        ctx.fillStyle = '#f9f9e0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#666666';
        ctx.fillText('等待可视化器加载...', canvas.width/2, canvas.height/2);
        this.retryVisualizerInit(attempt + 1);
      },

      // 选择算法
      selectAlgorithm(algorithmId) {
        if (this.selectedAlgorithm === algorithmId) return;

        console.log(`选择算法: ${algorithmId}`);

        // 如果已经有可视化在运行，先取消它
        if (this.selectedAlgorithm) {
          this.cancelCurrentVisualization();
        }

        // 设置选中的算法
        this.selectedAlgorithm = algorithmId;

        // 加载算法文档
        this.loadAlgorithmDocumentation(algorithmId);

        // 切换到文档标签
        this.switchFileTab(2);

        // 如果是链表或二叉树算法，立即初始化对应视图类型
        if (algorithmId === 'linkedList' || algorithmId === 'binaryTree') {
          console.log(`立即初始化${algorithmId}视图类型`);
          if (this.visualizer) {
            // 确保animationState已初始化
            if (!this.visualizer.animationState) {
              this.visualizer.animationState = this.visualizer.getInitialState();
            }

            // 设置正确的算法类型
            this.visualizer.animationState.type = algorithmId;

            // 清除排序算法相关数据
            this.visualizer.animationState.currentArray = [];
            this.visualizer.animationState.comparing = [];
            this.visualizer.animationState.swapping = [];
            this.visualizer.animationState.sorted = [];

            // 设置类型特定的初始化数据
            if (algorithmId === 'linkedList') {
              this.visualizer.animationState.nodes = [];
              this.visualizer.animationState.current = null;
              this.visualizer.animationState.highlight = [];
              this.visualizer.animationState.description = '选择链表算法，点击开始按钮查看演示';
            } else {
              this.visualizer.animationState.tree = null;
              this.visualizer.animationState.current = null;
              this.visualizer.animationState.highlight = [];
              this.visualizer.animationState.path = [];
              this.visualizer.animationState.description = '选择二叉树算法，点击开始按钮查看演示';
            }

            // 强制立即绘制正确的视图
            this.visualizer.drawVisualization();
          }
        }

        // 重置所有动画相关状态
        this.resetAnimationState();

        // 特殊处理计数排序
        if (algorithmId === 'countingSort') {
          console.log('选择了计数排序算法，正在检查脚本加载状态');
          // 检查计数排序脚本是否已加载
          if (window.VisualizationSteps && window.VisualizationSteps.generateCountingSortSteps) {
            console.log('计数排序脚本已加载，注册到可视化器');
            if (this.visualizer) {
              this.visualizer.setAlgorithmGenerator('countingSort', window.VisualizationSteps.generateCountingSortSteps);
            }
          } else {
            console.log('计数排序脚本尚未加载，等待脚本加载完成');
            // 添加一次性事件监听器，等待计数排序脚本加载完成
            document.addEventListener('counting-sort-loaded', () => {
              console.log('检测到计数排序脚本加载完成，注册到可视化器');
              if (this.visualizer && window.VisualizationSteps.generateCountingSortSteps) {
                this.visualizer.setAlgorithmGenerator('countingSort', window.VisualizationSteps.generateCountingSortSteps);
                // 重新生成可视化数据
                this.generateVisualizationData();
              }
            }, { once: true });
          }
        } else if (algorithmId === 'linkedList' || algorithmId === 'binaryTree' || algorithmId === 'stack') {
          // 特殊处理数据结构算法
          console.log(`选择了${algorithmId}算法，初始化可视化状态`);
          if (this.visualizer) {
            // 立即重置可视化状态为对应类型
            this.resetAnimation();

            // 确保选择类型后立即显示正确的视图
            if (algorithmId === 'linkedList') {
              console.log("初始化链表可视化视图");
              this.visualizer.animationState.type = 'linkedList';

              // 初始化链表
              this.visualizer.initLinkedListState();

              // 初始化链表操作按钮
              this.initLinkedListControls();

              // 输出提示信息
              this.writeToOutput('链表已初始化，请使用操作按钮进行交互');
            } else if (algorithmId === 'binaryTree') {
              console.log("初始化二叉树可视化视图");
              this.visualizer.animationState.type = 'binaryTree';
              this.visualizer.drawVisualization();
            }
          }
        }

        // 获取对应算法的示例代码
        if (this.algorithmCodeExamples && this.algorithmCodeExamples[algorithmId]) {
          const codeExample = this.algorithmCodeExamples[algorithmId];

          // 确保编辑器已就绪
          if (this.isEditorReady && this.editorManager) {
            this.editorManager.setContent(codeExample);
            this.code = codeExample;  // 同步Vue中的代码变量

            // 强制切换到示例代码标签
            console.log('切换到示例代码标签');
            this.switchToCodeTab();
          } else {
            console.warn('编辑器尚未就绪，无法设置内容');
            // 尝试放入队列延迟执行
            setTimeout(() => this.selectAlgorithm(algorithmId), 200);
          }
        } else {
          console.warn('找不到对应的代码示例');
          // 尝试放入队列延迟执行
          setTimeout(() => this.selectAlgorithm(algorithmId), 200);
        }
      },

      // 新增: 切换到示例代码标签
      switchToCodeTab() {
        // 切换激活状态
        this.fileTabs.forEach(tab => {
          tab.active = (tab.id === 1);
        });

        // 设置激活的标签ID
        this.activeFileTab = 1;

        // 触发DOM更新，确保编辑器可见
        this.$nextTick(() => {
          if (this.editorManager) {
            this.editorManager.layout();
          }
          console.log('已切换到示例代码标签，activeFileTab =', this.activeFileTab);
        });
      },

      // 切换文件标签
      switchFileTab(tabId) {
        // 更新标签激活状态
        this.fileTabs.forEach(tab => {
          tab.active = (tab.id === tabId);
        });

        // 更新激活的标签ID
        this.activeFileTab = tabId;

        console.log(`切换到标签: ${tabId}, 激活状态:`, this.fileTabs.map(t => `${t.id}=${t.active}`).join(', '));

        // 确保UI更新后重新计算布局
        this.$nextTick(() => {
          // 当切换到标签1时，确保编辑器大小正确
          if (tabId === 1 && this.editorManager) {
            this.editorManager.layout();
          }
        });
      },

      // 加载算法文档（只通过路径映射表）
      loadAlgorithmDocumentation(algorithmId) {
        const docPath = DOC_PATH_MAP[algorithmId];
        if (!docPath) {
          console.error(`找不到 algorithmId 对应路径: ${algorithmId}`);
          return;
        }

        console.log(`加载路径: ${docPath}`);

        const docContainer = document.getElementById('tab-content-2');
        if (!docContainer) {
          console.error('找不到文档容器元素: tab-content-2');
          return;
        }

        docContainer.innerHTML = `
          <div class="loading-message">
            <p>正在加载文档...</p>
          </div>
        `;

        fetch(docPath)
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
          })
          .then(markdownContent => {
            if (!markdownContent.trim()) {
              throw new Error('文档内容为空');
            }

            const html = window.markdownToHtml(markdownContent);
            docContainer.innerHTML = `
              <div class="markdown-content">
                ${html}
              </div>
            `;

            console.log('文档内容已更新');
          })
          .catch(error => {
            docContainer.innerHTML = `
              <div class="error-message">
                <h3>文档加载失败</h3>
                <p>${error.message}</p>
              </div>
            `;
            console.error('文档加载失败:', error);
          });
      },
      // 将Markdown转换为HTML的函数
      markdownToHtml(markdown) {
        // 此函数已移至 lib/markdownConverter.js
        return window.markdownToHtml(markdown);
      },

      // 新增：获取算法的显示名称
      getAlgorithmDisplayName(algorithmId) {
        // 遍历所有算法类别，查找匹配的算法ID
        for (const category in this.algorithms) {
          const algorithm = this.algorithms[category].find(alg => alg.id === algorithmId);
          if (algorithm) {
            return algorithm.name;
          }
        }

        // 如果找不到对应的显示名称，返回ID首字母大写
        return upperFirst(algorithmId);
      },

      // 获取算法类型 (排序/数据结构)
      getAlgorithmType(algorithmId) {
        return ALG_TYPE[algorithmId] || 'unknown';
      },

      // 重置动画状态
      resetAnimationState() {
        this.hasStarted = false;
        this.isPlaying = false;
        this.isPaused = false;
        this.progress = 0;
        this.currentAnimationStep = 0;
        this.animationSteps = [];
        this.isAnimationComplete = false;

        // 停止所有定时器
        this.stopAllAnimationTimers();
      },

      // 新增：取消当前进行中的可视化
      cancelCurrentVisualization() {
        // 如果WebSocket连接有效，发送取消请求
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          try {
            // 发送取消消息
            const cancelData = {
              type: 'cancelVisualization',
              algorithm: this.selectedAlgorithm
            };

            console.log('发送取消可视化请求:', cancelData);
            this.socket.send(JSON.stringify(cancelData));
          } catch (error) {
            console.error('发送取消请求失败:', error);
          }
        }

        // 清空所有存储的动画步骤
        this.animationSteps = [];

        // 强制更新进度条到初始状态
        this.progress = 0;
        this.updateProgressBar(0);
      },

      // 新增：根据编辑器代码生成可视化数据
      generateVisualizationData() {
        if (!this.editorManager) {
          console.warn('编辑器未初始化，无法生成可视化数据');
          return;
        }

        const code = this.editorManager.getValue();
        const algorithm = this.selectedAlgorithm;

        if (!code || !algorithm) {
          console.warn('未选择算法或代码为空，无法生成可视化数据');
          return;
        }

        console.log('正在根据代码生成可视化数据...');

        // 针对不同算法类型分别处理
        if (algorithm === 'linkedList' || algorithm === 'binaryTree') {
          console.log(`生成${algorithm}可视化数据`);

          // 确保可视化器已正确设置类型
          if (this.visualizer) {
            // 设置正确的类型
            this.visualizer.animationState.type = algorithm;

            // 清除排序相关数据
            this.visualizer.animationState.currentArray = [];
            this.visualizer.animationState.comparing = [];
            this.visualizer.animationState.swapping = [];
            this.visualizer.animationState.sorted = [];

            // 设置对应的空数据结构
            if (algorithm === 'linkedList') {
              this.visualizer.animationState.nodes = [];
              this.visualizer.animationState.current = null;
              this.visualizer.animationState.highlight = [];
              this.visualizer.animationState.description = '选择链表算法，点击开始按钮查看演示';
            } else {
              this.visualizer.animationState.tree = null;
              this.visualizer.animationState.current = null;
              this.visualizer.animationState.highlight = [];
              this.visualizer.animationState.path = [];
              this.visualizer.animationState.description = '选择二叉树算法，点击开始按钮查看演示';
            }

            // 立即绘制
            this.visualizer.drawVisualization();
          }

          return; // 数据结构直接返回，不执行下面的排序数组生成
        }

        // 排序算法的处理逻辑
        // 解析代码中的数组
        let newArray = this.extractArrayFromCode(code);

        // 如果无法从代码中提取数组，则使用算法特定的生成策略
        if (!newArray || newArray.length < 2) {
          newArray = this.generateArrayForAlgorithm(algorithm);
        }

        // 更新数组数据并重置可视化
        if (newArray && newArray.length > 0) {
          console.log('生成的可视化数据:', newArray);
          this.sortArray = newArray;

          // 如果可视化器已经初始化，则重置动画状态
          if (this.visualizer) {
            this.visualizer.animationState.type = 'sorting'; // 确保设置为排序类型
            this.visualizer.resetAnimationState(this.sortArray);
          }
        }
      },

      // 从编辑器代码中提取数组
      extractArrayFromCode(code) {
        try {
          // 识别数组所在行的上下文
          const lines = code.split('\n');
          let mainFunctionStart = -1;
          let mainFunctionEnd = -1;

          // 先尝试找到main函数范围，优先处理C语言代码中的main函数内数组
          for (let i = 0; i < lines.length; i++) {
            // 匹配main函数开始位置
            if (lines[i].match(/int\s+main\s*\([^)]*\)\s*\{/)) {
              mainFunctionStart = i;
            }
            // 匹配main函数结束位置
            else if (mainFunctionStart !== -1 && lines[i].trim() === '}') {
              mainFunctionEnd = i;
              break;
            }
          }

          // 主函数中的数组声明
          if (mainFunctionStart !== -1 && mainFunctionEnd !== -1) {
            // 只分析main函数内的代码
            const mainFunctionCode = lines.slice(mainFunctionStart, mainFunctionEnd + 1).join('\n');

            // 匹配数组声明和初始化
            const arrayDeclMatch = mainFunctionCode.match(/(?:int|float|double|char)\s+(\w+)\s*\[\s*(?:\d+)?\s*\]\s*=\s*\{([^;{}]+)\};/);
            if (arrayDeclMatch) {
              const arrayName = arrayDeclMatch[1]; // 数组名称
              const arrayContent = arrayDeclMatch[2]; // 数组内容

              // 分割并转换为数字
              const values = arrayContent.split(/,\s*/)
                .map(item => {
                  // 尝试提取数字部分，处理各种格式
                  const numMatch = item.trim().match(/(-?\d+(\.\d+)?)/);
                  return numMatch ? parseFloat(numMatch[0]) : null;
                })
                .filter(val => val !== null && !isNaN(val)); // 过滤无效的值

              // 确保至少有两个元素且都是有效数字
              if (values.length >= 2) {
                console.log(`从main函数中提取到数组 ${arrayName}:`, values);
                return values;
              }
            }
          }

          // 如果main函数内没有找到，尝试使用多种模式匹配整个代码
          const patterns = [
            // C语言风格数组声明和初始化：int arr[] = {1, 2, 3, 4, 5};
            /(?:int|float|double|char)\s+\w+\s*\[\s*(?:\d+)?\s*\]\s*=\s*\{([^;{}]+)\}/,

            // 匹配数组初始化部分，可能是修改现有数组：arr[] = {1, 2, 3, 4, 5};
            /\w+\s*\[\s*\]\s*=\s*\{([^;{}]+)\}/,

            // JavaScript风格数组: var arr = [1, 2, 3, 4, 5];
            /(?:var|let|const)\s+\w+\s*=\s*\[([^\]]+)\]/,

            // 函数调用中的数组: bubbleSort([1, 2, 3]) 或 bubbleSort({1, 2, 3})
            /\w+\s*\(\s*(?:\[([^\]]+)\]|\{([^}]+)\})/,

            // 匹配直接的数组字面量: [1, 2, 3, 4] 或 {1, 2, 3, 4}
            /\[\s*([^\][\]{}]+)\s*\]|\{\s*([^{}]+)\s*\}/
          ];

          // 尝试每种模式，优先使用最近被修改的部分
          for (const pattern of patterns) {
            const matches = Array.from(code.matchAll(new RegExp(pattern, 'g')));

            if (matches.length > 0) {
              const lastMatch = matches[matches.length - 1];

              const arrayContent = lastMatch.slice(1).find(group => group !== undefined);
              if (arrayContent) {
                // 分割并转换为数字，同时检查值范围
                const values = arrayContent.split(/,\s*/)
                  .map(item => {
                    const numMatch = item.trim().match(/(-?\d+(\.\d+)?)/);
                    const val = numMatch ? parseFloat(numMatch[0]) : null;

                    // 检查值是否超出范围
                    if (val !== null && val > 500) {
                      this.showArrayValueLimitHint(); // 显示提示
                    }

                    return val;
                  })
                  .filter(val => val !== null && !isNaN(val));

                if (values.length >= 1) {
                  console.log('从代码中提取到数组:', values);
                  return values;
                }
              }
            }
          }

          // 宽松匹配：寻找任何花括号或方括号中的数字列表
          const looseMatches = Array.from(code.matchAll(/\{([0-9,\s]+)\}|\[([0-9,\s]+)\]/g));
          if (looseMatches.length > 0) {
            // 选择最后一个匹配（假设是最近编辑的）
            const lastMatch = looseMatches[looseMatches.length - 1];
            const arrayContent = lastMatch[1] || lastMatch[2];

            if (arrayContent) {
              const values = arrayContent.split(',')
                .map(item => {
                  const num = parseFloat(item.trim());
                  return !isNaN(num) ? num : null;
                })
                .filter(val => val !== null);

              if (values.length >= 2) {
                console.log('使用宽松匹配提取到数组:', values);
                return values;
              }
            }
          }

          // 为数据结构算法特殊处理
          if (this.selectedAlgorithm === 'linkedList' || this.selectedAlgorithm === 'binaryTree') {
            // 尝试提取代码中出现的所有数字，生成有意义的数据
            const allNumbers = code.match(/\b\d+\b/g);
            if (allNumbers && allNumbers.length > 0) {
              const uniqueNumbers = [...new Set(allNumbers.map(n => parseInt(n)).filter(n => n > 0 && n < 100))];
              if (uniqueNumbers.length >= 3) {
                const result = uniqueNumbers.slice(0, 8); // 限制最多8个元素
                console.log('为数据结构生成特殊数组:', result);
                return result;
              }
            }
          }

          console.log('未能从代码中提取到有效数组');
          return null;
        } catch (error) {
          console.error('从代码中提取数组失败:', error);
          return null;
        }
      },

      // 根据算法类型生成适当的数组
      generateArrayForAlgorithm(algorithm) {
        // 基本数组大小和最大值
        const basicSize = 10;
        const maxValue = 100;
        
        // 使用映射查找对应的生成函数，如果没有则使用默认生成
        return ALG_ARRAY_GENERATOR[algorithm] ? 
          ALG_ARRAY_GENERATOR[algorithm](basicSize, maxValue) : 
          Array.from({ length: basicSize }, () => Math.floor(Math.random() * maxValue + 5));
      },

      // 开始可视化
      startVisualization() {
        if (!this.selectedAlgorithm) return;

        // 链表特殊处理：如果是链表并且没有预先执行链表操作，则提示用户
        if (this.selectedAlgorithm === 'linkedList' && (!this.animationSteps || this.animationSteps.length === 0)) {
          this.writeToOutput('请先点击链表操作按钮（搜索、插入、删除等）后再开始动画');
          return;
        }

        // 重置动画状态但保留hasStarted
        const wasStarted = this.hasStarted; // 保存当前状态
        this.resetVisualization();
        this.hasStarted = true; // 确保设置为true，不管之前的状态

        // 在开始可视化前更新数据
        this.generateVisualizationData();

        this.isPlaying = true;
        this.isPaused = false;
        this.isStepMode = false;

        // 如果不是链表，或者是链表但没有预先生成步骤，则清空步骤数组
        if (this.selectedAlgorithm !== 'linkedList' || this.animationSteps.length === 0) {
        this.animationSteps = []; // 清空之前的步骤
        }

        this.isVisualizationReady = false; // 标记还未准备就绪

        // 确保进度条从0开始
        this.progress = 0;
        this.currentAnimationStep = 0;

        // 在开始新的可视化之前更新UI
        this.$nextTick(() => {
          // 强制更新进度条，确保从0开始
          this.updateProgressBar(0);

          // 检查WebSocket连接状态
          if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.error('WebSocket连接不可用，尝试重新连接...');
            this.writeToOutput('WebSocket连接不可用，尝试重新连接...');

            try {
              const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
              const host = window.location.host; // 自动获取当前域名和端口
              socket = new WebSocket(`${protocol}//${host}`);

              socket.onopen = () => {
                console.log('WebSocket重新连接成功');
                this.writeToOutput('WebSocket重新连接成功，请再次点击"开始可视化"');
              };

              socket.onerror = (error) => {
                console.error('WebSocket重连错误:', error);
                this.writeToOutput('WebSocket重连失败，请刷新页面重试');
              };

              // 更新Vue实例中的socket引用
              this.socket = socket;
              return;
            } catch (e) {
              console.error('WebSocket重连失败:', e);
              this.writeToOutput('WebSocket连接失败，请刷新页面重试');
              return;
            }
          }

          // 如果是链表算法且已经有动画步骤，则直接开始播放而不是请求新步骤
          if (this.selectedAlgorithm === 'linkedList' && this.animationSteps.length > 0) {
            console.log('使用已生成的链表操作步骤开始播放');
            this.playNextStep();
            return;
          }

          // 特殊处理计数排序
          if (this.selectedAlgorithm === 'countingSort') {
            console.log('准备开始计数排序可视化');
            // 确保计数排序相关的属性都被正确初始化
            if (this.visualizer) {
              this.visualizer.animationState.type = 'sorting';
              this.visualizer.animationState.countingArray = [];
              this.visualizer.animationState.outputArray = [];
              this.visualizer.animationState.phase = 'init';
              // 强制重绘
              this.visualizer.drawVisualization();

              // 在控制台打印数组数据
              console.log('计数排序数组数据:', this.sortArray);
            }
          }

          // 准备可视化数据
          let data = {
            type: 'startVisualization',
            algorithm: this.selectedAlgorithm,
            speed: parseFloat(this.animationSpeed)
          };

          // 添加算法特定的数据
          if (['bubbleSort', 'selectionSort', 'insertionSort', 'quickSort', 'heapSort', 'mergeSort', 'radixSort', 'bucketSort', 'countingSort'].includes(this.selectedAlgorithm)) {
            data.array = this.sortArray;
            console.log(`开始${this.selectedAlgorithm}可视化，数组:`, this.sortArray);
          } else if (this.selectedAlgorithm === 'binaryTree') {
            // 为二叉树可视化准备数据
            data.values = this.sortArray || [50, 30, 20, 40, 70, 60, 80];
            console.log(`开始二叉树可视化，节点值:`, data.values);
          }

          // 使用安全发送函数
          console.log('发送WebSocket数据:', data);
          if (!safeSocketSend(data)) {
            console.error('发送可视化数据失败');
            this.writeToOutput('服务器连接失败，无法启动可视化');
            this.isPlaying = false;
            this.isPaused = true;
          }
        });
      },

      // 合并播放和暂停功能
      togglePlayPause() {
        if (!this.hasStarted || this.isAnimationComplete || 
            // 增加判断：当动画步骤数组为空时，也重新开始动画
            (this.animationSteps.length === 0)) {
          // 如果是链表并且没有预先执行链表操作，则提示用户先进行操作
          if (this.selectedAlgorithm === 'linkedList' && (!this.animationSteps || this.animationSteps.length === 0)) {
            this.writeToOutput('请先点击链表操作按钮（搜索、插入、删除等）后再开始动画');
            return;
          }

          // 如果动画未开始或已完成，则开始新的可视化
          console.log('开始新的可视化');

          // 强制确保在开始新的可视化前清空输出和进度条
          this.clearOutput();
          if (window.terminalAPI) {
            window.terminalAPI.clear();
          }
          this.progress = 0;
          this.updateProgressBar(0);

          // 重置其他可能的状态
          this.resetVisualization();

          // 开始新的可视化
          this.startVisualization();
          // 添加按钮动画效果
          this.animateStepButton('play-pause-btn');
        } else if (this.isPaused) {
          // 如果当前已暂停，则继续播放
          console.log('继续播放当前暂停的动画');
          this.isPlaying = true;
          this.isPaused = false;
          this.isStepMode = false; // 退出步进模式
          this.playNextStep();
          // 添加按钮动画效果
          this.animateStepButton('play-pause-btn');
        } else if (this.isPlaying) {
          // 如果正在播放，则暂停
          console.log('暂停当前播放的动画');
          this.isPlaying = false;
          this.isPaused = true;
          this.stopAllAnimationTimers();
          // 添加按钮动画效果
          this.animateStepButton('play-pause-btn');
        }

        // 更新进度条样式
        this.updateProgressBarClass();
      },

      // 切换播放/暂停状态 (保留以便向后兼容)
      togglePause() {
        this.togglePlayPause();
      },

      // 处理开始按钮的点击 (保留以便向后兼容)
      handleStartButton() {
        this.togglePlayPause();
      },

      // 更新进度条样式类
      updateProgressBarClass() {
        // 如果需要实现此功能，可以在这里添加代码
      },

      // 更新进度条
      updateProgressBar(progress) {
        const progressBar = document.querySelector('.progress-bar');
        if (!progressBar) {
          console.error('进度条元素不存在，尝试创建');
          this.createProgressBar();
          return this.updateProgressBar(progress);
        }

        // 确保进度值在有效范围内
        const safeProgress = Math.max(0, Math.min(100, progress));

        // 更新进度条宽度
        progressBar.style.width = `${safeProgress}%`;

        // 如果进度是100%，添加完成类
        if (safeProgress >= 100) {
          progressBar.classList.add('complete');
        } else {
          progressBar.classList.remove('complete');
        }

        // 根据播放状态添加或移除活动类
        if (this.isPlaying) {
          progressBar.classList.add('active');
        } else {
          progressBar.classList.remove('active');
        }
      },

      // 创建进度条（如果不存在）
      createProgressBar() {
        const visualizationControls = document.querySelector('.visualization-controls');
        if (!visualizationControls) {
          console.error('找不到可视化控制区域');
          return;
        }

        // 检查是否已存在进度条
        if (visualizationControls.querySelector('.progress-container')) {
          console.log('进度条已存在');
          return;
        }

        console.log('创建进度条元素');

        // 创建进度条容器
        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-container';

        // 创建进度条
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.style.width = '0%';

        // 创建步骤计数器
        const stepCounter = document.createElement('div');
        stepCounter.className = 'step-counter';
        stepCounter.textContent = '0/0';

        // 组装进度条
        progressContainer.appendChild(progressBar);
        progressContainer.appendChild(stepCounter);

        // 找到上一步按钮
        const prevBtn = visualizationControls.querySelector('.prev-btn');
        const nextBtn = visualizationControls.querySelector('.next-btn');

        // 将进度条插入到上一步按钮和下一步按钮之间
        if (prevBtn && nextBtn) {
          visualizationControls.insertBefore(progressContainer, nextBtn);
        } else {
          // 如果找不到按钮，直接添加到控制区域
          visualizationControls.appendChild(progressContainer);
        }

        console.log('进度条创建完成');
      },

      // 修改步进前进方法
      stepForward() {
        if (!this.hasStarted || this.animationSteps.length === 0) {
          // 如果是链表并且没有步骤，提示用户先进行操作
          if (this.selectedAlgorithm === 'linkedList') {
            this.writeToOutput('请先点击链表操作按钮（搜索、插入、删除等）后再进行步进');
          }
          return;
        }

        // 如果正在播放，则先暂停
        if (this.isPlaying && !this.isPaused) {
          this.togglePause();
          return;
        }

        // 停止所有可能正在运行的动画计时器
        this.stopAllAnimationTimers();

        // 启用步进模式
        this.isStepMode = true;
        this.isPaused = true;
        this.isPlaying = false;

        // 确保不会超出步骤范围 - 重要修改：等于length时才算超出范围
        if (this.currentAnimationStep >= this.animationSteps.length) {
          console.log('已到达动画末尾');
          this.isAnimationComplete = true;
          return;
        }

        // 获取当前步骤
        const step = this.animationSteps[this.currentAnimationStep];

        // 执行当前步骤
        if (this.visualizer && step) {
          console.log(`执行步骤 ${this.currentAnimationStep+1}/${this.animationSteps.length}`);

          // 重置动画进度，确保每步动画都从头播放
          if (this.visualizer.animationState) {
            this.visualizer.animationState.animationProgress = 0;
          }

          // 应用当前步骤动画
          this.visualizer.handleVisualizationStep(step);

          // 确保动画步骤开始
          this.visualizer.startStepAnimation();

          // 在输出区域显示步骤描述
          if (step.description) {
            this.writeToOutput(`步骤 ${this.currentAnimationStep+1}/${this.animationSteps.length}: ${step.description}`);
          }

          // 检查是否是最后一步
          const isLastStep = this.currentAnimationStep === this.animationSteps.length - 1;

          // 计算进度
          if (isLastStep) {
            // 最后一步显示100%
            this.progress = 100;
          } else {
            // 其他步骤精确计算进度
            const totalSteps = Math.max(1, this.animationSteps.length - 1); // 确保不会除以零
            const exactProgress = (this.currentAnimationStep / totalSteps) * 100;
            this.progress = exactProgress.toFixed(1);
          }

          this.updateProgressBar(this.progress);

          // 手动更新步骤计数器显示
          const stepCounter = document.querySelector('.step-counter');
          if (stepCounter) {
            if (isLastStep) {
              // 在最后一步显示完整计数
              stepCounter.textContent = `${this.animationSteps.length}/${this.animationSteps.length}`;
            } else {
              stepCounter.textContent = `${this.currentAnimationStep+1}/${this.animationSteps.length}`;
            }
          }

          // 记录当前步骤索引，增加步骤索引 - 先增加，后检查
          this.currentAnimationStep++;

          // 检查是否已经到达最后一步
          const reachedEnd = this.currentAnimationStep >= this.animationSteps.length;

          // 只有当真正到达最后一步之后，才标记为完成
          if (reachedEnd) {
            this.isAnimationComplete = true;
            console.log('已到达动画末尾，总步骤：', this.animationSteps.length);
          } else {
            // 确保未到最后之前不会被标记为完成
            this.isAnimationComplete = false;
          }
        }

        // 更新按钮状态
        this.updateButtonStates();

        // 添加按钮点击反馈效果
        this.animateStepButton('next-btn');
      },

      // 停止所有动画计时器
      stopAllAnimationTimers() {
        if (this._stepTimer) {
          clearTimeout(this._stepTimer);
          this._stepTimer = null;
        }

        if (this.visualizer && this.visualizer._animationFrameId) {
          cancelAnimationFrame(this.visualizer._animationFrameId);
          this.visualizer._animationFrameId = null;
        }
      },

      // 更新按钮状态方法也需要修改
      updateButtonStates() {
        // 修改判断逻辑：只有当步骤索引大于等于总步数时才算到达末尾
        const isLastStep = this.currentAnimationStep >= this.animationSteps.length;
        const isFirstStep = this.currentAnimationStep <= 0;

        // 如果在最后一步之后，禁用下一步按钮
        const stepButton = document.querySelector('.step-btn');
        if (stepButton) {
          stepButton.disabled = isLastStep;
        }

        // 如果到达或超过最后一步，显示完成状态
        if (isLastStep) {
          this.isAnimationComplete = true;
        }
      },

      // 新增：处理键盘快捷键
      handleKeydown(event) {
        // 检查事件源是否在编辑器区域内
        const isInEditor = this._isEventFromEditor(event);
        if (isInEditor) {
          // 如果在编辑器区域内，不处理快捷键
          return;
        }

        if (!this.hasStarted && (event.key === ' ' || event.key === 'r' || event.key === 'R')) {
          // 如果还没开始，那么空格键和r键都可以开始可视化
          event.preventDefault();
          this.togglePlayPause();
          return;
        }

        switch(event.key) {
          case ' ': // 空格键 - 暂停/继续
            event.preventDefault();
            this.togglePlayPause();
            break;

          case 'ArrowRight': // 右箭头 - 下一步
            event.preventDefault();
            if (this.isPaused && !this.isAnimationComplete) {
              this.stepForward();
            }
            break;

          case 'ArrowLeft': // 左箭头 - 上一步
            event.preventDefault();
            if (this.isPaused && this.currentAnimationStep > 0) {
              this.stepBackward(); // 需要实现这个方法
            }
            break;

          case 'r': // r键 - 重置
          case 'R':
            event.preventDefault();
            this.resetVisualization();
            break;
        }
      },

      // 新增：检查事件是否来自编辑器区域
      _isEventFromEditor(event) {
        // 检查事件目标元素或其父元素是否在编辑器容器内
        let targetElement = event.target;
        const editorContainer = document.getElementById('monaco-editor-container');

        if (!editorContainer) {
          return false;
        }

        // 向上遍历DOM树检查是否在编辑器区域内
        while (targetElement) {
          if (targetElement === editorContainer ||
              targetElement.classList &&
              (targetElement.classList.contains('monaco-editor') ||
               targetElement.classList.contains('editor-container'))) {
            return true;
          }
          targetElement = targetElement.parentElement;
        }

        // 也检查焦点是否在编辑器上
        if (document.activeElement) {
          const activeElement = document.activeElement;
          if (activeElement.classList &&
              (activeElement.classList.contains('monaco-editor') ||
               activeElement.classList.contains('inputarea'))) {
            return true;
          }

          // 检查活动元素的父元素
          let parentElement = activeElement.parentElement;
          while (parentElement) {
            if (parentElement === editorContainer ||
                parentElement.classList &&
                parentElement.classList.contains('monaco-editor')) {
              return true;
            }
            parentElement = parentElement.parentElement;
          }
        }

        return false;
      },

      // 改进：后退一步功能，增加步骤记录功能
      stepBackward() {
        if (!this.hasStarted || this.animationSteps.length === 0 || this.currentAnimationStep <= 0) {
          // 如果是链表并且没有步骤，提示用户先进行操作
          if (this.selectedAlgorithm === 'linkedList' && this.animationSteps.length === 0) {
            this.writeToOutput('请先点击链表操作按钮（搜索、插入、删除等）后再进行步进');
          }
          return;
        }

        // 停止所有可能正在运行的动画计时器
        this.stopAllAnimationTimers();

        // 启用步进模式
        this.isStepMode = true;
        this.isPaused = true;
        this.isPlaying = false;

        // 计算上一步
        const prevStep = this.currentAnimationStep - 1;

        // 确保索引有效
        if (prevStep < 0) return;

        // 更新当前步骤索引
        this.currentAnimationStep = prevStep;

        // 精确计算进度
        const totalSteps = Math.max(1, this.animationSteps.length - 1); // 确保不会除以零
        const exactProgress = (prevStep / totalSteps) * 100;

        // 获取并显示上一步
        const step = this.animationSteps[prevStep];
        if (this.visualizer && step) {
          console.log(`执行上一步 ${prevStep+1}/${this.animationSteps.length}`);

          // 重置动画进度以保证完整的过渡效果
          if (this.visualizer.animationState) {
            this.visualizer.animationState.animationProgress = 0;
          }

          // 应用步骤动画
          this.visualizer.handleVisualizationStep(step);

          // 恢复上一步的输出状态
          if (this.stepOutputHistory[prevStep]) {
            console.log(`恢复步骤 ${prevStep} 的输出历史，长度: ${this.stepOutputHistory[prevStep].length}`);

            // 先清空当前输出
            this.output = '';
            if (window.terminalAPI) {
              window.terminalAPI.clear();
            }

            // 使用历史输出重建文本内容
            const outputLines = this.stepOutputHistory[prevStep].split('\n');

            // 逐行写入，保持原始格式
            for (let i = 0; i < outputLines.length; i++) {
              if (i === 0) {
                // 直接设置第一行
                this.output = outputLines[i];
                if (window.terminalAPI) {
                  window.terminalAPI.write(outputLines[i]);
                }
              } else {
                // 为后续行添加换行符
                this.output += '\n' + outputLines[i];
                if (window.terminalAPI) {
                  window.terminalAPI.write('\n' + outputLines[i]);
                }
              }
            }
          } else {
            // 如果没有历史记录，则清空输出并添加当前步骤描述
            this.output = '';
            if (window.terminalAPI) {
              window.terminalAPI.clear();
            }
            if (step.description) {
              this.writeToOutput(`步骤 ${prevStep+1}/${this.animationSteps.length}: ${step.description}`);
            }
          }

          // 更新进度条
          this.progress = exactProgress.toFixed(1);
          this.updateProgressBar(this.progress);
        } else {
          console.error('可视化器未初始化或步骤无效');
        }

        // 更新按钮状态
        this.updateButtonStates();

        // 添加按钮反馈
        this.animateStepButton('prev-btn');

        // 如果不是最后一步，确保动画完成状态为false
        this.isAnimationComplete = false;
      },

      // 重置可视化 - 确保也重置步骤记录系统
      resetVisualization() {
        // 停止所有计时器和动画
        this.stopAllAnimationTimers();
        
        // 重置状态
        // 注意：不要重置hasStarted，这样可以保持动画按钮的可用状态
        // this.hasStarted = false;
        this.isPlaying = false;
        this.isPaused = false;
        this.progress = 0;
        this.currentAnimationStep = 0;
        this.isStepMode = false;
        this.isAnimationComplete = false;
        this.animationSteps = []; // 确保清空步骤数组
        this.stepOutputHistory = []; // 清空步骤输出历史
        this.currentOutputSnapshot = ''; // 重置当前输出快照

        if (this.visualizer) {
          if (this.selectedAlgorithm && ['bubbleSort', 'selectionSort', 'insertionSort', 'quickSort'].includes(this.selectedAlgorithm)) {
            this.visualizer.resetAnimationState(this.sortArray);
          } else {
            this.visualizer.resetAnimationState();
          }
        }
      },

      // 速度改变时更新
      speedChanged() {
        console.log('速度已更改为:', this.animationSpeed);
        // 如果已经开始可视化，需要重新发送请求或调整速度
      },

      // 获取状态对应的颜色
      getColorForState(state) {
        // 确保visualizer已经初始化
        if (!this.visualizer || !this.visualizer.config || !this.visualizer.config.colors) {
          const defaultColors = {
            base: '#505050',
            comparing: '#FFA500',
            swapping: '#FFA500',
            sorted: '#4CAF50'
          };
          return defaultColors[state] || '#505050';
        }

        return this.visualizer.config.colors.default[state] || '#505050';
      },

      // 改进按钮动画效果方法
      animateStepButton(buttonClass) {
        const button = document.querySelector(`.${buttonClass}`);
        if (button) {
          button.classList.add('step-active');
          setTimeout(() => {
            button.classList.remove('step-active');
          }, 300);
        }
      },

      // 清除输出
      clearOutput() {
        this.output = '';
      },

      // 切换输出滚动锁定
      toggleOutputScrollLock() {
        this.isOutputScrollLocked = !this.isOutputScrollLocked;

        if (window.terminalAPI && typeof window.terminalAPI.toggleOutputScrollLock === 'function') {
          window.terminalAPI.toggleOutputScrollLock(this.isOutputScrollLocked);
        }
      },

      // 清除问题列表
      clearProblems() {
        this.problems = [];
        if (window.terminalAPI && typeof window.terminalAPI.updateProblemsList === 'function') {
          window.terminalAPI.updateProblemsList();
        }
      },

      // 折叠所有问题
      collapseAllProblems() {
        // 实现问题折叠逻辑，根据实际需求完善
        console.log('折叠所有问题');
      },

      // 终端相关方法
      writeToTerminal(text) {
        if (window.terminalAPI) {
          window.terminalAPI.write(text);
        }
      },

      clearTerminal() {
        if (window.terminalAPI) {
          window.terminalAPI.clear();
        }
      },

      focusTerminal() {
        if (window.terminalAPI) {
          window.terminalAPI.focus();
          this.activeOutputTab = 'terminal';
        }
      },

      createNewTerminal() {
        if (window.terminalAPI) {
          window.terminalAPI.createNew();
        }
      },

      splitTerminal() {
        if (window.terminalAPI) {
          window.terminalAPI.split();
        }
      },

      togglePanelVisibility() {
        if (window.terminalAPI) {
          window.terminalAPI.togglePanelVisibility();
        } else {
          this.isPanelVisible = !this.isPanelVisible;
        }
      },

      // 处理窗口大小变化
      handleResize() {
        // 调整编辑器大小
        if (this.editorManager) {
          this.editorManager.layout();
        }

        // 调整终端大小
        if (window.terminalAPI && window.terminalAPI.fit) {
          window.terminalAPI.fit();
        }

        // 调整可视化画布大小
        if (this.visualizer && typeof this.visualizer.resizeCanvas === 'function') {
          this.visualizer.resizeCanvas();
        }

        // 调整图例区域布局
        this.$nextTick(() => {
          this.adjustLegendLayout();
          // 强制刷新画布尺寸
          this.forceResizeCanvas();
          // 不再强制Canvas占满容器
          // this.forceFitCanvas();
        });
      },

      // 强制适应画布
      forceFitCanvas() {
        // 不再强制调整canvas大小
        console.log('跳过强制调整canvas大小');
        // 延迟执行以确保DOM更新完成
        // this.$nextTick(() => {
        //   this.forceResizeCanvas();
        // });
      },

      // 调整图例区域布局
      adjustLegendLayout() {
        const legend = document.querySelector('.legend');
        if (!legend) return;

        const visualizationArea = document.querySelector('.visualization-area');
        if (!visualizationArea) return;

        // 检查可视化区域宽度
        const areaWidth = visualizationArea.clientWidth;

        // 当宽度小于600px时，切换到紧凑模式
        if (areaWidth < 600) {
          legend.classList.add('compact-legend');
        } else {
          legend.classList.remove('compact-legend');
        }

        // 获取canvas元素
        const canvas = document.getElementById('algorithmCanvas');
        if (!canvas) return;

        // 不再强制调整画布大小
        if (this.visualizer) {
          // 仅通知可视化器重新绘制
          this.visualizer.redrawCurrentState && this.visualizer.redrawCurrentState();
        }
      },

      // 输出文本
      writeToOutput(text) {
        // 防止undefined或null
        if (text === undefined || text === null) {
          text = '';
        }

        // 确保text是字符串
        text = String(text);

        // 处理特殊字符和编码问题
        text = text.replace(/\r\n/g, '\n'); // 统一换行符

        // 如果文本以步骤开头，表示这是一个新步骤，保存当前输出快照
        if (text.match(/步骤\s+\d+\/\d+:/)) {
          // 保存当前输出作为历史快照
          if (this.currentAnimationStep >= 0 && this.currentAnimationStep < this.animationSteps.length) {
            // 确保stepOutputHistory数组长度与当前动画步骤相匹配
            while (this.stepOutputHistory.length <= this.currentAnimationStep) {
              this.stepOutputHistory.push('');
            }
            // 保存当前输出快照到对应步骤
            this.stepOutputHistory[this.currentAnimationStep] = this.output;
            console.log(`保存步骤 ${this.currentAnimationStep} 的输出快照，长度: ${this.output.length}`);
          }
        }

        // 追加到输出
        if (this.output) {
          if (!this.output.endsWith('\n')) {
            this.output += '\n' + text;
          } else {
            this.output += text;
          }
        } else {
          this.output = text;
        }

        // 将输出写入到终端
        if (window.terminalAPI) {
          // 如果是步骤描述，使用完整写入模式
          if (text.match(/步骤\s+\d+\/\d+:/)) {
            if (window.terminalAPI.write) {
              if (this.output === text) {
                // 如果是第一行，直接写入
                window.terminalAPI.write(text);
              } else {
                // 否则添加换行符
                window.terminalAPI.write('\n' + text);
              }
            }
          } else {
            // 其他文本正常写入
            if (text.endsWith('\n')) {
              window.terminalAPI.write(text);
            } else {
              window.terminalAPI.write(text + '\n');
            }
          }
        }

        // 确保滚动到底部
        this.$nextTick(() => {
          const outputElement = document.querySelector('.output');
          if (outputElement) {
            outputElement.scrollTop = outputElement.scrollHeight;
          }

          // 通知终端模块更新输出内容
          if (window.terminalAPI && typeof window.terminalAPI.updateOutputContent === 'function') {
            window.terminalAPI.updateOutputContent();
          }
        });

        console.log('输出已追加，当前输出长度:', this.output.length);
      },

      // 检查WebSocket连接 - 更新错误处理
      checkWebSocketConnection() {
        if (!socket) {
          handleError('WebSocket未连接', {
            type: 'connection',
            showToUser: false
          });
          return false;
        }

        // 重新设置消息处理
        socket.onmessage = (event) => {
          try {
            const response = JSON.parse(event.data);
            console.log('收到WebSocket消息:', response.type);

            if (response.type === 'visualization_start') {
              // 开始可视化的消息
              console.log(`开始${response.algorithm}可视化，预计步骤: ${response.stepsCount}`);

              // 清空之前的步骤
        this.animationSteps = [];
        this.currentAnimationStep = 0;
        this.progress = 0;
        this.updateProgressBar(0);
        
              // 特别处理计数排序
              if (response.algorithm === 'countingSort') {
                console.log('准备接收计数排序步骤');
                // 确保可视化器已初始化并设置了正确的类型
                if (this.visualizer) {
                  this.visualizer.animationState.type = 'sorting';
                  this.visualizer.animationState.countingArray = [];
                  this.visualizer.animationState.outputArray = [];
                  this.visualizer.animationState.phase = 'init';

                  // 强制重绘一次，确保视图更新
                  this.visualizer.drawVisualization();
                }
              }
            } else if (response.type === 'visualization_all_steps') {
              // 收到所有可视化步骤数据
              console.log(`收到${response.algorithm}所有步骤：${response.steps.length}个`);

              // 保存所有步骤
              if (response.steps && Array.isArray(response.steps)) {
                // 对计数排序的步骤进行特殊处理
                if (response.algorithm === 'countingSort') {
                  this.animationSteps = response.steps.map((step, index) => {
                    // 添加正确的索引属性
                    step.index = index;
                    step.total = response.totalSteps;

                    // 确保必要的计数排序属性存在，避免undefined错误
                    if (step.countingArray === undefined) step.countingArray = [];
                    if (step.outputArray === undefined) step.outputArray = [];
                    if (step.phase === undefined) step.phase = 'init';
                    if (step.type === undefined) step.type = 'sorting';

                    return step;
                  });

                  console.log(`处理后的计数排序步骤数量: ${this.animationSteps.length}`);
                  console.log(`首个步骤示例:`, this.animationSteps[0]);
                } else {
                  // 其他算法的标准处理
                  this.animationSteps = response.steps.map((step, index) => {
                    step.index = index;
                    step.total = response.totalSteps;
                    return step;
                  });
                }
              }
            } else if (response.type === 'visualization_steps_ready') {
              console.log('所有步骤准备完毕，开始播放');

              // 标记可视化已准备就绪
              this.isVisualizationReady = true;

              // 如果处于播放状态，开始播放第一步
              if (this.isPlaying && !this.isPaused) {
                this.playNextStep();
              }
            } else if (response.type === 'error') {
              handleError(response.message, {
                type: 'general',
                showToUser: true
              });
              this.isPlaying = false;
              this.isPaused = true;
            } else if (response.status === 'success') {
              // 编译成功的响应
              this.writeToOutput(response.output || '编译并运行成功');
            } else if (response.status === 'error') {
              handleError(response.message, {
                type: 'general',
                showToUser: true,
                logPrefix: '编译错误'
              });
            } else {
              // 其他类型的消息
              console.log('未处理的WebSocket消息类型:', response);
            }
          } catch (error) {
            handleError(error, {
              type: 'general',
              showToUser: false,
              message: '处理WebSocket消息时出错'
            });
          }
        };

        return true;
      },

      // 播放下一步 - 更新错误处理
      playNextStep() {
        // 添加调试日志
        console.log(`尝试播放下一步: 当前步骤=${this.currentAnimationStep}, 总步骤=${this.animationSteps?.length || 0}`);
        console.log(`播放状态: isPlaying=${this.isPlaying}, isPaused=${this.isPaused}`);

        if (!this.isPlaying || this.isPaused || !this.animationSteps.length) {
          console.log('无法播放: 播放条件不满足');
          return;
        }

        if (this.currentAnimationStep < this.animationSteps.length) {
          const step = this.animationSteps[this.currentAnimationStep];

          // 处理当前步骤
          if (this.visualizer) {
            // 重置动画进度，确保每步动画都从头播放
            if (this.visualizer.animationState) {
              this.visualizer.animationState.animationProgress = 0;
            }

            try {
              // 执行步骤前的调试输出
              console.log(`执行步骤 ${this.currentAnimationStep+1}/${this.animationSteps.length}, 类型: ${step.type || 'unknown'}`);

              // 特殊处理计数排序的步骤
              if (step.type === 'sorting' && (step.countingArray !== undefined || step.phase)) {
                console.log(`计数排序步骤: 阶段=${step.phase}, 计数数组长度=${(step.countingArray || []).length}`);

                // 确保所有必要属性存在
                if (step.countingArray === undefined) step.countingArray = [];
                if (step.outputArray === undefined) step.outputArray = [];
                if (step.phase === undefined) step.phase = 'init';
              }

              // 应用当前步骤动画
              console.log('处理可视化步骤:', step);
              this.visualizer.handleVisualizationStep(step);

              // 确保动画步骤开始
              console.log('开始步骤动画');
              if (typeof this.visualizer.startStepAnimation === 'function') {
                this.visualizer.startStepAnimation();
              } else {
                console.warn('可视化器没有startStepAnimation方法');
                // 强制重绘以确保显示当前步骤
                this.visualizer.drawVisualization();
              }

              // 在输出区域显示步骤描述
              if (step && step.description) {
                this.writeToOutput(`步骤 ${this.currentAnimationStep+1}/${this.animationSteps.length}: ${step.description}`);
              }
            } catch (error) {
              handleError(error, {
                type: 'visualization',
                showToUser: true,
                message: '处理步骤时出错'
              });
            }

            // 检查是否到达最后一步
            const isLastStep = this.currentAnimationStep >= this.animationSteps.length - 1;

            // 更新进度
            if (isLastStep) {
              // 最后一步显示100%进度
              this.progress = 100;
            } else {
              // 其他步骤精确计算进度
              const exactProgress = (this.currentAnimationStep / (this.animationSteps.length - 1)) * 100;
              this.progress = Math.min(exactProgress, 99.9).toFixed(1);
            }

            this.updateProgressBar(this.progress);

            // 手动更新步骤计数器显示
            const stepCounter = document.querySelector('.step-counter');
            if (stepCounter) {
              // 在最后一步时显示最终步骤数
              if (isLastStep) {
                stepCounter.textContent = `${this.animationSteps.length}/${this.animationSteps.length}`;
              } else {
                stepCounter.textContent = `${this.currentAnimationStep+1}/${this.animationSteps.length}`;
              }
            }

            if (isLastStep) {
              this.isAnimationComplete = true;
              this.isPlaying = false;
              this.isPaused = true;
              console.log('动画播放完成');

              // 不再自动清空，而是显示一条完成消息，等待用户点击开始按钮时清空
              this.writeToOutput(`\n动画已播放完成，点击"开始"按钮可以重新播放。`);

              return;
            }

            // 准备播放下一步
            this.currentAnimationStep++;

            // 根据速度设置延迟时间
            const delay = 1000 / parseFloat(this.animationSpeed);

            // 设置定时器播放下一步
            this._stepTimer = setTimeout(() => {
              if (this.isPlaying && !this.isPaused) {
                this.playNextStep();
              }
            }, delay);
          }
        }
      },

      // 处理可视化步骤 - 使用新的错误处理
      handleVisualizationStep(data) {
        console.log(`收到可视化步骤 ${data.index}/${data.total}:`, data.step);

        // 保存步骤，确保不重复添加
        const isDuplicateStep = this.animationSteps.some(
          existingStep => JSON.stringify(existingStep) === JSON.stringify(data.step)
        );

        if (!isDuplicateStep) {
          this.animationSteps.push(data.step);

          // 检查visualizer是否存在
          if (!this.visualizer) {
            handleError('可视化器未初始化！尝试重新初始化...', {
              type: 'visualization',
              showToUser: true,
              attempt: 0
            });

            this.initVisualizer();

            if (!this.visualizer) {
              handleError('可视化器初始化失败，无法显示动画', {
                type: 'visualization',
                showToUser: true
              });
              return;
            }
          }
        }

        // 只有在非步进模式且处于播放状态时才自动前进
        if (this.visualizer && this.isPlaying && !this.isStepMode) {
          // 直接在控制台检查数据
          console.log(`处理步骤 ${data.index}/${data.total}，描述:`, data.step.description);

          // 将算法描述步骤输出到终端，让用户看到文字描述
          if (data.step && data.step.description) {
            this.writeToOutput(`步骤 ${data.index+1}/${data.total}: ${data.step.description}`);
          }

          try {
            this.visualizer.handleVisualizationStep(data.step);
            this.currentAnimationStep = data.index;

            // 精确计算进度
            if (data.total > 1) { // 确保总步数大于1，避免除以0
              // 将索引映射到[0-100]范围，不是最后一步时最大显示99.9%
              const exactProgress = (data.index / (data.total - 1)) * 100;

              if (data.index >= data.total - 1) {
                // 最后一步显示100%
                this.progress = 100;
                // 只有自动播放模式下才在最后一步自动标记为完成
                this.isAnimationComplete = true;
              } else {
                // 其他步骤精确计算
                this.progress = Math.min(exactProgress, 99.9).toFixed(1);
              }

              // 确保DOM更新
              this.updateProgressBar(this.progress);
            } else {
              this.progress = data.index > 0 ? 100 : 0;
              this.updateProgressBar(this.progress);
            }
          } catch (error) {
            handleError(error, {
              type: 'visualization',
              showToUser: true,
              message: '处理可视化步骤时出错'
            });
          }
        }
      },

      // 添加新方法: 尝试重新连接WebSocket - 使用新的错误处理
      attemptReconnect(attempt = 1) {
        if (attempt > 3) {
          handleError('多次尝试连接失败，某些功能可能受限', {
            type: 'connection',
            showToUser: true,
            attempt: 3
          });
          return;
        }

        console.log(`尝试第${attempt}次重新连接WebSocket...`);

        try {
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          const host = window.location.host; // 自动获取当前域名和端口
          const newSocket = new WebSocket(`${protocol}//${host}`);

          newSocket.onopen = () => {
            console.log('WebSocket重新连接成功');
            this.socket = newSocket;

            // 更新全局socket引用
            socket = newSocket;

            // 重新设置消息处理程序
            this.checkWebSocketConnection();

            this.writeToOutput('服务器连接已恢复');
          };

          newSocket.onerror = (err) => {
            handleError(err, {
              type: 'connection',
              showToUser: false,
              attempt: attempt,
              message: `第${attempt}次WebSocket重连失败`
            });
            setTimeout(() => this.attemptReconnect(attempt + 1), 1000 * attempt);
          };

          newSocket.onclose = () => {
            console.warn('新的WebSocket连接已关闭');
            // 如果新连接立即关闭，增加延迟并尝试重连
            setTimeout(() => this.attemptReconnect(attempt + 1), 1000 * attempt);
          };
        } catch (error) {
          handleError(error, {
            type: 'connection',
            showToUser: false,
            attempt: attempt
          });
          setTimeout(() => this.attemptReconnect(attempt + 1), 1000 * attempt);
        }
      },

      // 调试相关方法 - 更新错误处理
      startDebugging() {
        if (!this.editorManager) {
          handleError('编辑器尚未初始化，无法开始调试', {
            type: 'debug',
            showToUser: true
          });
          return;
        }

        const code = this.editorManager.getValue();
        this.isDebugging = true;
        this.debugState = 'running';
        this.debugLine = 1;
        this.debugMessages = [
          { type: 'info', text: '开始调试会话' },
          { type: 'info', text: '初始化调试器...' }
        ];

        // 切换到调试标签页
        this.switchTab('debug');

        // 尝试通过WebSocket发送调试请求
        const data = {
          type: 'startDebug',
          code: code,
          language: this.editorSettings.language,
          breakpoints: this.breakpoints
        };

        if (safeSocketSend(data)) {
          this.debugMessages.push({ type: 'info', text: '已连接到调试器服务' });
        } else {
          this.debugMessages.push({ type: 'error', text: '无法连接到调试器服务，使用模拟调试' });
          // 模拟调试会话
          setTimeout(() => {
            this.debugMessages.push({ type: 'info', text: '程序已在入口点停止' });
            this.debugState = 'paused';
            this.debugLine = 3;  // 模拟在第3行暂停
          }, 1000);
        }

        // 通知终端模块更新调试控制台
        this._updateDebugConsole();
      },

      /**
       * 暂停调试
       */
      pauseDebugging() {
        if (!this.isDebugging) return;

        this.debugState = 'paused';
        this.debugMessages.push({ type: 'warning', text: '调试已暂停' });

        // 发送暂停命令
        const data = { type: 'pauseDebug' };
        safeSocketSend(data);

        // 通知终端模块更新调试控制台
        this._updateDebugConsole();
      },

      /**
       * 单步调试 - 步进
       */
      stepInto() {
        if (!this.isDebugging || this.debugState !== 'paused') return;

        this.debugMessages.push({ type: 'debug', text: '单步进入' });
        this.debugLine++;  // 模拟移动到下一行

        // 发送单步命令
        const data = { type: 'stepInto' };
        safeSocketSend(data);

        // 通知终端模块更新调试控制台
        this._updateDebugConsole();
      },

      /**
       * 单步调试 - 步过
       */
      stepOver() {
        if (!this.isDebugging || this.debugState !== 'paused') return;

        this.debugMessages.push({ type: 'debug', text: '单步跳过' });
        this.debugLine++;  // 模拟移动到下一行

        // 发送单步命令
        const data = { type: 'stepOver' };
        safeSocketSend(data);

        // 通知终端模块更新调试控制台
        this._updateDebugConsole();
      },

      /**
       * 单步调试 - 步出
       */
      stepOut() {
        if (!this.isDebugging || this.debugState !== 'paused') return;

        this.debugMessages.push({ type: 'debug', text: '单步跳出' });
        this.debugLine++;  // 模拟移动到下一行

        // 发送单步命令
        const data = { type: 'stepOut' };
        safeSocketSend(data);

        // 通知终端模块更新调试控制台
        this._updateDebugConsole();
      },

      /**
       * 停止调试
       */
      stopDebugging() {
        if (!this.isDebugging) return;

        this.isDebugging = false;
        this.debugState = '';
        this.debugLine = 0;
        this.debugMessages.push({ type: 'info', text: '调试会话已结束' });

        // 发送停止命令
        const data = { type: 'stopDebug' };
        safeSocketSend(data);

        // 通知终端模块更新调试控制台
        this._updateDebugConsole();
      },

      /**
       * 清除调试控制台
       */
      clearDebugConsole() {
        this.debugMessages = [];

        // 通知终端模块更新调试控制台
        this._updateDebugConsole();
      },

      /**
       * 添加断点
       * @param {number} line - 断点行号
       */
      addBreakpoint(line) {
        if (!this.breakpoints.includes(line)) {
          this.breakpoints.push(line);

          // 如果正在调试中，发送更新断点命令
          if (this.isDebugging) {
            const data = {
              type: 'updateBreakpoints',
              breakpoints: this.breakpoints
            };
            safeSocketSend(data);
          }
        }
      },

      /**
       * 移除断点
       * @param {number} line - 断点行号
       */
      removeBreakpoint(line) {
        const index = this.breakpoints.indexOf(line);
        if (index !== -1) {
          this.breakpoints.splice(index, 1);

          // 如果正在调试中，发送更新断点命令
          if (this.isDebugging) {
            const data = {
              type: 'updateBreakpoints',
              breakpoints: this.breakpoints
            };
            safeSocketSend(data);
          }
        }
      },

      // 添加新方法：在编辑器中显示数值范围提示
      showArrayValueLimitHint() {
        // 检查是否已经显示过提示，避免重复显示
        if (this._valueLimitHintShown) return;
        this._valueLimitHintShown = true;

        // 创建提示元素
        const hintElement = document.createElement('div');
        hintElement.className = 'array-value-hint';
        hintElement.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: #f8f9fa;
            border-left: 4px solid #ffc107;
            padding: 12px 15px;
            border-radius: 4px;
            font-size: 14px;
            max-width: 300px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 9999;
        `;
        hintElement.innerHTML = `
            <div style="margin-bottom: 8px; font-weight: bold; color: #6c757d;">数组值范围提示</div>
            <div>为了保证可视化效果最佳，建议数组元素的值保持在 1-500 范围内。超过500的值可能会被自动调整。</div>
            <div style="margin-top: 10px; text-align: right;">
                <button style="padding: 4px 8px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">知道了</button>
            </div>
        `;

        // 添加到文档
        document.body.appendChild(hintElement);

        // 添加按钮点击事件
        const button = hintElement.querySelector('button');
        button.addEventListener('click', () => {
            document.body.removeChild(hintElement);
        });

        // 5秒后自动消失
        setTimeout(() => {
            if (hintElement.parentElement) {
                document.body.removeChild(hintElement);
            }
        }, 5000);

        // 重置提示标志，允许一定时间后再次提示
        setTimeout(() => {
            this._valueLimitHintShown = false;
        }, 30000); // 30秒后允许再次显示提示
      },

      // 文件标签管理相关方法
      closeFileTab(tabId) {
        // 查找要关闭的标签索引
        const tabIndex = this.fileTabs.findIndex(tab => tab.id === tabId);
        if (tabIndex === -1) return;

        const isActiveTab = this.fileTabs[tabIndex].active;

        // 如果只有一个标签，不允许关闭
        if (this.fileTabs.length <= 1) {
          console.log('无法关闭唯一的标签');
          return;
        }

        // 保存要关闭标签的内容
        const closingTab = this.fileTabs[tabIndex];
        if (this.editorManager && closingTab.active) {
          closingTab.content = this.editorManager.getValue();
        }

        // 移除标签
        this.fileTabs.splice(tabIndex, 1);

        // 如果关闭的是活动标签，切换到另一个标签
        if (isActiveTab) {
          // 选择前一个标签，如果没有则选择第一个标签
          const newActiveIndex = tabIndex > 0 ? tabIndex - 1 : 0;
          this.switchFileTab(this.fileTabs[newActiveIndex].id);
        }

        console.log(`关闭文件标签: ${closingTab.name}`);
      },

      createNewFileTab() {
        // 生成新标签ID (最大ID + 1)
        const newId = Math.max(...this.fileTabs.map(tab => tab.id)) + 1;

        // 创建新标签
        const newTab = {
          id: newId,
          name: `新文件${newId}`,
          icon: 'js-icon', // 默认为JS文件
          content: '',
          active: false
        };

        // 保存当前活动标签的内容
        const currentActiveTab = this.fileTabs.find(tab => tab.active);
        if (currentActiveTab && this.editorManager) {
          currentActiveTab.content = this.editorManager.getValue();
        }

        // 添加新标签
        this.fileTabs.push(newTab);

        // 切换到新标签
        this.switchFileTab(newId);

        console.log(`创建新文件标签: ${newTab.name}`);
      },

      // 折叠/展开算法分类
      toggleCategory(category) {
        if (this.isCategoryFolded(category)) {
          // 如果已折叠，则展开（从数组中移除）
          const index = this.foldedCategories.indexOf(category);
          if (index !== -1) {
            this.foldedCategories.splice(index, 1);
          }
        } else {
          // 如果已展开，则折叠（添加到数组中）
          this.foldedCategories.push(category);
        }
      },

      // 检查分类是否已折叠
      isCategoryFolded(category) {
        return this.foldedCategories.includes(category);
      },

      // 重新加载动画
      resetAnimation() {
        // 如果没有选择算法或未开始过动画，则不执行任何操作
        if (!this.selectedAlgorithm || (!this.hasStarted && !this.isAnimationComplete)) {
          console.log('没有可重置的动画');
          return;
        }

        // 停止所有正在进行的动画
        this.stopAllAnimationTimers();

        // 重置状态
        this.isPlaying = false;
        this.isPaused = false;
        this.isAnimationComplete = false;
        this.isStepMode = false;
        this.currentAnimationStep = 0;
        this.progress = 0;
        this.updateProgressBar(0);
        
        // 注意：保持hasStarted为true，这样重构后仍然可以点击开始按钮
        // this.hasStarted = false; // 移除此行

        // 清空输出区域
        this.clearOutput();
        if (window.terminalAPI) {
          window.terminalAPI.clear();
        }

        // 重置可视化器状态
        if (this.visualizer) {
          // 确保完全重置动画状态
          this.visualizer.animationState = this.visualizer.getInitialState();

          // 特殊处理链表和二叉树
          if (this.selectedAlgorithm === 'linkedList') {
            this.visualizer.animationState.type = 'linkedList';
            // 重新初始化链表
            this.visualizer.initLinkedListState();
            // 重新初始化链表控制按钮
            this.initLinkedListControls();
            // 输出提示信息
            this.writeToOutput('链表已重置，请使用操作按钮进行交互');
          } else if (this.selectedAlgorithm === 'binaryTree') {
            this.visualizer.animationState.type = 'binaryTree';
            this.visualizer.animationState.tree = null;
            this.visualizer.animationState.current = null;
            this.visualizer.animationState.highlight = [];
            this.visualizer.animationState.path = [];
            this.visualizer.animationState.description = '选择二叉树算法，点击开始按钮查看演示';
          } else {
            this.visualizer.resetAnimationState(this.sortArray);
          }

          // 强制重绘
          this.visualizer.drawVisualization();
        }
      },

      /**
       * 更新调试控制台信息
       */
      _updateDebugConsole() {
        const debugConsole = document.querySelector('.debug-console');
        if (debugConsole) {
          debugConsole.innerHTML = this.debugMessages.map(msg =>
            `<div class="debug-message ${msg.type}">${msg.text}</div>`
          ).join('');

          // 滚动到底部
          debugConsole.scrollTop = debugConsole.scrollHeight;
        }
      },

      /**
       * 初始化链表控制按钮
       */
      initLinkedListControls() {
        // 检查是否已初始化
        if (this._linkedListControlsInitialized) {
          // 即使已初始化，也确保输入框有默认值
          const inputElement = document.querySelector('#linkedlist-input');
          if (inputElement && inputElement.value === '') {
            inputElement.value = '42'; // 设置默认值
            console.log('链表输入框已设置默认值');
          }
          return;
        }

        console.log('初始化链表控制按钮');

        // 在DOM加载完成后设置事件监听器
        this.$nextTick(() => {
          // 获取输入框 - 修复选择器，确保能找到正确的输入框
          const inputElement = document.querySelector('#linkedlist-input');

          // 设置默认值
          if (inputElement) {
            inputElement.value = '42'; // 设置默认值
            console.log('链表输入框已设置默认值');
          } else {
            console.error('找不到链表输入框元素');
          }

          // 搜索按钮
          const searchBtn = document.querySelector('.btn-search');
          if (searchBtn) {
            searchBtn.addEventListener('click', () => {
              if (!inputElement) {
                console.error('找不到输入框元素');
                this.writeToOutput('错误：找不到输入框元素');
                return;
              }

              console.log('输入框值：', inputElement.value);
              const value = inputElement.value !== '' ? parseInt(inputElement.value, 10) : 0;

              if (!isNaN(value)) {
                this.handleLinkedListAction('search', value);
              } else {
                this.writeToOutput('请输入有效的数字进行搜索');
              }
            });
          }

          // 插入操作下拉菜单项
          const insertHeadBtn = document.querySelector('[data-action="insertHead"]');
          const insertTailBtn = document.querySelector('[data-action="insertTail"]');
          const insertAtBtn = document.querySelector('[data-action="insertAt"]');

          if (insertHeadBtn) {
            insertHeadBtn.addEventListener('click', () => {
              if (!inputElement) {
                console.error('找不到输入框元素');
                this.writeToOutput('错误：找不到输入框元素');
                return;
              }

              console.log('头部插入输入框值：', inputElement.value);
              const value = inputElement.value !== '' ? parseInt(inputElement.value, 10) : 0;

              if (!isNaN(value)) {
                this.handleLinkedListAction('insertHead', value);
              } else {
                this.writeToOutput('请输入有效的数字进行头部插入');
              }
            });
          }

          if (insertTailBtn) {
            insertTailBtn.addEventListener('click', () => {
              if (!inputElement) {
                console.error('找不到输入框元素');
                this.writeToOutput('错误：找不到输入框元素');
                return;
              }

              console.log('尾部插入输入框值：', inputElement.value);
              const value = inputElement.value !== '' ? parseInt(inputElement.value, 10) : 0;

              if (!isNaN(value)) {
                this.handleLinkedListAction('insertTail', value);
              } else {
                this.writeToOutput('请输入有效的数字进行尾部插入');
              }
            });
          }

          if (insertAtBtn) {
            insertAtBtn.addEventListener('click', () => {
              if (!inputElement) {
                console.error('找不到输入框元素');
                this.writeToOutput('错误：找不到输入框元素');
                return;
              }

              console.log('指定位置插入输入框值：', inputElement.value);
              const value = inputElement.value !== '' ? parseInt(inputElement.value, 10) : 0;

              if (!isNaN(value)) {
                // 弹出对话框询问插入位置
                const position = prompt('请输入要插入的位置（索引从0开始）:');
                const posIndex = parseInt(position, 10);

                if (!isNaN(posIndex) && posIndex >= 0) {
                  this.handleLinkedListAction('insertAt', value, posIndex);
                } else {
                  this.writeToOutput('请输入有效的位置进行插入');
                }
              } else {
                this.writeToOutput('请输入有效的数字和位置进行插入');
              }
            });
          }

          // 移除操作下拉菜单项
          const removeHeadBtn = document.querySelector('[data-action="removeHead"]');
          const removeTailBtn = document.querySelector('[data-action="removeTail"]');
          const removeAtBtn = document.querySelector('[data-action="removeAt"]');

          if (removeHeadBtn) {
            removeHeadBtn.addEventListener('click', () => {
              this.handleLinkedListAction('removeHead');
            });
          }

          if (removeTailBtn) {
            removeTailBtn.addEventListener('click', () => {
              this.handleLinkedListAction('removeTail');
            });
          }

          if (removeAtBtn) {
            removeAtBtn.addEventListener('click', () => {
              // 弹出对话框询问删除位置
              const position = prompt('请输入要删除的位置（索引从0开始）:');
              const posIndex = parseInt(position, 10);

              if (!isNaN(posIndex) && posIndex >= 0) {
                this.handleLinkedListAction('removeAt', null, posIndex);
              } else {
                this.writeToOutput('请输入有效的位置进行删除');
              }
            });
          }

          // 重置按钮
          const resetBtn = document.querySelector('.btn-reset');
          if (resetBtn) {
            resetBtn.addEventListener('click', () => {
              this.handleLinkedListAction('reset');
            });
          }

          this._linkedListControlsInitialized = true;
        });
      },

      /**
       * 处理链表操作并更新动画
       * @param {string} action - 操作类型
       * @param {number} value - 操作值（如果适用）
       * @param {number} position - 操作位置（如果适用）
       */
      handleLinkedListAction(action, value, position) {
        console.log("处理链表操作:", action, value, position);

        // 添加调试信息，检查输入值
        if (value !== undefined) {
          console.log(`输入值类型: ${typeof value}, 值: ${value}`);
          this.writeToOutput(`当前操作: ${action}, 输入值: ${value}`);
        } else {
          console.log('没有提供输入值');
          this.writeToOutput(`当前操作: ${action}, 没有输入值`);
        }

        // 检查可视化器是否已初始化
        if (!this.visualizer) {
          this.$output.textContent = '错误：可视化器未初始化';
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
              this.animationSteps = result.steps;
              this.currentAnimationStep = 0;
              this.isAnimationComplete = false;
              this.hasStarted = true; // 确保标记动画已开始

              // 更新输出信息
              if (result.operationInfo) {
                this.writeToOutput(`链表操作: ${result.operationInfo}`);
              }

              // 开始播放第一步
              this.isPlaying = true;
              this.isPaused = false;

              // 确保可视化器已准备好
              if (this.visualizer) {
                // 重置可视化器状态
                this.visualizer.animationState.type = 'linkedList';
                // 强制重绘一次
                this.visualizer.drawVisualization();
                // 播放第一步
                this.playNextStep();
              } else {
                console.error('可视化器未初始化');
                this.writeToOutput('错误：可视化器未初始化');
              }
            } else {
              console.error('未生成有效的步骤', result);
              this.writeToOutput(`链表操作失败: 未生成有效的步骤`);
            }
          } catch (error) {
            console.error('处理链表操作时出错:', error);
            this.writeToOutput(`链表操作错误: ${error.message || '未知错误'}`);
          }
        } else {
          console.log('未找到链表操作处理函数，使用visualizer内置方法');

          try {
            // 使用visualizer内置方法生成步骤
            let steps;
            if (typeof this.visualizer.generateSteps === 'function') {
              steps = this.visualizer.generateSteps('linkedList', {
                operation: action,
                value: value,
                position: position
              });
            } else if (typeof this.visualizer.generateLinkedListSteps === 'function') {
              steps = this.visualizer.generateLinkedListSteps(action, value, position);
            }

            console.log('生成的链表步骤:', steps);

            if (steps && steps.length > 0) {
              // 保存步骤并开始播放
              this.animationSteps = steps;
              this.currentAnimationStep = 0;
              this.isAnimationComplete = false;
              this.hasStarted = true; // 确保标记动画已开始

              // 输出操作信息
              const operationInfo = this._getLinkedListOperationInfo(action, value, position);
              this.writeToOutput(`链表操作: ${operationInfo}`);

              // 开始播放第一步
              this.isPlaying = true;
              this.isPaused = false;

              // 确保可视化器已准备好
              if (this.visualizer) {
                // 重置可视化器状态
                this.visualizer.animationState.type = 'linkedList';
                // 强制重绘一次
                this.visualizer.drawVisualization();
                // 播放第一步
                this.playNextStep();
              }
            } else {
              console.error('未生成有效的步骤');
              this.writeToOutput(`链表操作失败: 未生成有效的步骤`);
            }
          } catch (error) {
            console.error('生成链表步骤时出错:', error);
            this.writeToOutput(`链表操作错误: ${error.message || '未知错误'}`);
          }
        }
      },

      /**
       * 获取链表操作的描述信息
       * @param {string} action - 操作类型
       * @param {*} value - 操作值
       * @param {number} position - 操作位置
       * @returns {string} 操作的描述信息
       * @private
       */
      _getLinkedListOperationInfo(action, value, position) {
        return LINKED_LIST_OP_INFO[action] ? 
          LINKED_LIST_OP_INFO[action](value, position) : 
          `未知操作 ${action}`;
      },
    }
  });

  // 监听终端初始化事件
  window.addEventListener('terminal-initialized', () => {
    appState.terminalReady = true;
  });

  // 监听计数排序加载完成事件
  document.addEventListener('counting-sort-loaded', () => {
    console.log('计数排序算法已加载');
    // 如果当前选择的算法是计数排序，且可视化器已初始化，刷新UI
    if (window.app && window.app.selectedAlgorithm === 'countingSort' && window.app.visualizer) {
      // 重置计数排序状态
      window.app.visualizer.animationState.type = 'sorting';
      window.app.visualizer.animationState.countingArray = [];
      window.app.visualizer.animationState.outputArray = [];
      window.app.visualizer.animationState.phase = 'init';

      // 绘制初始状态
      window.app.visualizer.drawVisualization();

      console.log('计数排序UI已更新');
    }
  });
});