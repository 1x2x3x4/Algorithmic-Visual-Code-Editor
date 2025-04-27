/**
 * 标签面板管理模块
 * 负责管理输出区域的标签切换和显示
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
  
  // 终端状态
  let terminalState = {
    activeTab: 'terminal', // 当前活动标签: terminal, result, problems, debug
    isPanelVisible: true,
    isPanelMaximized: false
  };
  
  /**
   * 记录日志
   * @param {number} level - 日志级别
   * @param {string} message - 日志消息
   * @param  {...any} args - 附加参数
   */
  function log(level, message, ...args) {
    if (level <= currentLogLevel) {
      const prefix = ['[错误]', '[警告]', '[信息]', '[调试]'][level];
      console.log(`${prefix} TabPanel: ${message}`, ...args);
    }
  }
  
  /**
   * 切换输出区标签页
   * @param {string} tabName - 要切换到的标签页名称
   */
  function switchTab(tabName) {
    log(LOG_LEVEL.INFO, '切换到标签页', tabName);
    
    // 验证标签名称
    if (!['terminal', 'result', 'problems', 'debug'].includes(tabName)) {
      log(LOG_LEVEL.ERROR, '无效的标签名称:', tabName);
      return;
    }
    
    // 更新当前活动标签
    terminalState.activeTab = tabName;
    
    // 更新UI
    updateTabsVisibility();
    
    // 如果Vue应用存在，同步状态（除非是从Vue应用调用的）
    if (window.app && typeof window.app.$data !== 'undefined' && !window.terminalAPI._preserveVueSync) {
      window.app.$data.activeOutputTab = tabName;
    }
  }
  
  /**
   * 更新标签页可见性
   */
  function updateTabsVisibility() {
    // 获取所有面板
    const terminalPanel = document.getElementById('terminal-container');
    const outputPanel = document.querySelector('.output-panel');
    const problemsPanel = document.querySelector('.problems-panel');
    const debugPanel = document.querySelector('.debug-panel');
    
    // 获取当前活动标签
    const activeTab = terminalState.activeTab;
    
    // 隐藏所有面板
    if (terminalPanel) {
      terminalPanel.style.display = 'none';
      terminalPanel.style.visibility = 'hidden';
      terminalPanel.style.position = 'absolute';
      terminalPanel.style.zIndex = '-1';
    }
    
    if (outputPanel) {
      outputPanel.style.display = 'none';
      outputPanel.style.visibility = 'hidden';
      outputPanel.style.position = 'absolute';
      outputPanel.style.zIndex = '-1';
    }
    
    if (problemsPanel) {
      problemsPanel.style.display = 'none';
      problemsPanel.style.visibility = 'hidden';
      problemsPanel.style.position = 'absolute';
      problemsPanel.style.zIndex = '-1';
    }
    
    if (debugPanel) {
      debugPanel.style.display = 'none';
      debugPanel.style.visibility = 'hidden';
      debugPanel.style.position = 'absolute';
      debugPanel.style.zIndex = '-1';
    }
    
    // 显示当前活动面板
    if (activeTab === 'terminal' && terminalPanel) {
      terminalPanel.style.display = 'block';
      terminalPanel.style.visibility = 'visible';
      terminalPanel.style.position = 'relative';
      terminalPanel.style.zIndex = '1';
      
      // 刷新终端大小
      if (window.fitAddon) {
        setTimeout(() => window.fitAddon.fit(), 10);
      }
    } else if (activeTab === 'result' && outputPanel) {
      outputPanel.style.display = 'flex';
      outputPanel.style.visibility = 'visible';
      outputPanel.style.position = 'relative';
      outputPanel.style.zIndex = '1';
      
      // 更新输出内容
      if (window.OutputPanelManager) {
        window.OutputPanelManager.updateOutputContent();
      }
    } else if (activeTab === 'problems' && problemsPanel) {
      problemsPanel.style.display = 'flex';
      problemsPanel.style.visibility = 'visible';
      problemsPanel.style.position = 'relative';
      problemsPanel.style.zIndex = '1';
      
      // 更新问题列表
      if (window.ProblemsPanelManager) {
        window.ProblemsPanelManager.updateProblemsList();
      }
    } else if (activeTab === 'debug' && debugPanel) {
      debugPanel.style.display = 'flex';
      debugPanel.style.visibility = 'visible';
      debugPanel.style.position = 'relative';
      debugPanel.style.zIndex = '1';
      
      // 更新调试控制台
      if (window.DebugPanelManager) {
        window.DebugPanelManager.updateDebugConsole();
      }
    }
    
    log(LOG_LEVEL.INFO, '标签可见性已更新，当前活动标签:', activeTab);
  }
  
  /**
   * 初始化标签切换事件
   */
  function initializeTabEvents() {
    log(LOG_LEVEL.INFO, '初始化标签切换事件');
    
    // 获取标签元素
    const tabs = document.querySelectorAll('.panel-tabs .tab');
    
    // 为每个标签添加点击事件
    tabs.forEach(tab => {
      if (!tab._hasClickEvent) {
        tab.addEventListener('click', () => {
          const tabName = tab.getAttribute('data-tab');
          if (tabName) {
            switchTab(tabName);
          }
        });
        tab._hasClickEvent = true;
      }
    });
  }
  
  /**
   * 同步终端状态
   * @param {object} vueApp - Vue应用实例
   * @returns {boolean} - 是否成功同步
   */
  function syncTerminalState(vueApp) {
    if (!vueApp) return false;
    
    // 从Vue状态更新到终端状态
    if (vueApp.activeOutputTab) terminalState.activeTab = vueApp.activeOutputTab;
    if (vueApp.isPanelVisible !== undefined) terminalState.isPanelVisible = vueApp.isPanelVisible;
    if (vueApp.isPanelMaximized !== undefined) terminalState.isPanelMaximized = vueApp.isPanelMaximized;
    
    // 更新UI
    updateTabsVisibility();
    
    return true;
  }
  
  // 初始化
  function initialize() {
    // 添加标签样式
    if (window.ProblemsPanelManager) {
      window.ProblemsPanelManager.addProblemTabStyles();
    }
    
    // 添加调试控制台样式
    if (window.DebugPanelManager) {
      window.DebugPanelManager.addDebugConsoleStyles();
    }
    
    // 初始化标签切换事件
    initializeTabEvents();
    
    // 更新标签可见性
    updateTabsVisibility();
  }
  
  // 导出模块功能
  window.TabPanelManager = {
    switchTab,
    updateTabsVisibility,
    syncTerminalState,
    initialize,
    getState: () => ({...terminalState}),
    setState: (state) => {
      if (state && typeof state === 'object') {
        terminalState = {...terminalState, ...state};
        updateTabsVisibility();
      }
    },
    setLogLevel: function(level) {
      if (typeof level === 'number' && level >= 0 && level <= 3) {
        currentLogLevel = level;
      }
    }
  };
})(); 