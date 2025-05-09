/**
 * Terminal 组件入口文件
 * 将此文件引入到HTML中即可使用Terminal功能
 */

// 加载CSS
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'Code/terminal/terminal.css';
document.head.appendChild(link);

/**
 * 终端工具函数集合 - 集中管理常用功能
 */
const TerminalUtils = {
  /**
   * 日志函数封装
   * @param {number} level 日志级别
   * @param {string} message 日志消息
   * @param  {...any} args 附加参数
   */
  log(level, message, ...args) {
    const LOG_LEVEL = {
      NONE: 0,
      ERROR: 1,
      WARN: 2,
      INFO: 3,
      DEBUG: 4
    };
    
    // 从window.TerminalManager获取日志级别，如果未初始化则使用默认日志级别
    const currentLogLevel = (window.TerminalManager && window.TerminalManager._state) 
      ? window.TerminalManager._state.logLevel 
      : LOG_LEVEL.ERROR;
      
    if (level <= currentLogLevel) {
      switch (level) {
        case LOG_LEVEL.ERROR:
          console.error(`[终端] ${message}`, ...args);
          break;
        case LOG_LEVEL.WARN:
          console.warn(`[终端] ${message}`, ...args);
          break;
        case LOG_LEVEL.INFO:
          console.info(`[终端] ${message}`, ...args);
          break;
        case LOG_LEVEL.DEBUG:
          console.debug(`[终端] ${message}`, ...args);
          break;
      }
    }
  },

  /**
   * 修复xterm-scroll-area高度问题
   * 集中处理滚动区域修复逻辑
   * @param {number} delay 延迟执行时间（毫秒）
   * @returns {Promise} 完成后的Promise
   */
  fixTerminalScrollArea(delay = 0) {
    return new Promise(resolve => {
      setTimeout(() => {
        try {
          const scrollArea = document.querySelector('.xterm-scroll-area');
          if (scrollArea) {
            // 重置高度为auto，防止内容被隐藏
            scrollArea.style.height = 'auto';
          }
          resolve(true);
        } catch (error) {
          console.warn('修复终端滚动区域出错:', error);
          resolve(false);
        }
      }, delay);
    });
  },

  /**
   * 调整终端大小以适应容器
   * 集中处理终端大小调整逻辑
   * @param {Object} options 配置选项
   * @param {number} options.delay 延迟执行时间（毫秒）
   * @param {boolean} options.fixScroll 是否修复滚动区域
   * @param {boolean} options.dispatchEvent 是否派发事件
   * @returns {Promise} 完成后的Promise
   */
  fitTerminal(options = {}) {
    const { delay = 0, fixScroll = true, dispatchEvent = false } = options;
    
    return new Promise(resolve => {
      if (!window.fitAddon || !window.terminal) {
        console.warn('fitTerminal: 终端或fitAddon未初始化');
        resolve(false);
        return;
      }
      
      setTimeout(async () => {
        try {
          // 先获取建议尺寸
          const dims = window.fitAddon.proposeDimensions();
          if (dims) {
            console.log(`建议终端尺寸: ${dims.cols}x${dims.rows}`);
            // 调整终端尺寸
            window.terminal.resize(dims.cols, dims.rows);
          }
          
          // 适应容器
          window.fitAddon.fit();
          
          // 确保xterm元素填满容器
          const container = document.getElementById('terminal-container');
          if (container) {
            const xtermElement = container.querySelector('.xterm');
            if (xtermElement) {
              xtermElement.style.width = '100%';
              xtermElement.style.height = '100%';
            }
          }
          
          // 是否修复滚动区域
          if (fixScroll) {
            await this.fixTerminalScrollArea(0);
          }
          
          // 是否派发事件
          if (dispatchEvent) {
            window.dispatchEvent(new CustomEvent('terminal-resize'));
          }
          
          console.log('终端大小已调整');
          resolve(true);
        } catch (error) {
          console.error('终端大小调整出错:', error);
          resolve(false);
        }
      }, delay);
    });
  },
  
  /**
   * 设置终端大小调整的事件监听器
   * 集中管理所有与终端大小调整相关的事件处理
   */
  setupResizeHandlers() {
    // 已经设置过则跳过
    if (this._resizeHandlersSetup) return;
    this._resizeHandlersSetup = true;
    
    // 监听窗口大小变化
    window.addEventListener('resize', () => {
      this.fitTerminal({ delay: 100, fixScroll: true, dispatchEvent: true });
    });
    
    // 监控容器大小变化
    this.monitorContainerResize();
  },
  
  /**
   * 使用ResizeObserver监控终端容器大小变化
   * 避免在多个地方重复此逻辑
   * @returns {ResizeObserver|Object} observer对象
   */
  monitorContainerResize() {
    const container = document.getElementById('terminal-container');
    if (!container) return null;
    
    // 使用ResizeObserver
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => {
        if (window.fitAddon) {
          try {
            window.fitAddon.fit();
            // 终端大小变化后强制重新计算行列数
            if (window.terminal) {
              const dims = window.fitAddon.proposeDimensions();
              if (dims) {
                window.terminal.resize(dims.cols, dims.rows);
              }
            }
          } catch (e) {
            console.warn('监视容器大小变化时出错:', e);
          }
        }
      });
      observer.observe(container);
      return observer;
    } else {
      // 降级方案
      let lastWidth = container.offsetWidth;
      let lastHeight = container.offsetHeight;
      
      const intervalId = setInterval(() => {
        if (lastWidth !== container.offsetWidth || lastHeight !== container.offsetHeight) {
          lastWidth = container.offsetWidth;
          lastHeight = container.offsetHeight;
          if (window.fitAddon) window.fitAddon.fit();
        }
      }, 1000);
      
      return {
        disconnect: () => clearInterval(intervalId)
      };
    }
  },
  
  /**
   * 批量执行终端大小调整
   * 在多次连续调整大小时避免重复代码
   * @param {Array<number>} delays 延迟时间数组（毫秒）
   */
  batchFitTerminal(delays = [0, 100, 500]) {
    delays.forEach(delay => {
      this.fitTerminal({ delay, fixScroll: true });
    });
  },
  
  /**
   * 动态加载xterm.js依赖
   */
  loadXtermScript() {
    console.log('正在动态加载xterm.js');
    
    // 加载xterm.js主脚本（使用本地文件）
    const xtermScript = document.createElement('script');
    xtermScript.src = 'lib/xterm/xterm.js';
    xtermScript.onload = () => {
      console.log('xterm.js加载成功');
      
      // 加载fit插件（使用本地文件）
      const fitAddonScript = document.createElement('script');
      fitAddonScript.src = 'lib/xterm/xterm-addon-fit.js';
      fitAddonScript.onload = () => {
        console.log('xterm-addon-fit加载成功');
        if (window.TerminalManager) {
          setTimeout(() => window.TerminalManager.initialize(), 300);
        }
      };
      document.head.appendChild(fitAddonScript);
    };
    document.head.appendChild(xtermScript);
  },
  
  /**
   * 动态加载xterm.css
   */
  loadXtermCSS() {
    console.log('正在动态加载xterm.css');
    const xtermCSS = document.createElement('link');
    xtermCSS.rel = 'stylesheet';
    xtermCSS.href = 'lib/xterm/xterm.css';
    document.head.appendChild(xtermCSS);
  },

  /**
   * 统一终端初始化
   * 加载所有依赖并初始化终端
   * @param {Object} options 初始化选项
   * @returns {Promise<Object>} 初始化后的终端管理器
   */
  async init(options = {}) {
    const {
      autoLoadDependencies = true,
      autoInitUI = true,
      logLevel = 3
    } = options;
    
    this.log(1, '开始统一终端初始化流程');
    
    try {
      // 步骤1: 加载基础管理器
      await this.loadBasePanelManager();
      
      // 步骤2: 加载其他面板管理器
      await this.loadPanelManagers();
      
      // 步骤3: 加载xterm.js依赖（如果需要）
      if (autoLoadDependencies) {
        await this.loadXtermModules();
      }
      
      // 步骤4: 初始化UI（如果需要）
      if (autoInitUI) {
        await this.initializeUI();
      }
      
      // 步骤5: 初始化终端管理器
      if (window.TerminalManager) {
        window.TerminalManager.setLogLevel(logLevel);
        window.TerminalManager.initialize();
        
        // 通知用户初始化成功
        this.log(2, '终端初始化完成');
        return window.TerminalManager;
      } else {
        throw new Error('终端管理器初始化失败');
      }
    } catch (error) {
      this.log(1, '终端初始化出错:', error);
      throw error;
    }
  },
  
  /**
   * 加载基础面板管理器
   * @returns {Promise<boolean>} 是否成功加载
   */
  async loadBasePanelManager() {
    return new Promise((resolve, reject) => {
      // 检查是否已加载
      if (typeof window.createBasePanelManager === 'function') {
        this.log(3, '基础面板管理器已加载');
        return resolve(true);
      }
      
      // 加载基础面板管理器
      const script = document.createElement('script');
      script.src = 'Code/terminal/basePanelManager.js';
      script.onload = () => {
        if (typeof window.createBasePanelManager === 'function') {
          this.log(2, '基础面板管理器加载成功');
          resolve(true);
        } else {
          const error = '基础面板管理器加载失败';
          this.log(1, error);
          reject(new Error(error));
        }
      };
      script.onerror = (err) => {
        this.log(1, '基础面板管理器加载出错');
        reject(err);
      };
      document.head.appendChild(script);
    });
  },
  
  /**
   * 加载面板管理器
   * @returns {Promise<boolean>} 是否全部加载成功
   */
  async loadPanelManagers() {
    const panelManagers = [
      { name: '标签面板', src: 'Code/terminal/tabPanelManager.js' },
      { name: '问题面板', src: 'Code/terminal/problemsPanelManager.js' },
      { name: '输出面板', src: 'Code/terminal/outputPanelManager.js' },
      { name: '调试面板', src: 'Code/terminal/debugPanelManager.js' }
    ];
    
    // 按顺序加载管理器
    for (const manager of panelManagers) {
      await this.loadScript(manager.src, manager.name);
    }
    
    return true;
  },
  
  /**
   * 加载脚本
   * @param {string} src 脚本路径
   * @param {string} name 脚本名称（用于日志）
   * @returns {Promise<boolean>} 是否加载成功
   */
  loadScript(src, name) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => {
        this.log(3, `${name}加载成功`);
        resolve(true);
      };
      script.onerror = (err) => {
        this.log(1, `${name}加载失败`, err);
        // 不中断其他脚本加载
        resolve(false);
      };
      document.head.appendChild(script);
    });
  },
  
  /**
   * 初始化UI
   * @returns {Promise<void>}
   */
  async initializeUI() {
    // 创建VS Code风格UI
    if (typeof this.createVSCodeUI === 'function') {
      console.log('正在创建VS Code风格UI...');
      this.createVSCodeUI();
      this.addPanelResizing();
      console.log('VS Code风格UI创建完成');
    } else {
      console.warn('createVSCodeUI方法不存在，无法创建VS Code风格UI');
    }
    return Promise.resolve();
  },
  
  /**
   * 加载xterm.js模块和插件
   * @returns {Promise<boolean>} 是否成功加载
   */
  async loadXtermModules() {
    try {
      // 检查是否已加载
      if (typeof window.Terminal !== 'undefined') {
        this.log(3, 'xterm.js模块已加载');
        return true;
      }
      
      // 加载xterm.js主模块
      this.log(2, '开始加载xterm模块...');
      
      // 尝试使用import动态加载
      try {
        const xtermModule = await import('https://cdn.jsdelivr.net/npm/xterm@5.1.0/lib/xterm.js');
        window.Terminal = xtermModule.Terminal;
        this.log(2, 'xterm.js模块加载成功');
      } catch (e) {
        // 回退到脚本标签加载
        await this.loadXtermScript();
      }
      
      // 加载CSS
      await this.loadXtermCSS();
      
      // 加载fit插件
      try {
        const fitAddonModule = await import('https://cdn.jsdelivr.net/npm/xterm-addon-fit@0.7.0/lib/xterm-addon-fit.js');
        window.FitAddon = fitAddonModule;
        this.log(2, 'xterm-addon-fit模块加载成功');
      } catch (e) {
        this.log(1, 'fit插件加载失败，尝试使用脚本标签加载');
        
        // 通过脚本标签加载fit插件
        await this.loadScript('https://cdn.jsdelivr.net/npm/xterm-addon-fit@0.7.0/lib/xterm-addon-fit.js', 'Fit插件');
      }
      
      return true;
    } catch (error) {
      this.log(1, '加载xterm模块失败', error);
      throw error;
    }
  },
  
  /**
   * 检查依赖是否已加载
   * @returns {boolean} 是否已加载所有依赖
   */
  checkDependencies() {
    const isXtermLoaded = typeof window.Terminal !== 'undefined';
    const isFitAddonLoaded = typeof window.FitAddon !== 'undefined';
    const isBasePanelManagerLoaded = typeof window.createBasePanelManager === 'function';
    
    this.log(3, `依赖检查: xterm=${isXtermLoaded}, fitAddon=${isFitAddonLoaded}, basePanelManager=${isBasePanelManagerLoaded}`);
    
    return isXtermLoaded && isFitAddonLoaded && isBasePanelManagerLoaded;
  },

  /**
   * 提供给Vue应用的终端状态同步方法
   * @param {Object} vueApp Vue应用实例
   */
  syncTerminalState(vueApp) {
    if (!vueApp) return;
    
    // 设置全局同步方法
    window.syncTerminalState = (app) => {
      // 更新Vue应用中的终端相关状态
      if (app) {
        app.terminal = this._term || null;
        app.terminalManager = window.terminalUtils || null;
        app.isTerminalReady = this._state.initialized;
        
        // 同步当前活动标签页
        if (app.activeOutputTab) {
          this._state.activeTab = app.activeOutputTab;
        }
      }
      
      // 更新appState全局状态
      if (window.appState) {
        window.appState.terminalReady = this._state.initialized;
      }
      
      // 返回当前状态给调用者
      return {
        terminal: this._term,
        initialized: this._state.initialized,
        activeTab: this._state.activeTab,
        debugMode: this._state.debugMode
      };
    };
    
    // 立即执行一次同步
    return window.syncTerminalState(vueApp);
  }
};

// 导出工具函数到全局变量，方便其他模块使用
window.terminalUtils = TerminalUtils;

// ======= 核心终端管理器类 =======
(function() {
  // 日志级别常量
  const LOG_LEVEL = {
    NONE: 0,
    ERROR: 1,
    WARN: 2,
    INFO: 3,
    DEBUG: 4
  };

  // 创建TerminalManager类
  class TerminalManagerClass {
    constructor() {
      // 内部状态
      this._state = {
        initialized: false,
        ready: false,
        error: null,
        terminals: [{ id: 1, name: '终端 1', active: true }],
        isPanelVisible: true,
        isPanelMaximized: false,
        isOutputScrollLocked: false,
        activeTab: 'result',
        logLevel: LOG_LEVEL.ERROR
      };

      // 终端实例和插件
      this._terminal = null;
      this._fitAddon = null;
      this._webLinksAddon = null;

      // 终端历史记录相关
      this._commandHistory = [];
      this._historyIndex = -1;
      this._currentInput = "";

      // 事件回调
      this._callbacks = {
        onReady: [],
        onError: [],
        onCommandExecuted: [],
        onResize: [],
        onTabSwitched: [],
        onSyntaxCheck: []
      };

      // 面板拖拽状态
      this._isDragging = false;

      // 问题列表
      this._problems = [];
    }

    /**
     * 获取终端实例
     * @returns {Terminal|null} xterm.js终端实例
     */
    get terminal() {
      return this._terminal;
    }

    /**
     * 获取当前终端状态
     * @returns {Object} 状态对象
     */
    get state() {
      return {...this._state}; // 返回副本以防止外部修改
    }

    /**
     * 获取命令历史
     * @returns {Array} 命令历史数组
     */
    get commandHistory() {
      return [...this._commandHistory]; // 返回副本
    }

    /**
     * 获取问题列表
     * @returns {Array} 问题列表
     */
    get problems() {
      return [...this._problems]; // 返回副本
    }

    /**
     * 日志记录
     * @param {number} level 日志级别
     * @param {string} message 日志消息
     * @param  {...any} args 附加参数
     */
    log(level, message, ...args) {
      // 使用全局TerminalUtils记录日志
      if (window.terminalUtils && typeof window.terminalUtils.log === 'function') {
        return window.terminalUtils.log(level, message, ...args);
      }
      
      // 向后兼容的实现
      if (level <= this._state.logLevel) {
        switch (level) {
          case LOG_LEVEL.ERROR:
            console.error(`[终端] ${message}`, ...args);
            break;
          case LOG_LEVEL.WARN:
            console.warn(`[终端] ${message}`, ...args);
            break;
          case LOG_LEVEL.INFO:
            console.info(`[终端] ${message}`, ...args);
            break;
          case LOG_LEVEL.DEBUG:
            console.debug(`[终端] ${message}`, ...args);
            break;
        }
      }
    }

    /**
     * 设置日志级别
     * @param {number} level 日志级别
     */
    setLogLevel(level) {
      if (Object.values(LOG_LEVEL).includes(level)) {
        this._state.logLevel = level;
        this.log(LOG_LEVEL.INFO, `日志级别已设置为: ${level}`);
      } else {
        this.log(LOG_LEVEL.ERROR, `无效的日志级别: ${level}`);
      }
    }

    /**
     * 初始化终端
     * @returns {boolean} 是否成功初始化
     */
    initialize() {
      this.log(LOG_LEVEL.DEBUG, '开始初始化终端...');
      
      // 避免重复初始化
      if (this._state.initialized) {
        this.log(LOG_LEVEL.INFO, '终端已初始化');
        return true;
      }

      // 检查依赖是否加载
      if (typeof Terminal === 'undefined') {
        const error = 'Terminal未定义。确保已加载xterm.js';
        this._state.error = error;
        this.log(LOG_LEVEL.ERROR, error);
        this._triggerCallbacks('onError', error);
        return false;
      }

      // 终端容器元素
      const terminalContainer = document.getElementById('terminal-container');
      if (!terminalContainer) {
        const error = '找不到终端容器元素 #terminal-container';
        this._state.error = error;
        this.log(LOG_LEVEL.ERROR, error);
        this._triggerCallbacks('onError', error);
        return false;
      }

      // 创建终端实例
      try {
        this._terminal = new Terminal({
          cursorBlink: true,
          fontSize: 14,
          fontFamily: 'Consolas, "Courier New", monospace',
          theme: {
            background: '#ffffff',
            foreground: '#333333',
            cursor: '#333333',
            selection: 'rgba(0, 120, 215, 0.3)',
            black: '#000000',
            red: '#cd3131',
            green: '#00bc00',
            yellow: '#949800',
            blue: '#0451a5',
            magenta: '#bc05bc',
            cyan: '#0598bc',
            white: '#555555',
            brightBlack: '#666666',
            brightRed: '#cd3131',
            brightGreen: '#14ce14',
            brightYellow: '#b5ba00',
            brightBlue: '#0451a5',
            brightMagenta: '#bc05bc',
            brightCyan: '#0598bc',
            brightWhite: '#a5a5a5'
          },
          allowTransparency: true,
          scrollback: 1000,
          disableStdin: false
        });

        // 加载FitAddon插件
        if (typeof FitAddon !== 'undefined' && FitAddon.FitAddon) {
          this.log(LOG_LEVEL.INFO, '加载FitAddon插件');
          this._fitAddon = new FitAddon.FitAddon();
          this._terminal.loadAddon(this._fitAddon);
        } else {
          // 尝试使用@xterm/addon-fit的新导入方式
          try {
            if (typeof window.FitAddon === 'object') {
              this.log(LOG_LEVEL.INFO, '使用@xterm/addon-fit插件');
              this._fitAddon = new window.FitAddon.FitAddon();
              this._terminal.loadAddon(this._fitAddon);
            } else {
              this.log(LOG_LEVEL.WARN, '无法加载FitAddon插件，终端大小调整功能不可用');
            }
          } catch (e) {
            this.log(LOG_LEVEL.WARN, '加载FitAddon插件失败:', e);
          }
        }

        // 打开终端
        this._terminal.open(terminalContainer);

        // 设置全局对象以便TerminalUtils访问
        window.terminal = this._terminal;
        window.fitAddon = this._fitAddon;

        // 自适应大小
        if (this._fitAddon) {
          // 使用TerminalUtils批量适应终端大小
          if (window.terminalUtils) {
            window.terminalUtils.batchFitTerminal([0, 100, 500]);
            window.terminalUtils.setupResizeHandlers();
          } else {
            // 向后兼容，以防TerminalUtils未加载
            this.fitTerminal();
            window.addEventListener('resize', () => this.fitTerminal());
            setTimeout(() => this.fitTerminal(), 0);
            setTimeout(() => this.fitTerminal(), 100);
            setTimeout(() => this.fitTerminal(), 500);
          }
        }

        // 设置焦点
        this._terminal.focus();

        // 显示欢迎信息
        this._terminal.write('\r\n欢迎使用 AVCE 终端\r\n\r\n');
        this.showPrompt();

        // 处理终端输入
        this._setupTerminalHandlers();

        // 标记初始化完成
        this._state.initialized = true;
        this._state.ready = true;
        this._triggerCallbacks('onReady');

        return true;
      } catch (error) {
        this._state.error = error.message;
        this.log(LOG_LEVEL.ERROR, '初始化终端失败:', error);
        this._triggerCallbacks('onError', error.message);
        return false;
      }
    }

    /**
     * 适配终端大小
     */
    fitTerminal() {
      if (!this._fitAddon || !this._terminal) return;
      
      // 优先使用TerminalUtils
      if (window.terminalUtils && typeof window.terminalUtils.fitTerminal === 'function') {
        const result = window.terminalUtils.fitTerminal({
          fixScroll: true,
          dispatchEvent: true
        });
        
        // 触发回调
        if (this._terminal) {
          this._triggerCallbacks('onResize', {
            rows: this._terminal.rows,
            cols: this._terminal.cols
          });
        }
        
        return result;
      }
      
      // 向后兼容的实现
      try {
        this._fitAddon.fit();
        const dimensions = this._terminal.rows + 'x' + this._terminal.cols;
        this.log(LOG_LEVEL.DEBUG, `终端大小已调整: ${dimensions}`);
        this._triggerCallbacks('onResize', {
          rows: this._terminal.rows,
          cols: this._terminal.cols
        });
      } catch (error) {
        this.log(LOG_LEVEL.ERROR, '终端大小调整失败:', error);
      }
    }

    /**
     * 显示命令提示符
     */
    showPrompt() {
      if (!this._terminal) return;
      this._terminal.write('\r\n> ');
    }

    /**
     * 设置终端处理程序
     */
    _setupTerminalHandlers() {
      if (!this._terminal) return;
      
      let currentLineContent = '';
      
      this._terminal.onData(data => {
        const char = data.charCodeAt(0);
        
        if (char === 13) { // 回车键
          // 处理命令
          const command = currentLineContent.trim();
          this._terminal.write('\r\n');
          
          if (command) {
            this.processCommand(command);
            this._addToHistory(command);
          } else {
            this.showPrompt();
          }
          
          currentLineContent = '';
          this._historyIndex = -1;
        } else if (char === 127) { // 退格键
          if (currentLineContent.length > 0) {
            currentLineContent = currentLineContent.slice(0, -1);
            this._terminal.write('\b \b');
          }
        } else if (data === '\u001b[A') { // 上箭头
          // 清除当前行
          this._terminal.write('\r\x1b[K');
          this._terminal.write('> ');
          
          // 获取历史记录中的命令
          const historyCommand = this.navigateHistory('up', currentLineContent);
          currentLineContent = historyCommand;
          this._terminal.write(currentLineContent);
        } else if (data === '\u001b[B') { // 下箭头
          // 清除当前行
          this._terminal.write('\r\x1b[K');
          this._terminal.write('> ');
          
          // 获取历史记录中的命令
          const historyCommand = this.navigateHistory('down', currentLineContent);
          currentLineContent = historyCommand;
          this._terminal.write(currentLineContent);
        } else if (char >= 32) { // 可打印字符
          currentLineContent += data;
          this._terminal.write(data);
        }
      });
    }

    /**
     * 处理终端命令
     * @param {string} command 命令
     */
    processCommand(command) {
      if (!command) return;
      
      // 将命令添加到历史记录
      this._addToHistory(command);
      this._historyIndex = -1;
      
      // 解析和执行命令
      const args = command.split(' ');
      const cmd = args[0].toLowerCase();
      
      switch (cmd) {
        case 'help':
          this._showHelp();
          break;
        case 'clear':
          this._terminal.clear();
          this.showPrompt();
          return;
        case 'run':
          this._runCode();
          break;
        case 'format':
          this._formatCode();
          break;
        case 'setlang':
          if (args[1]) {
            this._setLanguage(args[1]);
          } else {
            this._terminal.write('\r\n请指定语言：python, c, cpp, java, javascript\r\n');
          }
          break;
        case 'info':
          this._showProjectInfo();
          break;
        case 'echo':
          this._terminal.write('\r\n' + args.slice(1).join(' ') + '\r\n');
          break;
        case 'loglevel':
          this._setLogLevel(args[1]);
          break;
        default:
          this._terminal.write(`\r\n未知命令：${cmd}\r\n输入 'help' 查看可用命令\r\n`);
      }
      
      // 显示新提示符
      this.showPrompt();
      
      // 触发命令执行回调
      this._triggerCallbacks('onCommandExecuted', command);
    }
    
    /**
     * 显示帮助信息
     * @private
     */
    _showHelp() {
      this._terminal.write('\r\n可用命令：\r\n');
      this._terminal.write('  help             - 显示此帮助信息\r\n');
      this._terminal.write('  clear            - 清空终端\r\n');
      this._terminal.write('  run              - 运行当前代码\r\n');
      this._terminal.write('  format           - 格式化当前代码\r\n');
      this._terminal.write('  setlang [lang]   - 设置编程语言 (python/c/cpp/java/javascript)\r\n');
      this._terminal.write('  info             - 显示项目信息\r\n');
      this._terminal.write('  echo [text]      - 显示文本\r\n');
      this._terminal.write('  loglevel [level] - 设置日志级别 (NONE/ERROR/WARN/INFO/DEBUG)\r\n');
    }
    
    /**
     * 运行当前代码
     * @private
     */
    _runCode() {
      this._terminal.write('\r\n正在执行代码...\r\n');
      
      if (window.app && typeof window.app.runCode === 'function') {
        window.app.runCode();
        this._terminal.write('代码执行请求已发送。查看输出面板获取结果。\r\n');
      } else {
        this._terminal.write('无法执行代码：未找到runCode方法。\r\n');
      }
    }
    
    /**
     * 格式化当前代码
     * @private
     */
    _formatCode() {
      this._terminal.write('\r\n正在格式化代码...\r\n');
      
      if (window.editor && typeof window.editor.getAction === 'function') {
        const formatAction = window.editor.getAction('editor.action.formatDocument');
        if (formatAction) {
          formatAction.run();
          this._terminal.write('代码已格式化。\r\n');
        } else {
          this._terminal.write('无法格式化代码：未找到格式化操作。\r\n');
        }
      } else {
        this._terminal.write('无法格式化代码：未找到编辑器API。\r\n');
      }
    }
    
    /**
     * 设置编程语言
     * @param {string} lang 语言名称
     * @private
     */
    _setLanguage(lang) {
      lang = lang.toLowerCase();
      const supportedLangs = ['python', 'py', 'c', 'cpp', 'c++', 'java', 'javascript', 'js'];
      
      if (supportedLangs.includes(lang)) {
        // 标准化语言名称
        let normalizedLang = lang;
        if (lang === 'py') normalizedLang = 'python';
        if (lang === 'c++') normalizedLang = 'cpp';
        if (lang === 'js') normalizedLang = 'javascript';
        
        if (window.app && typeof window.app.changeEditorLanguage === 'function') {
          window.app.changeEditorLanguage(normalizedLang);
          this._terminal.write(`\r\n已将语言设置为: ${normalizedLang}\r\n`);
        } else {
          this._terminal.write('\r\n无法设置语言：未找到changeEditorLanguage方法。\r\n');
        }
      } else {
        this._terminal.write(`\r\n不支持的语言: ${lang}\r\n`);
        this._terminal.write('支持的语言: python, c, cpp, java, javascript\r\n');
      }
    }
    
    /**
     * 显示项目信息
     * @private
     */
    _showProjectInfo() {
      this._terminal.write('\r\n算法可视化代码编辑器 (AVCE)\r\n');
      this._terminal.write('版本: 1.0.0\r\n');
      this._terminal.write('\r\n');
      this._terminal.write('功能:\r\n');
      this._terminal.write('- 支持多种编程语言\r\n');
      this._terminal.write('- 算法可视化\r\n');
      this._terminal.write('- 集成终端\r\n');
      this._terminal.write('- 代码高亮与格式化\r\n');
      
      // 环境信息
      const language = window.app && window.app.$data ? window.app.$data.editorSettings.language : '未知';
      this._terminal.write('\r\n环境信息:\r\n');
      this._terminal.write(`- 当前语言: ${language}\r\n`);
      this._terminal.write(`- 终端版本: xterm.js ${typeof Terminal !== 'undefined' ? Terminal.version || '未知' : '未知'}\r\n`);
    }
    
    /**
     * 设置日志级别
     * @param {string} levelName 日志级别名称
     * @private
     */
    _setLogLevel(levelName) {
      const LOG_LEVEL = {
        NONE: 0,
        ERROR: 1,
        WARN: 2,
        INFO: 3,
        DEBUG: 4
      };
      
      if (!levelName) {
        const currentLevelName = Object.keys(LOG_LEVEL).find(k => LOG_LEVEL[k] === this._logLevel) || 'UNKNOWN';
        this._terminal.write(`\r\n当前日志级别: ${currentLevelName}\r\n`);
        this._terminal.write('可用的日志级别: NONE, ERROR, WARN, INFO, DEBUG\r\n');
        return;
      }
      
      levelName = levelName.toUpperCase();
      
      if (LOG_LEVEL[levelName] !== undefined) {
        this.setLogLevel(LOG_LEVEL[levelName]);
        this._terminal.write(`\r\n日志级别已设置为: ${levelName}\r\n`);
      } else {
        this._terminal.write(`\r\n无效的日志级别: ${levelName}\r\n`);
        this._terminal.write('可用的日志级别: NONE, ERROR, WARN, INFO, DEBUG\r\n');
      }
    }

    /**
     * 添加命令到历史
     * @param {string} command 命令
     */
    _addToHistory(command) {
      if (!command || command.trim() === '') return;
      
      // 避免重复添加相同的命令
      if (this._commandHistory.length === 0 || this._commandHistory[0] !== command) {
        this._commandHistory.unshift(command);
        // 限制历史记录大小
        if (this._commandHistory.length > 50) {
          this._commandHistory.pop();
        }
      }
    }

    /**
     * 导航历史记录
     * @param {string} direction 方向 ('up' 或 'down')
     * @param {string} currentInput 当前输入
     * @returns {string} 新输入
     */
    navigateHistory(direction, currentInput) {
      if (this._commandHistory.length === 0) return currentInput;
      
      if (direction === 'up') {
        // 向上导航，获取较早的命令
        if (this._historyIndex === -1) {
          // 保存当前输入以便返回
          this._currentInput = currentInput;
          this._historyIndex = 0;
        } else if (this._historyIndex < this._commandHistory.length - 1) {
          this._historyIndex++;
        }
        return this._commandHistory[this._historyIndex];
      } else if (direction === 'down') {
        // 向下导航，获取较新的命令
        if (this._historyIndex > 0) {
          this._historyIndex--;
          return this._commandHistory[this._historyIndex];
        } else if (this._historyIndex === 0) {
          this._historyIndex = -1;
          return this._currentInput;
        }
      }
      
      return currentInput;
    }

    /**
     * 添加面板拖拽调整功能
     */
    addPanelResizing() {
      // 优先使用TerminalUtils
      if (window.terminalUtils && typeof window.terminalUtils.addPanelResizing === 'function') {
        return window.terminalUtils.addPanelResizing();
      }
      
      this.log(LOG_LEVEL.INFO, '添加面板拖拽调整功能');
      
      // 获取面板容器
      const panelContainer = document.querySelector('.panel-container');
      if (!panelContainer) {
        this.log(LOG_LEVEL.ERROR, '找不到.panel-container元素');
        return;
      }
      
      // 获取调整手柄
      const resizeHandle = panelContainer.querySelector('.panel-resize-handle');
      if (!resizeHandle) {
        // 创建调整手柄
        this.log(LOG_LEVEL.INFO, '创建调整手柄');
        const handle = document.createElement('div');
        handle.className = 'panel-resize-handle';
        handle.innerHTML = '<div class="handle-line"></div>';
        panelContainer.appendChild(handle);
        
        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
          .panel-resize-handle {
            height: 5px;
            cursor: ns-resize;
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            background-color: transparent;
            z-index: 100;
          }
          
          .panel-resize-handle .handle-line {
            height: 1px;
            background-color: #e0e0e0;
            position: absolute;
            top: 2px;
            left: 0;
            right: 0;
          }
          
          .panel-resize-handle:hover .handle-line {
            background-color: #2196f3;
            height: 2px;
            top: 1px;
          }
        `;
        document.head.appendChild(style);
        
        // 使用新创建的手柄
        this._setupResizeHandlers(handle, panelContainer);
      } else {
        // 使用现有的调整手柄
        this._setupResizeHandlers(resizeHandle, panelContainer);
      }
    }
    
    /**
     * 设置调整处理程序
     * @param {HTMLElement} handle 调整手柄
     * @param {HTMLElement} container 容器
     * @private
     */
    _setupResizeHandlers(handle, container) {
      let startY, startHeight, parentHeight;
      
      const onMouseDown = (e) => {
        startY = e.clientY;
        startHeight = container.offsetHeight;
        parentHeight = container.parentElement.offsetHeight;
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        
        document.body.style.cursor = 'ns-resize';
        document.body.style.userSelect = 'none';
        
        // 防止事件冒泡和默认行为
        e.preventDefault();
        e.stopPropagation();
      };
      
      const onMouseMove = (e) => {
        const deltaY = startY - e.clientY;
        const newHeight = Math.min(
          Math.max(startHeight + deltaY, 100), // 最小高度为100px
          parentHeight - 200 // 保留一些空间给其他元素
        );
        
        container.style.height = `${newHeight}px`;
        
        // 如果终端可见，调整其大小
        if (document.getElementById('terminal-container').style.visibility !== 'hidden' 
            && this._fitAddon) {
          this.fitTerminal();
        }
        
        // 防止事件冒泡和默认行为
        e.preventDefault();
        e.stopPropagation();
      };
      
      const onMouseUp = (e) => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        
        // 调整所有面板大小和终端
        this.fitTerminal();
        
        // 派发容器大小变化事件
        window.dispatchEvent(new CustomEvent('panel-resize'));
        
        // 防止事件冒泡和默认行为
        e.preventDefault();
        e.stopPropagation();
      };
      
      // 添加鼠标按下事件监听
      handle.addEventListener('mousedown', onMouseDown);
      
      // 标记已设置，避免重复添加
      handle._resizeHandlersAttached = true;
    }

    /**
     * 创建VS Code风格UI
     */
    createVSCodeUI() {
      // 优先使用TerminalUtils
      if (window.terminalUtils && typeof window.terminalUtils.createVSCodeUI === 'function') {
        window.terminalUtils.createVSCodeUI();
        
        // 确保标签事件初始化和显示终端标签
        if (window.TabPanelManager) {
          window.TabPanelManager.initialize();
        }
        
        this.switchTab('terminal');
        return;
      }
      
      this.log(LOG_LEVEL.INFO, '创建VS Code风格UI');
      
      // 获取或创建面板容器
      let panelContainer = document.querySelector('.panel-container');
      
      if (!panelContainer) {
        // 创建面板容器
        panelContainer = document.createElement('div');
        panelContainer.className = 'panel-container';
        document.body.appendChild(panelContainer);
      }
      
      // 标签栏
      let panelTabs = panelContainer.querySelector('.panel-tabs');
      if (!panelTabs) {
        panelTabs = document.createElement('div');
        panelTabs.className = 'panel-tabs';
        panelContainer.appendChild(panelTabs);
        
        // 创建标签
        const tabsData = [
          { id: 'terminal', title: '终端', icon: '⌨' },
          { id: 'result', title: '输出', icon: '📄' },
          { id: 'problems', title: '问题', icon: '⚠' },
          { id: 'debug', title: '调试', icon: '🔍' }
        ];
        
        tabsData.forEach(tab => {
          const tabElement = document.createElement('div');
          tabElement.className = 'tab';
          tabElement.setAttribute('data-tab', tab.id);
          tabElement.innerHTML = `<span class="tab-icon">${tab.icon}</span><span class="tab-title">${tab.title}</span>`;
          panelTabs.appendChild(tabElement);
          
          // 添加点击事件
          tabElement.addEventListener('click', () => {
            this.switchTab(tab.id);
          });
        });
      }
      
      // 创建内容容器
      this._createPanelContents(panelContainer);
      
      // 添加样式
      this._addVSCodeStyles();
      
      // 添加调整大小功能
      this.addPanelResizing();
      
      // 初始化标签事件
      if (window.TabPanelManager) {
        window.TabPanelManager.initialize();
      }
      
      // 默认显示终端标签
      this.switchTab('terminal');
    }

    /**
     * 创建面板内容
     * @param {HTMLElement} container 容器
     * @private
     */
    _createPanelContents(container) {
      // 终端面板 - 使用已有的terminal-container
      let terminalPanel = document.getElementById('terminal-container');
      if (!terminalPanel) {
        terminalPanel = document.createElement('div');
        terminalPanel.id = 'terminal-container';
        container.appendChild(terminalPanel);
      }
      
      // 输出面板
      let outputPanel = container.querySelector('.output-panel');
      if (!outputPanel) {
        outputPanel = document.createElement('div');
        outputPanel.className = 'output-panel';
        outputPanel.innerHTML = `
          <div class="output-toolbar">
            <div class="action-btn" title="清除输出"><span>🗑</span></div>
            <div class="action-btn" title="锁定滚动"><span>🔒</span></div>
          </div>
          <div class="output"></div>
        `;
        container.appendChild(outputPanel);
        
        // 添加事件处理
        const clearBtn = outputPanel.querySelector('.action-btn[title="清除输出"]');
        const lockBtn = outputPanel.querySelector('.action-btn[title="锁定滚动"]');
        
        if (clearBtn && window.OutputPanelManager) {
          clearBtn.addEventListener('click', window.OutputPanelManager.clearOutput);
        }
        
        if (lockBtn && window.OutputPanelManager) {
          lockBtn.addEventListener('click', window.OutputPanelManager.toggleOutputScrollLock);
        }
      }
      
      // 问题面板
      let problemsPanel = container.querySelector('.problems-panel');
      if (!problemsPanel) {
        problemsPanel = document.createElement('div');
        problemsPanel.className = 'problems-panel';
        problemsPanel.innerHTML = `
          <div class="problems-toolbar">
            <div class="action-btn" title="刷新问题"><span>🔄</span></div>
            <div class="action-btn" title="清除所有问题"><span>🗑</span></div>
            <input type="text" class="problems-filter" placeholder="筛选问题..." />
          </div>
          <div class="problems-list"></div>
        `;
        container.appendChild(problemsPanel);
        
        // 添加事件处理
        if (window.ProblemsPanelManager) {
          const refreshBtn = problemsPanel.querySelector('.action-btn[title="刷新问题"]');
          const clearBtn = problemsPanel.querySelector('.action-btn[title="清除所有问题"]');
          const filterInput = problemsPanel.querySelector('.problems-filter');
          
          if (refreshBtn) {
            refreshBtn.addEventListener('click', window.ProblemsPanelManager.updateProblemsList);
          }
          
          if (clearBtn) {
            clearBtn.addEventListener('click', window.ProblemsPanelManager.clearProblems);
          }
          
          if (filterInput) {
            filterInput.addEventListener('input', () => {
              window.ProblemsPanelManager.updateProblemsList(filterInput.value);
            });
          }
        }
      }
      
      // 调试面板
      let debugPanel = container.querySelector('.debug-panel');
      if (!debugPanel) {
        debugPanel = document.createElement('div');
        debugPanel.className = 'debug-panel';
        debugPanel.innerHTML = `
          <div class="debug-toolbar">
            <div class="debug-buttons">
              <div class="action-btn" title="开始调试"><span>▶</span></div>
              <div class="action-btn" title="单步进入"><span>⤵</span></div>
              <div class="action-btn" title="单步跳过"><span>⤏</span></div>
              <div class="action-btn" title="单步跳出"><span>⤴</span></div>
              <div class="action-btn" title="停止调试"><span>⏹</span></div>
            </div>
            <div class="action-btn" title="清除控制台"><span>🗑</span></div>
            <select class="debug-level-select">
              <option value="verbose">详细</option>
              <option value="info" selected>信息</option>
              <option value="warning">警告</option>
              <option value="error">错误</option>
            </select>
          </div>
          <div class="debug-content"></div>
        `;
        container.appendChild(debugPanel);
        
        // 初始化调试工具栏事件
        if (window.DebugPanelManager) {
          window.DebugPanelManager.initializeDebugToolbar();
        }
      }
    }

    /**
     * 添加VS Code风格样式
     * @private
     */
    _addVSCodeStyles() {
      if (document.getElementById('vscode-ui-styles')) return;
      
      const style = document.createElement('style');
      style.id = 'vscode-ui-styles';
      style.textContent = `
        .panel-container {
          display: flex;
          flex-direction: column;
          border-top: 1px solid #e0e0e0;
          background-color: #f5f5f5;
          height: 300px;
          position: relative;
        }
        
        .panel-tabs {
          display: flex;
          background-color: #f5f5f5;
          border-bottom: 1px solid #e0e0e0;
          height: 36px;
          overflow-x: auto;
          scrollbar-width: thin;
        }
        
        .panel-tabs .tab {
          display: flex;
          align-items: center;
          padding: 0 12px;
          height: 35px;
          cursor: pointer;
          border-right: 1px solid #e0e0e0;
          white-space: nowrap;
          user-select: none;
          position: relative;
        }
        
        .panel-tabs .tab:hover {
          background-color: #e8e8e8;
        }
        
        .panel-tabs .tab.active {
          background-color: #ffffff;
          border-top: 2px solid #007acc;
          padding-top: 0;
        }
        
        .tab-icon {
          margin-right: 5px;
          font-size: 14px;
        }
        
        #terminal-container,
        .output-panel,
        .problems-panel,
        .debug-panel {
          flex: 1;
          overflow: hidden;
          position: absolute;
          top: 36px;
          left: 0;
          right: 0;
          bottom: 0;
          display: none;
          visibility: hidden;
          background-color: #ffffff;
        }
        
        .output-toolbar,
        .problems-toolbar,
        .debug-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 8px;
          background-color: #f5f5f5;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .action-btn {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border-radius: 3px;
          margin-right: 4px;
        }
        
        .action-btn:hover {
          background-color: #e0e0e0;
        }
        
        .action-btn.toggled {
          background-color: #e0e0e0;
          color: #007acc;
        }
        
        .output {
          padding: 8px;
          overflow-y: auto;
          height: calc(100% - 32px);
          font-family: monospace;
          white-space: pre-wrap;
          word-break: break-word;
        }
        
        .problems-list {
          overflow-y: auto;
          height: calc(100% - 32px);
        }
        
        .problems-filter {
          flex: 1;
          margin-left: 8px;
          padding: 4px 8px;
          border: 1px solid #e0e0e0;
          border-radius: 3px;
          font-size: 14px;
        }
      `;
      
      document.head.appendChild(style);
    }

    /**
     * 设置问题列表
     * @param {Array} problems 问题列表
     */
    setProblems(problems) {
      this._problems = problems;
    }

    /**
     * 触发回调函数
     * @param {string} callbackType 回调类型
     * @param  {...any} args 参数
     */
    _triggerCallbacks(callbackType, ...args) {
      if (this._callbacks[callbackType]) {
        this._callbacks[callbackType].forEach(callback => {
          try {
            callback(...args);
          } catch (error) {
            this.log(LOG_LEVEL.ERROR, `执行${callbackType}回调时出错:`, error);
          }
        });
      }
    }

    /**
     * 注册事件回调
     * @param {string} event 事件名称
     * @param {function} callback 回调函数
     */
    on(event, callback) {
      if (typeof callback !== 'function') return;
      
      if (this._callbacks[event]) {
        this._callbacks[event].push(callback);
      } else {
        this.log(LOG_LEVEL.WARN, `未知事件类型: ${event}`);
      }
    }

    /**
     * 注册终端就绪事件
     * @param {function} callback 回调函数
     */
    onReady(callback) {
      if (typeof callback === 'function') {
        if (this._state.ready) {
          // 如果已经就绪，直接调用回调
          callback();
        } else {
          this._callbacks.onReady.push(callback);
        }
      }
    }

    /**
     * 注册终端错误事件
     * @param {function} callback 回调函数
     */
    onError(callback) {
      if (typeof callback === 'function') {
        if (this._state.error) {
          // 如果已经有错误，直接调用回调
          callback(this._state.error);
        } else {
          this._callbacks.onError.push(callback);
        }
    }
  }

    /**
     * 切换标签
     * @param {string} tabName 标签名称
     */
    switchTab(tabName) {
      // 设置当前激活标签
      this._state.activeTab = tabName;
      
      // 利用现有的TabPanelManager进行标签切换
      if (window.TabPanelManager && typeof window.TabPanelManager.switchTab === 'function') {
        window.TabPanelManager.switchTab(tabName);
      } else {
        // 降级处理：手动切换标签
        this.log(LOG_LEVEL.WARN, '未找到TabPanelManager，使用降级方式切换标签');
        
        // 获取所有面板元素
        const terminalPanel = document.getElementById('terminal-container');
        const outputPanel = document.querySelector('.output-panel');
        const problemsPanel = document.querySelector('.problems-panel');
        const debugPanel = document.querySelector('.debug-panel');
        
        // 隐藏所有面板
        [terminalPanel, outputPanel, problemsPanel, debugPanel].forEach(panel => {
          if (panel) {
            panel.style.display = 'none';
            panel.style.visibility = 'hidden';
          }
        });
    
        // 显示当前激活的面板
        let activePanel;
        switch (tabName) {
          case 'terminal':
            activePanel = terminalPanel;
            break;
          case 'result':
            activePanel = outputPanel;
            break;
          case 'problems':
            activePanel = problemsPanel;
            break;
          case 'debug':
            activePanel = debugPanel;
            break;
  }
        
        if (activePanel) {
          activePanel.style.display = 'block';
          activePanel.style.visibility = 'visible';
          
          // 如果是终端面板，调整大小
          if (tabName === 'terminal' && this._fitAddon) {
            setTimeout(() => this.fitTerminal(), 10);
          }
        }
      }
      
      // 触发标签切换回调
      this._triggerCallbacks('onTabSwitched', tabName);
  }
  
    /**
     * 检查代码语法
     * @param {string} code 代码
     * @param {string} language 语言
     * @returns {Array} 问题列表
     */
    checkCodeSyntax(code, language) {
      this.log(LOG_LEVEL.INFO, `检查${language}代码语法`);
      
      if (!code) {
        this.log(LOG_LEVEL.WARN, '代码为空，跳过语法检查');
        return [];
      }
      
      // 默认问题列表
      let problems = [];
      
      try {
        switch (language.toLowerCase()) {
          case 'javascript':
          case 'js':
            problems = this._checkJavaScriptSyntax(code);
            break;
          case 'python':
          case 'py':
            problems = this._checkPythonSyntax(code);
            break;
          case 'c':
          case 'cpp':
          case 'c++':
            problems = this._checkCSyntax(code);
            break;
          default:
            this.log(LOG_LEVEL.WARN, `不支持${language}的语法检查`);
        }
      } catch (error) {
        this.log(LOG_LEVEL.ERROR, '语法检查时出错:', error);
        problems.push({
          severity: 'error',
          message: `语法检查时出错: ${error.message}`,
          line: 1,
          column: 1
        });
      }
      
      // 存储问题列表
      this._problems = problems;
      
      // 使用ProblemsPanelManager更新问题面板
      if (window.ProblemsPanelManager && typeof window.ProblemsPanelManager.updateProblemsList === 'function') {
        window.ProblemsPanelManager.updateProblemsList();
      }
      
      // 触发语法检查完成回调
      this._triggerCallbacks('onSyntaxCheck', problems);
      
      return problems;
            }
    
    /**
     * 检查JavaScript代码语法
     * @param {string} code 代码
     * @returns {Array} 问题列表
     * @private
     */
    _checkJavaScriptSyntax(code) {
      const problems = [];
      
      try {
        // 使用Function构造函数尝试解析JavaScript代码
        new Function(code);
      } catch (error) {
        // 解析错误消息和行号
        const match = error.message.match(/at line (\d+)/);
        const line = match ? parseInt(match[1], 10) : 1;
        
        problems.push({
          severity: 'error',
          message: error.message.replace(/at line \d+/, '').trim(),
          line: line,
          column: 1,
          file: '当前文件'
        });
      }
      
      // 简单的代码规范检查
      const lines = code.split('\n');
      
      // 检查每一行
      lines.forEach((line, index) => {
        // 检查行长度
        if (line.length > 100) {
          problems.push({
            severity: 'warning',
            message: '行过长，建议不超过100个字符',
            line: index + 1,
            column: 101,
            file: '当前文件'
          });
        }
        
        // 检查是否使用var声明
        if (/\bvar\b/.test(line)) {
          problems.push({
            severity: 'warning',
            message: '建议使用let或const替代var',
            line: index + 1,
            column: line.indexOf('var') + 1,
            file: '当前文件'
          });
      }
      });
    
      return problems;
    }
    
    /**
     * 检查Python代码语法
     * @param {string} code 代码
     * @returns {Array} 问题列表
     * @private
     */
    _checkPythonSyntax(code) {
      const problems = [];
      
      // 在浏览器中很难执行完整的Python语法检查
      // 这里实现基础的检查规则
      
      const lines = code.split('\n');
      
      // 检查缩进和基本语法模式
      let indentLevel = 0;
      const indentStack = [];
      
      lines.forEach((line, index) => {
        // 跳过空行和注释行
        if (line.trim() === '' || line.trim().startsWith('#')) {
          return;
        }
        
        // 检查混合使用空格和制表符
        if (line.includes('\t') && line.includes('    ')) {
          problems.push({
            severity: 'warning',
            message: '混合使用了空格和制表符',
            line: index + 1,
            column: 1,
            file: '当前文件'
          });
        }
        
        // 检查是否使用了print作为函数（Python 3）
        if (/\bprint\s+[^(]/.test(line)) {
          problems.push({
            severity: 'warning',
            message: '在Python 3中应使用print()作为函数',
            line: index + 1,
            column: line.indexOf('print') + 1,
            file: '当前文件'
  });
}

        // 检查冒号后的代码块
        if (line.trimRight().endsWith(':')) {
          indentStack.push(indentLevel);
          indentLevel += 1;
        } 
        // 检查缩进减少
        else if ((line.search(/\S/) / 4) < indentLevel) {
          indentLevel = Math.floor(line.search(/\S/) / 4);
          if (indentStack.length > 0) {
            indentStack.pop();
          }
        }
      });
      
      // 检查未闭合的缩进
      if (indentStack.length > 0) {
        problems.push({
          severity: 'warning',
          message: '可能存在未正确结束的代码块',
          line: lines.length,
          column: 1,
          file: '当前文件'
        });
  }
  
      return problems;
    }
    
    /**
     * 检查C/C++代码语法
     * @param {string} code 代码
     * @returns {Array} 问题列表
     * @private
     */
    _checkCSyntax(code) {
      const problems = [];
      
      // 在浏览器中很难执行完整的C/C++语法检查
      // 这里实现基础的检查规则
      
      const lines = code.split('\n');
      const braceStack = [];
      
      // 简单检查括号匹配和基本语法
      lines.forEach((line, index) => {
        // 跳过注释行
        if (line.trim().startsWith('//') || line.trim().startsWith('/*')) {
          return;
        }
        
        // 检查行长度
        if (line.length > 80) {
          problems.push({
            severity: 'warning',
            message: '行过长，建议不超过80个字符',
            line: index + 1,
            column: 81,
            file: '当前文件'
          });
        }
        
        // 检查左大括号
        const leftBraces = (line.match(/\{/g) || []).length;
        for (let i = 0; i < leftBraces; i++) {
          braceStack.push('{');
      }
      
        // 检查右大括号
        const rightBraces = (line.match(/\}/g) || []).length;
        for (let i = 0; i < rightBraces; i++) {
          if (braceStack.length === 0 || braceStack.pop() !== '{') {
            problems.push({
              severity: 'error',
              message: '右大括号无匹配的左大括号',
              line: index + 1,
              column: line.indexOf('}') + 1,
              file: '当前文件'
            });
          }
        }
        
        // 检查缺少分号
        if (!line.trim().endsWith(';') && 
            !line.trim().endsWith('{') && 
            !line.trim().endsWith('}') && 
            !line.trim().endsWith(':') &&
            line.trim().length > 0 &&
            !line.trim().startsWith('#')) {
          
          // 排除函数声明、结构体声明等
          if (!line.includes('{') && !line.includes('struct') && !line.includes('class')) {
            problems.push({
              severity: 'warning',
              message: '语句可能缺少分号',
              line: index + 1,
              column: line.length + 1,
              file: '当前文件'
            });
        }
      }
      });
      
      // 检查未闭合的大括号
      if (braceStack.length > 0) {
        problems.push({
          severity: 'error',
          message: `有${braceStack.length}个左大括号没有匹配的右大括号`,
          line: lines.length,
          column: 1,
          file: '当前文件'
        });
      }
      
      return problems;
    }

    /**
     * 注册语法检查完成事件
     * @param {function} callback 回调函数
     */
    onSyntaxCheck(callback) {
      if (typeof callback === 'function') {
        this._callbacks.onSyntaxCheck.push(callback);
      }
    }
  }

  // 创建单例实例
  if (!window.TerminalManager) {
    window.TerminalManager = new TerminalManagerClass();
    }
})();

// ======= 延迟初始化，确保页面加载完成 =======
document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('DOM已加载完成，准备初始化终端...');
    
    // 如果localStorage中设置了自动初始化
    const autoInit = localStorage.getItem('terminalAutoInit');
    if (autoInit !== 'false') {
      console.log('自动初始化已启用，立即初始化终端');
  
      // 确保基础面板管理器加载完成
      await window.terminalUtils.loadBasePanelManager();
      console.log('基础面板管理器加载完成');
  
      // 加载其他面板管理器
      await window.terminalUtils.loadPanelManagers();
      console.log('所有面板管理器加载完成');
  
      // 延迟一小段时间确保DOM元素完全可用
      setTimeout(async () => {
        try {
          const result = await window.terminalUtils.init({
            autoLoadDependencies: true,
            autoInitUI: true,
            logLevel: 3 // INFO级别
          });
          console.log('终端初始化完成', result);
        } catch (error) {
          console.error('初始化终端出错:', error);
        }
      }, 300);
    } else {
      console.log('自动初始化已禁用，需要手动初始化终端');
    }
    
    // 导出全局终端创建方法（简化版）
    window.createTerminal = async (options = {}) => {
      console.log('调用createTerminal方法...');
      return await window.terminalUtils.init(options);
    };
  } catch (error) {
    console.error('终端初始化失败:', error);
    }
});
  
// 提供一个全局函数来重置终端 - 用于调试和测试
window.resetTerminal = async () => {
  try {
    if (window.TerminalManager && window.TerminalManager._terminal) {
      window.TerminalManager._terminal.dispose();
    }
    return await window.terminalUtils.init({
      autoLoadDependencies: true,
      autoInitUI: true
    });
  } catch (error) {
    console.error('重置终端失败:', error);
    throw error;
  }
};

// 新增单一入口点
window.TerminalLoader = { 
  init: async function(options) {
    console.log('使用统一API: await window.createTerminal();');
    return await window.createTerminal(options);
  } 
};
