/**
 * 调试面板管理模块
 * 负责管理调试控制台的显示和交互
 */
(function() {
  // 日志级别
  const LOG_LEVEL = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
  };
  
  // 当前日志级别
  let currentLogLevel = LOG_LEVEL.INFO;
  
  /**
   * 记录日志
   * @param {number} level - 日志级别
   * @param {string} message - 日志消息
   * @param  {...any} args - 附加参数
   */
  function log(level, message, ...args) {
    if (level <= currentLogLevel) {
      const prefix = ['[错误]', '[警告]', '[信息]', '[调试]'][level];
      console.log(`${prefix} DebugPanel: ${message}`, ...args);
    }
  }
  
  /**
   * 更新调试控制台内容
   */
  function updateDebugConsole() {
    log(LOG_LEVEL.INFO, '更新调试控制台');
    const debugPanel = document.querySelector('.debug-panel');
    if (!debugPanel) {
      log(LOG_LEVEL.ERROR, '未找到.debug-panel元素');
      return;
    }
    
    const debugContent = debugPanel.querySelector('.debug-content');
    if (!debugContent) {
      log(LOG_LEVEL.ERROR, '未找到.debug-content元素');
      return;
    }
    
    // 检查Vue实例是否存在
    if (!window.app || typeof window.app.$data === 'undefined') {
      debugContent.innerHTML = '<div class="debug-message">调试控制台已准备就绪，但无法连接到应用程序状态。</div>';
      return;
    }
    
    // 根据Vue应用程序的调试状态显示适当的内容
    const app = window.app.$data;
    
    if (app.isDebugging) {
      // 如果正在调试中
      let statusMessage = '';
      if (app.debugState === 'running') {
        statusMessage = '<div class="debug-status">调试会话正在运行中...</div>';
      } else if (app.debugState === 'paused') {
        statusMessage = '<div class="debug-status">调试会话已暂停 - 在第 ' + app.debugLine + ' 行</div>';
      } else {
        statusMessage = '<div class="debug-status">调试会话已准备就绪</div>';
      }
      
      // 显示调试消息
      let debugMessages = '';
      if (Array.isArray(app.debugMessages) && app.debugMessages.length > 0) {
        debugMessages = app.debugMessages.map(msg => {
          return `<div class="debug-line debug-message-${msg.type || 'info'}">${msg.text}</div>`;
        }).join('');
      } else {
        debugMessages = '<div class="debug-message">没有调试消息。</div>';
      }
      
      debugContent.innerHTML = statusMessage + debugMessages;
    } else {
      // 如果没有调试中，显示引导信息
      debugContent.innerHTML = `
        <div class="debug-message">没有活动的调试会话</div>
        <div style="margin: 20px;">
          <p>要开始调试，请使用以下操作：</p>
          <ol>
            <li>在编辑器中放置断点（点击行号边缘）</li>
            <li>点击调试工具栏中的"开始调试"按钮</li>
            <li>使用步进按钮控制代码执行</li>
          </ol>
          <p>调试控制台将显示变量值和程序状态。</p>
        </div>
      `;
    }
  }
  
  /**
   * 初始化调试工具栏事件
   */
  function initializeDebugToolbar() {
    log(LOG_LEVEL.INFO, '初始化调试工具栏事件');
    
    // 开始调试按钮
    const startDebugBtn = document.querySelector('.debug-toolbar .action-btn[title="开始调试"]');
    if (startDebugBtn && !startDebugBtn._hasClickEvent) {
      startDebugBtn.addEventListener('click', () => {
        if (window.terminalAPI) {
          window.terminalAPI.startDebugging();
        }
      });
      startDebugBtn._hasClickEvent = true;
    }
    
    // 单步进入按钮
    const stepIntoBtn = document.querySelector('.debug-toolbar .action-btn[title="单步进入"]');
    if (stepIntoBtn && !stepIntoBtn._hasClickEvent) {
      stepIntoBtn.addEventListener('click', () => {
        if (window.terminalAPI) {
          window.terminalAPI.stepInto();
        }
      });
      stepIntoBtn._hasClickEvent = true;
    }
    
    // 单步跳过按钮
    const stepOverBtn = document.querySelector('.debug-toolbar .action-btn[title="单步跳过"]');
    if (stepOverBtn && !stepOverBtn._hasClickEvent) {
      stepOverBtn.addEventListener('click', () => {
        if (window.terminalAPI) {
          window.terminalAPI.stepOver();
        }
      });
      stepOverBtn._hasClickEvent = true;
    }
    
    // 单步跳出按钮
    const stepOutBtn = document.querySelector('.debug-toolbar .action-btn[title="单步跳出"]');
    if (stepOutBtn && !stepOutBtn._hasClickEvent) {
      stepOutBtn.addEventListener('click', () => {
        if (window.terminalAPI) {
          window.terminalAPI.stepOut();
        }
      });
      stepOutBtn._hasClickEvent = true;
    }
    
    // 停止调试按钮
    const stopDebugBtn = document.querySelector('.debug-toolbar .action-btn[title="停止调试"]');
    if (stopDebugBtn && !stopDebugBtn._hasClickEvent) {
      stopDebugBtn.addEventListener('click', () => {
        if (window.terminalAPI) {
          window.terminalAPI.stopDebugging();
        }
      });
      stopDebugBtn._hasClickEvent = true;
    }
    
    // 清除控制台按钮
    const clearConsoleBtn = document.querySelector('.debug-toolbar .action-btn[title="清除控制台"]');
    if (clearConsoleBtn && !clearConsoleBtn._hasClickEvent) {
      clearConsoleBtn.addEventListener('click', () => {
        if (window.app && typeof window.app.$data !== 'undefined') {
          window.app.$data.debugMessages = [];
          updateDebugConsole();
        }
      });
      clearConsoleBtn._hasClickEvent = true;
    }
    
    // 调试级别选择
    const debugLevelSelect = document.querySelector('.debug-toolbar .debug-level-select');
    if (debugLevelSelect && !debugLevelSelect._hasChangeEvent) {
      debugLevelSelect.addEventListener('change', () => {
        if (window.terminalAPI) {
          window.terminalAPI.setDebugLevel(debugLevelSelect.value);
        }
      });
      debugLevelSelect._hasChangeEvent = true;
    }
  }
  
  // 调试控制台样式
  function addDebugConsoleStyles() {
    if (document.querySelector('#debug-console-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'debug-console-styles';
    style.textContent = `
      .debug-panel {
        display: flex;
        flex-direction: column;
        height: 100%;
        font-family: monospace, 'Courier New', Courier;
      }
      
      .debug-toolbar {
        display: flex;
        justify-content: space-between;
        background-color: #f5f5f5;
        border-bottom: 1px solid #e0e0e0;
        padding: 4px 8px;
      }
      
      .debug-content {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
        background-color: #ffffff;
      }
      
      .debug-status {
        background-color: #e3f2fd;
        padding: 8px;
        margin-bottom: 8px;
        border-left: 4px solid #2196f3;
        font-weight: bold;
      }
      
      .debug-line {
        padding: 4px 8px;
        margin-bottom: 2px;
        border-radius: 2px;
        font-family: monospace;
      }
      
      .debug-message {
        color: #666;
        padding: 4px 8px;
      }
      
      .debug-message-info {
        background-color: #f5f5f5;
      }
      
      .debug-message-warning {
        background-color: #fff3e0;
        color: #e65100;
      }
      
      .debug-message-error {
        background-color: #ffebee;
        color: #b71c1c;
      }
      
      .debug-message-value {
        background-color: #e8f5e9;
        color: #1b5e20;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  // 导出模块功能
  window.DebugPanelManager = {
    updateDebugConsole,
    initializeDebugToolbar,
    addDebugConsoleStyles,
    setLogLevel: function(level) {
      if (typeof level === 'number' && level >= 0 && level <= 3) {
        currentLogLevel = level;
      }
    }
  };
})(); 