// 终端管理模块

// 日志级别控制
const LOG_LEVEL = {
  NONE: 0,    // 不显示任何日志
  ERROR: 1,   // 只显示错误
  WARN: 2,    // 显示警告和错误
  INFO: 3,    // 显示信息、警告和错误
  DEBUG: 4    // 显示所有日志
};

// 设置当前日志级别（可以根据需要调整）
let CURRENT_LOG_LEVEL = LOG_LEVEL.ERROR; // 默认只显示错误日志

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
    if (level <= CURRENT_LOG_LEVEL) {
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
            this.log(LOG_LEVEL.INFO, '已修复终端滚动区域高度');
          }
          resolve(true);
        } catch (error) {
          this.log(LOG_LEVEL.ERROR, '修复终端滚动区域出错:', error);
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
        this.log(LOG_LEVEL.WARN, 'fitTerminal: 终端或fitAddon未初始化');
        resolve(false);
        return;
      }
      
      setTimeout(async () => {
        try {
          // 先获取建议尺寸
          const dims = window.fitAddon.proposeDimensions();
          if (dims) {
            this.log(LOG_LEVEL.DEBUG, `建议终端尺寸: ${dims.cols}x${dims.rows}`);
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
          
          this.log(LOG_LEVEL.DEBUG, '终端大小已调整');
          resolve(true);
        } catch (error) {
          this.log(LOG_LEVEL.ERROR, '终端大小调整出错:', error);
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
        this.fitTerminal({ delay: 100, fixScroll: true });
      });
      observer.observe(container);
      return observer;
    } else {
      // 仅在不支持ResizeObserver的旧浏览器中作为降级方案
      this.log(LOG_LEVEL.WARN, 'ResizeObserver不可用，降级为轮询监听方式');
      let lastWidth = container.offsetWidth;
      let lastHeight = container.offsetHeight;
      
      const intervalId = setInterval(() => {
        if (lastWidth !== container.offsetWidth || lastHeight !== container.offsetHeight) {
          lastWidth = container.offsetWidth;
          lastHeight = container.offsetHeight;
          this.fitTerminal({ fixScroll: true });
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
  }
};

// 导出工具函数到全局变量，方便其他模块使用
window.terminalUtils = TerminalUtils;

// 使用优化后的工具函数替代原始log函数
const log = (...args) => TerminalUtils.log(...args);

// 全局终端变量
let terminal;
let fitAddon;
let commandHistory = [];
let historyIndex = -1;
let commandBuffer = "";
let terminalInitialized = false;

/**
 * 主DOM加载完成后初始化终端
 */
document.addEventListener('DOMContentLoaded', () => {
  log(LOG_LEVEL.DEBUG, 'DOM加载完成，准备初始化终端');
  
  // 检查终端依赖是否已加载
  if (typeof Terminal === 'undefined') {
    log(LOG_LEVEL.WARN, 'Terminal类未加载，尝试动态加载');
    loadXtermScript();
  } else {
    // 延迟初始化，确保DOM完全加载
    setTimeout(initTerminal, 300);
  }
});

/**
 * 动态加载xterm.js依赖
 */
function loadXtermScript() {
  log(LOG_LEVEL.INFO, '正在动态加载xterm.js');
  
  // 加载xterm.js主脚本（使用本地文件）
  const xtermScript = document.createElement('script');
  xtermScript.src = 'lib/xterm/xterm.js';
  xtermScript.onload = () => {
    log(LOG_LEVEL.INFO, 'xterm.js加载成功');
    
    // 加载fit插件（使用本地文件）
    const fitAddonScript = document.createElement('script');
    fitAddonScript.src = 'lib/xterm/xterm-addon-fit.js';
    fitAddonScript.onload = () => {
      log(LOG_LEVEL.INFO, 'xterm-addon-fit加载成功');
      setTimeout(initTerminal, 300);
    };
    document.head.appendChild(fitAddonScript);
  };
  document.head.appendChild(xtermScript);
}

/**
 * 动态加载xterm.js CSS
 */
function loadXtermCSS() {
  log(LOG_LEVEL.INFO, '正在动态加载xterm.css');
  const xtermCSS = document.createElement('link');
  xtermCSS.rel = 'stylesheet';
  xtermCSS.href = 'lib/xterm/xterm.css';
  document.head.appendChild(xtermCSS);
}

/**
 * 初始化终端实例
 */
function initTerminal() {
  // 避免重复初始化
  if (terminalInitialized) {
    log(LOG_LEVEL.INFO, '终端已初始化');
    return;
  }

  log(LOG_LEVEL.DEBUG, '开始初始化终端');

  // 检查依赖
  if (typeof Terminal === 'undefined') {
    log(LOG_LEVEL.ERROR, 'Terminal未定义，无法初始化终端');
    return;
  }

  // 获取终端容器
  const terminalContainer = document.getElementById('terminal-container');
  if (!terminalContainer) {
    log(LOG_LEVEL.ERROR, '找不到终端容器');
    return;
  }

  try {
    // 创建终端实例
    terminal = new Terminal({
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
      scrollback: 1000
    });
    
    // 设置全局实例以便其他模块访问
    window.terminal = terminal;
    
    // 加载FitAddon插件
    if (typeof FitAddon !== 'undefined') {
      fitAddon = new FitAddon.FitAddon();
      terminal.loadAddon(fitAddon);
      window.fitAddon = fitAddon;
    }
    
    // 打开终端
    terminal.open(terminalContainer);
    
    // 确保样式正确
    terminalContainer.style.display = 'flex';
    terminalContainer.style.flexDirection = 'column';
    
    // 调整大小
    TerminalUtils.batchFitTerminal();
    TerminalUtils.setupResizeHandlers();
    
    // 显示欢迎信息
    terminal.write('\r\n欢迎使用 AVCE 终端\r\n\r\n');
    showPrompt();
    
    // 设置输入处理
    setupTerminalInput();
    
    // 标记初始化完成
    terminalInitialized = true;
    window.terminalReady = true;
    
    // 触发终端初始化事件
    window.dispatchEvent(new CustomEvent('terminal-initialized'));
    
    log(LOG_LEVEL.INFO, '终端初始化成功');
  } catch (error) {
    log(LOG_LEVEL.ERROR, '初始化终端时出错:', error);
  }
}

/**
 * 显示命令提示符
 */
function showPrompt() {
  terminal.write('\r\navce> ');
}

/**
 * 设置终端输入处理
 */
function setupTerminalInput() {
  terminal.onData(data => {
    const char = data.charCodeAt(0);
    
    if (char === 13) { // 回车键
      // 处理命令
      const command = commandBuffer.trim();
      terminal.write('\r\n');
      
      if (command) {
        processCommand(command);
        addToHistory(command);
      } else {
        showPrompt();
      }
      
      commandBuffer = '';
      historyIndex = -1;
    } else if (char === 127) { // 退格键
      if (commandBuffer.length > 0) {
        commandBuffer = commandBuffer.slice(0, -1);
        terminal.write('\b \b');
      }
    } else if (data === '\u001b[A') { // 上箭头
      navigateHistory('up');
    } else if (data === '\u001b[B') { // 下箭头
      navigateHistory('down');
    } else if (char >= 32) { // 可打印字符
      commandBuffer += data;
      terminal.write(data);
    }
  });
}

/**
 * 导航历史记录
 * @param {string} direction 方向('up'或'down')
 */
function navigateHistory(direction) {
  if (commandHistory.length === 0) return;
  
  // 清除当前行
  terminal.write('\r\x1b[K');
  terminal.write('avce> ');
  
  if (direction === 'up') {
    if (historyIndex === -1) {
      historyIndex = 0;
    } else if (historyIndex < commandHistory.length - 1) {
      historyIndex++;
    }
    
    if (historyIndex >= 0 && historyIndex < commandHistory.length) {
      commandBuffer = commandHistory[historyIndex];
      terminal.write(commandBuffer);
    }
  } else if (direction === 'down') {
    if (historyIndex > 0) {
      historyIndex--;
      commandBuffer = commandHistory[historyIndex];
      terminal.write(commandBuffer);
    } else if (historyIndex === 0) {
      historyIndex = -1;
      commandBuffer = '';
    }
  }
}

/**
 * 添加命令到历史记录
 * @param {string} command 命令
 */
function addToHistory(command) {
  if (command && (commandHistory.length === 0 || commandHistory[0] !== command)) {
    commandHistory.unshift(command);
    // 限制历史记录长度
    if (commandHistory.length > 50) {
      commandHistory.pop();
    }
  }
}

/**
 * 处理终端命令
 * @param {string} command 命令字符串
 */
function processCommand(command) {
  const args = command.split(' ');
  const cmd = args[0].toLowerCase();
  
  switch (cmd) {
    case 'help':
      showHelp();
      break;
    case 'clear':
      terminal.clear();
      showPrompt();
      return;
    case 'run':
      runCode();
      break;
    case 'format':
      formatCode();
      break;
    case 'setlang':
      if (args[1]) {
        setLanguage(args[1]);
      } else {
        terminal.write('\r\n请指定语言：python, c, cpp, java, javascript\r\n');
      }
      break;
    case 'info':
      showProjectInfo();
      break;
    case 'echo':
      terminal.write('\r\n' + args.slice(1).join(' ') + '\r\n');
      break;
    case 'loglevel':
      setLogLevel(args[1]);
      break;
    default:
      terminal.write(`\r\n未知命令：${cmd}\r\n输入 'help' 查看可用命令\r\n`);
  }
  
  showPrompt();
}

/**
 * 显示帮助信息
 */
function showHelp() {
  terminal.write('\r\n可用命令：\r\n');
  terminal.write('  help             - 显示此帮助信息\r\n');
  terminal.write('  clear            - 清空终端\r\n');
  terminal.write('  run              - 运行当前代码\r\n');
  terminal.write('  format           - 格式化当前代码\r\n');
  terminal.write('  setlang [lang]   - 设置编程语言 (python/c/cpp/java/javascript)\r\n');
  terminal.write('  info             - 显示项目信息\r\n');
  terminal.write('  echo [text]      - 显示文本\r\n');
  terminal.write('  loglevel [level] - 设置日志级别 (NONE/ERROR/WARN/INFO/DEBUG)\r\n');
}

/**
 * 运行当前代码
 */
function runCode() {
  terminal.write('\r\n正在执行代码...\r\n');
  
  if (window.app && typeof window.app.runCode === 'function') {
    window.app.runCode();
    terminal.write('代码执行请求已发送。查看输出面板获取结果。\r\n');
  } else {
    terminal.write('无法执行代码：未找到runCode方法。\r\n');
  }
}

/**
 * 格式化当前代码
 */
function formatCode() {
  terminal.write('\r\n正在格式化代码...\r\n');
  
  if (window.editor && typeof window.editor.getAction === 'function') {
    const formatAction = window.editor.getAction('editor.action.formatDocument');
    if (formatAction) {
      formatAction.run();
      terminal.write('代码已格式化。\r\n');
    } else {
      terminal.write('无法格式化代码：未找到格式化操作。\r\n');
    }
  } else {
    terminal.write('无法格式化代码：未找到编辑器API。\r\n');
  }
}

/**
 * 设置编程语言
 * @param {string} lang 语言名称
 */
function setLanguage(lang) {
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
      terminal.write(`\r\n已将语言设置为: ${normalizedLang}\r\n`);
    } else {
      terminal.write('\r\n无法设置语言：未找到changeEditorLanguage方法。\r\n');
    }
  } else {
    terminal.write(`\r\n不支持的语言: ${lang}\r\n`);
    terminal.write('支持的语言: python, c, cpp, java, javascript\r\n');
  }
}

/**
 * 显示项目信息
 */
function showProjectInfo() {
  terminal.write('\r\n算法可视化代码编辑器 (AVCE)\r\n');
  terminal.write('版本: 1.0.0\r\n');
  terminal.write('\r\n');
  terminal.write('功能:\r\n');
  terminal.write('- 支持多种编程语言\r\n');
  terminal.write('- 算法可视化\r\n');
  terminal.write('- 集成终端\r\n');
  terminal.write('- 代码高亮与格式化\r\n');
  
  // 环境信息
  const language = window.app && window.app.$data ? window.app.$data.editorSettings.language : '未知';
  terminal.write('\r\n环境信息:\r\n');
  terminal.write(`- 当前语言: ${language}\r\n`);
  terminal.write(`- 终端版本: xterm.js ${typeof Terminal !== 'undefined' ? Terminal.version || '未知' : '未知'}\r\n`);
}

/**
 * 设置日志级别
 * @param {string} levelName 日志级别名称
 */
function setLogLevel(levelName) {
  if (!levelName) {
    const currentLevelName = Object.keys(LOG_LEVEL).find(k => LOG_LEVEL[k] === CURRENT_LOG_LEVEL) || 'UNKNOWN';
    terminal.write(`\r\n当前日志级别: ${currentLevelName}\r\n`);
    terminal.write('可用的日志级别: NONE, ERROR, WARN, INFO, DEBUG\r\n');
    return;
  }
  
  levelName = levelName.toUpperCase();
  
  if (LOG_LEVEL[levelName] !== undefined) {
    CURRENT_LOG_LEVEL = LOG_LEVEL[levelName];
    terminal.write(`\r\n日志级别已设置为: ${levelName}\r\n`);
  } else {
    terminal.write(`\r\n无效的日志级别: ${levelName}\r\n`);
    terminal.write('可用的日志级别: NONE, ERROR, WARN, INFO, DEBUG\r\n');
  }
}