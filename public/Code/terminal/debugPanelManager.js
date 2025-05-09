/**
 * 调试面板管理模块
 * 负责管理调试控制台的显示和交互
 */
(function() {
  // 确保基础管理器已加载
  if (typeof window.createBasePanelManager !== 'function') {
    console.error('基础面板管理器未加载，调试面板管理器初始化失败');
    return;
  }
  
  // 创建管理器实例
  const manager = window.createBasePanelManager('DebugPanel');
  
  /**
   * 更新调试控制台内容
   */
  function updateDebugConsole() {
    manager.log(window.PANEL_LOG_LEVEL.INFO, '更新调试控制台');
    
    const debugPanel = manager.getElement('.debug-panel', true);
    if (!debugPanel) return;
    
    const debugContent = debugPanel.querySelector('.debug-content');
    if (!debugContent) {
      manager.log(window.PANEL_LOG_LEVEL.ERROR, '未找到.debug-content元素');
      return;
    }
    
    // 检查Vue实例是否存在
    if (!manager.checkVueApp()) {
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
    manager.log(window.PANEL_LOG_LEVEL.INFO, '初始化调试工具栏事件');
    
    // 开始调试按钮
    const startDebugBtn = manager.getElement('.debug-toolbar .action-btn[title="开始调试"]');
    manager.addOneTimeEventListener(startDebugBtn, 'click', () => {
        if (window.terminalAPI) {
          window.terminalAPI.startDebugging();
        }
    }, '_hasClickEvent');
    
    // 单步进入按钮
    const stepIntoBtn = manager.getElement('.debug-toolbar .action-btn[title="单步进入"]');
    manager.addOneTimeEventListener(stepIntoBtn, 'click', () => {
        if (window.terminalAPI) {
          window.terminalAPI.stepInto();
        }
    }, '_hasClickEvent');
    
    // 单步跳过按钮
    const stepOverBtn = manager.getElement('.debug-toolbar .action-btn[title="单步跳过"]');
    manager.addOneTimeEventListener(stepOverBtn, 'click', () => {
        if (window.terminalAPI) {
          window.terminalAPI.stepOver();
        }
    }, '_hasClickEvent');
    
    // 单步跳出按钮
    const stepOutBtn = manager.getElement('.debug-toolbar .action-btn[title="单步跳出"]');
    manager.addOneTimeEventListener(stepOutBtn, 'click', () => {
        if (window.terminalAPI) {
          window.terminalAPI.stepOut();
        }
    }, '_hasClickEvent');
    
    // 停止调试按钮
    const stopDebugBtn = manager.getElement('.debug-toolbar .action-btn[title="停止调试"]');
    manager.addOneTimeEventListener(stopDebugBtn, 'click', () => {
        if (window.terminalAPI) {
          window.terminalAPI.stopDebugging();
        }
    }, '_hasClickEvent');
    
    // 清除控制台按钮
    const clearConsoleBtn = manager.getElement('.debug-toolbar .action-btn[title="清除控制台"]');
    manager.addOneTimeEventListener(clearConsoleBtn, 'click', () => {
      if (manager.checkVueApp()) {
          window.app.$data.debugMessages = [];
          updateDebugConsole();
        }
    }, '_hasClickEvent');
    
    // 调试级别选择
    const debugLevelSelect = manager.getElement('.debug-toolbar .debug-level-select');
    manager.addOneTimeEventListener(debugLevelSelect, 'change', () => {
        if (window.terminalAPI) {
          window.terminalAPI.setDebugLevel(debugLevelSelect.value);
        }
    }, '_hasChangeEvent');
  }
  
  // 调试控制台样式
  function addDebugConsoleStyles() {
    manager.addStyles('debug-console-styles', `
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
    `);
  }
  
  // 导出模块功能
  window.DebugPanelManager = {
    ...manager, // 继承基础管理器的所有属性和方法
    updateDebugConsole,
    initializeDebugToolbar,
    addDebugConsoleStyles
  };
})(); 