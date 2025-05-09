/**
 * 标签面板管理模块
 * 负责管理输出区域的标签切换和显示
 */
(function() {
  // 确保基础管理器已加载
  if (typeof window.createBasePanelManager !== 'function') {
    console.error('基础面板管理器未加载，标签面板管理器初始化失败');
    return;
  }
  
  // 创建管理器实例
  const manager = window.createBasePanelManager('TabPanel');
  
  // 终端状态
  let terminalState = {
    activeTab: 'terminal', // 当前活动标签: terminal, result, problems, debug
    isPanelVisible: true,
    isPanelMaximized: false
  };
  
  /**
   * 切换输出区标签页
   * @param {string} tabName - 要切换到的标签页名称
   */
  function switchTab(tabName) {
    manager.log(window.PANEL_LOG_LEVEL.INFO, '切换到标签页', tabName);
    
    // 验证标签名称
    if (!['terminal', 'result', 'problems', 'debug'].includes(tabName)) {
      manager.log(window.PANEL_LOG_LEVEL.ERROR, '无效的标签名称:', tabName);
      return;
    }
    
    // 更新当前活动标签
    terminalState.activeTab = tabName;
    
    // 更新UI
    updateTabsVisibility();
    
    // 如果Vue应用存在，同步状态（除非是从Vue应用调用的）
    if (window.app && typeof window.app.$data !== 'undefined' && 
        window.terminalAPI && !window.terminalAPI._preserveVueSync) {
      window.app.$data.activeOutputTab = tabName;
    }
  }
  
  /**
   * 更新标签页可见性
   */
  function updateTabsVisibility() {
    // 获取所有面板
    const terminalPanel = manager.getElement('#terminal-container');
    const outputPanel = manager.getElement('.output-panel');
    const problemsPanel = manager.getElement('.problems-panel');
    const debugPanel = manager.getElement('.debug-panel');
    
    // 获取当前活动标签
    const activeTab = terminalState.activeTab;
    
    // 隐藏所有面板
    [terminalPanel, outputPanel, problemsPanel, debugPanel].forEach(panel => {
      if (panel) {
        panel.style.display = 'none';
        panel.style.visibility = 'hidden';
        panel.style.position = 'absolute';
        panel.style.zIndex = '-1';
    }
    });
    
    // 显示当前活动面板
    let activePanel = null;
    let updateFunction = null;
    
    if (activeTab === 'terminal' && terminalPanel) {
      activePanel = terminalPanel;
      // 特殊处理终端面板
      activePanel.style.display = 'block';
      
      // 刷新终端大小
      if (window.fitAddon) {
        setTimeout(() => window.fitAddon.fit(), 10);
      }
    } else if (activeTab === 'result' && outputPanel) {
      activePanel = outputPanel;
      // 特殊处理输出面板
      activePanel.style.display = 'flex';
      
      // 更新输出内容
      updateFunction = () => {
      if (window.OutputPanelManager) {
        window.OutputPanelManager.updateOutputContent();
      }
      };
    } else if (activeTab === 'problems' && problemsPanel) {
      activePanel = problemsPanel;
      // 特殊处理问题面板
      activePanel.style.display = 'flex';
      
      // 更新问题列表
      updateFunction = () => {
      if (window.ProblemsPanelManager) {
        window.ProblemsPanelManager.updateProblemsList();
      }
      };
    } else if (activeTab === 'debug' && debugPanel) {
      activePanel = debugPanel;
      // 特殊处理调试面板
      activePanel.style.display = 'flex';
      
      // 更新调试控制台
      updateFunction = () => {
      if (window.DebugPanelManager) {
        window.DebugPanelManager.updateDebugConsole();
      }
      };
    }
    
    // 更新活动面板的样式
    if (activePanel) {
      activePanel.style.visibility = 'visible';
      activePanel.style.position = 'relative';
      activePanel.style.zIndex = '1';
      
      // 执行更新函数
      if (updateFunction) {
        updateFunction();
      }
    }
    
    manager.log(window.PANEL_LOG_LEVEL.INFO, '标签可见性已更新，当前活动标签:', activeTab);
  }
  
  /**
   * 初始化标签切换事件
   */
  function initializeTabEvents() {
    manager.log(window.PANEL_LOG_LEVEL.INFO, '初始化标签切换事件');
    
    // 获取标签元素
    const tabs = document.querySelectorAll('.panel-tabs .tab');
    
    // 为每个标签添加点击事件
    tabs.forEach(tab => {
      manager.addOneTimeEventListener(tab, 'click', () => {
          const tabName = tab.getAttribute('data-tab');
          if (tabName) {
            switchTab(tabName);
          }
      }, '_hasClickEvent');
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
    ...manager, // 继承基础管理器的所有属性和方法
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
    }
  };
})(); 