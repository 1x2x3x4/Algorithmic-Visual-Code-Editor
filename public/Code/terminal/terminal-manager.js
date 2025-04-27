/**
 * Terminal 组件入口文件
 * 将此文件引入到HTML中即可使用Terminal功能
 */

// 加载CSS
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'Code/terminal/terminal.css';
document.head.appendChild(link);

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
        onResize: []
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
      if (window.terminalUtils) {
        window.terminalUtils.fitTerminal({
          fixScroll: true,
          dispatchEvent: true
        });
        return;
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
        // 处理终端输入...
        // 这里是处理用户输入的逻辑
        // 可以从terminal.js中移植handleTerminalInput函数的内容
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
      // 这里是命令处理逻辑
      // 可以从terminal.js中移植processCommand函数的内容
      
      // 显示新提示符
      this.showPrompt();
      
      // 触发命令执行回调
      this._triggerCallbacks('onCommandExecuted', command);
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
      // 从terminal.js移植addPanelResizing函数的内容
    }

    /**
     * 创建VS Code风格UI
     */
    createVSCodeUI() {
      // 从terminal.js移植createVSCodeUI函数的内容
    }

    /**
     * 切换标签
     * @param {string} tabName 标签名称
     */
    switchTab(tabName) {
      // 从terminal.js移植switchTab函数的内容
      this._state.activeTab = tabName;
    }

    /**
     * 检查代码语法
     * @param {string} code 代码
     * @param {string} language 语言
     */
    checkCodeSyntax(code, language) {
      // 从terminal.js移植checkCodeSyntax函数的内容
      // 结果存储在this._problems中
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
  }

  // 创建单例实例
  if (!window.TerminalManager) {
    window.TerminalManager = new TerminalManagerClass();
  }
})();

// 动态加载xterm.js及其插件
async function loadXtermModules() {
  try {
    const log = window.terminalUtils ? window.terminalUtils.log : console.log;
    log(LOG_LEVEL.INFO, '开始加载xterm模块...');
    
    const xtermModule = await import('https://cdn.jsdelivr.net/npm/xterm@5.1.0/lib/xterm.js');
    window.Terminal = xtermModule.Terminal;
    log(LOG_LEVEL.INFO, 'xterm.js模块加载成功');
    
    // 加载fit插件
    const fitAddonModule = await import('https://cdn.jsdelivr.net/npm/xterm-addon-fit@0.7.0/lib/xterm-addon-fit.js');
    window.FitAddon = fitAddonModule;
    log(LOG_LEVEL.INFO, 'xterm-addon-fit模块加载成功');
    
    // 初始化终端
    return initTerminal();
  } catch (error) {
    console.error('加载xterm模块失败:', error);
    throw error;
  }
}

// 使用TerminalUtils监控容器大小变化
function monitorContainerResize() {
  if (window.terminalUtils) {
    return window.terminalUtils.monitorContainerResize();
  }
  
  // 向后兼容，TerminalUtils未加载时的实现
  const container = document.getElementById('terminal-container');
  if (!container) return;
  
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
}

// 初始化DOM和UI
function initDomAndUI() {
  return new Promise((resolve) => {
    console.debug('初始化DOM和UI...');
    
    // 创建VS Code风格UI
    if (window.terminalUtils) {
      window.terminalUtils.createVSCodeUI();
      window.terminalUtils.addPanelResizing();
    }
    
    console.debug('DOM和UI初始化完成');
    resolve();
  });
}

// 异步初始化终端
async function initTerminalAsync() {
  // 优先使用TerminalManager
  if (window.TerminalManager) {
    window.TerminalManager.initialize();
    return window.TerminalManager.terminal;
  }
  
  console.warn('TerminalManager未找到，降级使用旧版初始化逻辑');
  return legacyInitTerminal();
}

// 向后兼容的终端初始化函数
function legacyInitTerminal() {
  return new Promise((resolve, reject) => {
    try {
      if (window.terminal) {
        return resolve(window.terminal);
      }
      
      const terminalContainer = document.getElementById('terminal-container');
      if (!terminalContainer) {
        return reject(new Error('找不到终端容器'));
      }
      
      // 创建终端实例
      const terminal = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: 'Consolas, "Courier New", monospace',
        theme: {
          background: '#ffffff',
          foreground: '#333333',
          cursor: '#333333',
          selection: 'rgba(0, 120, 215, 0.3)'
        }
      });
      
      // 加载插件
      if (typeof FitAddon !== 'undefined' && FitAddon.FitAddon) {
        const fitAddon = new FitAddon.FitAddon();
        terminal.loadAddon(fitAddon);
        window.fitAddon = fitAddon;
      }
      
      // 打开终端
      terminal.open(terminalContainer);
      window.terminal = terminal;
      
      // 调整大小
      if (window.fitAddon) {
        if (window.terminalUtils) {
          window.terminalUtils.fitTerminal();
        } else {
          window.fitAddon.fit();
        }
      }
      
      // 监视容器大小变化
      monitorContainerResize();
      
      // 显示欢迎消息
      terminal.write('欢迎使用算法可视化代码编辑器终端\r\n');
      terminal.write('输入 "help" 获取可用命令列表\r\n');
      
      resolve(terminal);
    } catch (error) {
      console.error('初始化终端时出错:', error);
      reject(error);
    }
  });
}

// ======= 延迟初始化，确保页面加载完成 =======
document.addEventListener('DOMContentLoaded', async () => {
  // 动态加载主要terminal.js脚本
  const terminalScript = document.createElement('script');
  terminalScript.src = 'Code/terminal/terminal.js';
  
  // 加载调试面板管理器脚本
  const debugPanelScript = document.createElement('script');
  debugPanelScript.src = 'Code/terminal/debugPanelManager.js';
  
  // 加载输出面板管理器脚本
  const outputPanelScript = document.createElement('script');
  outputPanelScript.src = 'Code/terminal/outputPanelManager.js';
  
  // 加载问题面板管理器脚本
  const problemsPanelScript = document.createElement('script');
  problemsPanelScript.src = 'Code/terminal/problemsPanelManager.js';
  
  // 加载标签面板管理器脚本
  const tabPanelScript = document.createElement('script');
  tabPanelScript.src = 'Code/terminal/tabPanelManager.js';
  
  // 按顺序加载脚本
  document.head.appendChild(terminalScript);
  
  // 等待主脚本加载完成后加载其他管理器脚本
  terminalScript.onload = () => {
    document.head.appendChild(debugPanelScript);
    document.head.appendChild(outputPanelScript);
    document.head.appendChild(problemsPanelScript);
    document.head.appendChild(tabPanelScript);
    
    // 自动初始化终端
    const autoInit = localStorage.getItem('terminalAutoInit');
    if (autoInit !== 'false') {
      setTimeout(() => {
        if (window.TerminalManager) {
          window.TerminalManager.initialize();
        }
      }, 1000);
    }
  };
  
  // 导出全局终端创建方法
  window.createTerminal = async () => {
    if (window.TerminalManager) {
      window.TerminalManager.initialize();
      return window.TerminalManager;
    }
    return null;
  };
});

// 向后兼容的API
window.TerminalLoader = { 
  init: function() {
    console.log('使用新API: const terminal = await window.createTerminal();');
    if (window.TerminalManager) {
      window.TerminalManager.initialize();
      return window.TerminalManager;
    }
    return null;
  } 
};
