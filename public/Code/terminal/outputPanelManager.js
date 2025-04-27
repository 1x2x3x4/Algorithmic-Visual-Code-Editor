/**
 * 输出面板管理模块
 * 负责管理输出面板的显示和内容更新
 */
(function() {
  // 日志级别
  const LOG_LEVEL = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
  };
  
  // 当前日志级别 - 默认只显示错误和警告
  let currentLogLevel = LOG_LEVEL.WARN;
  
  /**
   * 记录日志
   * @param {number} level - 日志级别
   * @param {string} message - 日志消息
   * @param  {...any} args - 附加参数
   */
  function log(level, message, ...args) {
    if (level <= currentLogLevel) {
      const prefix = ['[错误]', '[警告]', '[信息]', '[调试]'][level];
      console.log(`${prefix} OutputPanel: ${message}`, ...args);
    }
  }
  
  /**
   * 更新输出内容显示
   */
  function updateOutputContent() {
    // 只在调试级别记录常规更新
    log(LOG_LEVEL.DEBUG, '更新输出内容');
    
    // 获取输出面板元素
    const outputPanel = document.querySelector('.output-panel');
    if (!outputPanel) {
      log(LOG_LEVEL.ERROR, '未找到.output-panel元素');
      return;
    }
    
    // 获取输出内容元素
    const outputElement = outputPanel.querySelector('.output');
    if (!outputElement) {
      log(LOG_LEVEL.ERROR, '未找到.output元素');
      return;
    }
    
    // 检查Vue实例是否存在
    if (!window.app || typeof window.app.$data === 'undefined') {
      outputElement.textContent = '没有可用的输出。';
      log(LOG_LEVEL.WARN, 'Vue实例未初始化');
      return;
    }
    
    // 获取Vue应用程序中的输出内容
    const app = window.app.$data;
    const output = app.output || '没有输出';
    
    // 使用textContent更新输出内容，以避免HTML解析问题
    outputElement.textContent = output;
    
    // 应用样式确保正确显示
    outputElement.style.fontFamily = 'monospace, "Courier New", Courier';
    outputElement.style.whiteSpace = 'pre-wrap';
    outputElement.style.overflowWrap = 'break-word';
    outputElement.style.wordBreak = 'break-word';
    outputElement.style.fontSize = '14px';
    outputElement.style.lineHeight = '1.5';
    
    // 如果没有滚动锁定，自动滚动到底部
    if (!app.isOutputScrollLocked) {
      outputElement.scrollTop = outputElement.scrollHeight;
    }
    
    // 更新锁定按钮状态
    const lockButton = document.querySelector('.output-toolbar .action-btn[title="锁定滚动"]');
    if (lockButton) {
      lockButton.classList.toggle('toggled', app.isOutputScrollLocked);
    }
    
    // 移除输出长度日志，仅在调试模式显示
    log(LOG_LEVEL.DEBUG, '输出内容已更新，长度:', output.length);
  }
  
  /**
   * 清除输出内容
   */
  function clearOutput() {
    log(LOG_LEVEL.DEBUG, '清除输出内容');
    
    if (window.app && typeof window.app.$data !== 'undefined') {
      window.app.$data.output = '';
      updateOutputContent();
    }
  }
  
  /**
   * 切换输出滚动锁定状态
   */
  function toggleOutputScrollLock() {
    log(LOG_LEVEL.DEBUG, '切换输出滚动锁定状态');
    
    if (window.app && typeof window.app.$data !== 'undefined') {
      window.app.$data.isOutputScrollLocked = !window.app.$data.isOutputScrollLocked;
      
      // 更新锁定按钮状态
      const lockButton = document.querySelector('.output-toolbar .action-btn[title="锁定滚动"]');
      if (lockButton) {
        lockButton.classList.toggle('toggled', window.app.$data.isOutputScrollLocked);
      }
    }
  }
  
  // 导出模块功能
  window.OutputPanelManager = {
    updateOutputContent,
    clearOutput,
    toggleOutputScrollLock,
    setLogLevel: function(level) {
      if (typeof level === 'number' && level >= 0 && level <= 3) {
        currentLogLevel = level;
      }
    }
  };
})(); 