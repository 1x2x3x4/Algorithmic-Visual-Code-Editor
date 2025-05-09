/**
 * 问题面板管理模块
 * 负责处理代码问题和错误的显示及交互
 */
(function() {
  // 确保基础管理器已加载
  if (typeof window.createBasePanelManager !== 'function') {
    console.error('基础面板管理器未加载，问题面板管理器初始化失败');
    return;
  }
  
  // 创建管理器实例
  const manager = window.createBasePanelManager('ProblemsPanel');
  
  /**
   * 更新问题列表
   * @param {string} filterText - 筛选文本
   */
  function updateProblemsList(filterText) {
    // 使用节流控制，防止频繁刷新
    const now = Date.now();
    if (manager._lastPanelUpdateTime && now - manager._lastPanelUpdateTime < 500) {
      // 如果上次更新时间过近，延迟执行
      if (manager._panelUpdateTimer) {
        clearTimeout(manager._panelUpdateTimer);
      }
      
      manager._panelUpdateTimer = setTimeout(() => {
        manager._lastPanelUpdateTime = Date.now();
        updateProblemsList(filterText);
      }, 500);
      
      return;
    }
    
    // 记录更新时间
    manager._lastPanelUpdateTime = now;
    
    manager.log(window.PANEL_LOG_LEVEL.INFO, '更新问题列表，筛选条件:', filterText);
    
    // 获取问题面板元素
    const problemsPanel = manager.getElement('.problems-panel', true);
    if (!problemsPanel) return;
    
    // 获取问题列表元素
    const problemsList = problemsPanel.querySelector('.problems-list');
    if (!problemsList) {
      manager.log(window.PANEL_LOG_LEVEL.ERROR, '未找到.problems-list元素');
      return;
    }
    
    // 检查Vue实例是否存在
    if (!manager.checkVueApp()) {
      problemsList.innerHTML = '<div class="no-problems">无法连接到应用程序状态。</div>';
      return;
    }
    
    // 获取Vue应用程序中的问题列表
    const app = window.app.$data;
    const problems = app.problems || [];
    
    // 筛选问题
    let filteredProblems = problems;
    if (filterText) {
      filterText = filterText.toLowerCase();
      filteredProblems = problems.filter(problem => {
        return (
          problem.message.toLowerCase().includes(filterText) ||
          (problem.file && problem.file.toLowerCase().includes(filterText)) ||
          (typeof problem.line === 'number' && problem.line.toString().includes(filterText)) ||
          (problem.source && problem.source.toLowerCase().includes(filterText)) ||
          (problem.languageId && problem.languageId.toLowerCase().includes(filterText))
        );
      });
    }
    
    // 检查问题列表是否与上次相同
    const problemsString = JSON.stringify(filteredProblems);
    if (problemsString === manager._lastProblemsString) {
      // 如果问题列表与上次相同，则跳过更新
      manager.log(window.PANEL_LOG_LEVEL.INFO, '问题列表未变化，跳过更新');
      return;
    }
    
    // 保存当前问题列表的字符串表示
    manager._lastProblemsString = problemsString;
    
    // 检查是否有问题
    if (filteredProblems.length === 0) {
      problemsList.innerHTML = '<div class="no-problems">目前没有发现问题</div>';
      
      // 更新问题标签样式
      const problemsTab = manager.getElement('.panel-tabs .tab[data-tab="problems"]');
      if (problemsTab) {
        problemsTab.classList.remove('has-problems');
      }
      
      manager.log(window.PANEL_LOG_LEVEL.INFO, '没有问题需要显示');
      return;
    }
    
    // 构建问题列表HTML
    let problemsHTML = '';
    filteredProblems.forEach(problem => {
      const severity = problem.severity || 'error';
      const message = problem.message || '未知错误';
      const file = problem.file || '未知文件';
      const line = typeof problem.line === 'number' ? problem.line : 0;
      const languageId = problem.languageId || '';
      
      // 获取语言特定的前缀
      let langPrefix = '';
      if (languageId) {
        switch (languageId) {
          case 'c':
            langPrefix = 'C: ';
            break;
          case 'cpp':
            langPrefix = 'C++: ';
            break;
          case 'python':
            langPrefix = 'Python: ';
            break;
          case 'java':
            langPrefix = 'Java: ';
            break;
          case 'javascript':
          case 'typescript':
            langPrefix = 'JS: ';
            break;
        }
      }
      
      // 单行问题项
      problemsHTML += `
        <div class="problem-item ${severity}" data-file="${file}" data-line="${line}">
          <span class="problem-indicator ${severity}">${severity === 'error' ? '×' : '!'}</span>
          <span class="problem-message">${langPrefix}${message}</span>
          <span class="problem-location">${file}:${line}</span>
        </div>
      `;
    });
    
    // 更新问题列表HTML
    problemsList.innerHTML = problemsHTML;
    
    // 更新问题标签样式 - 确保应用样式
    const problemsTab = manager.getElement('.panel-tabs .tab[data-tab="problems"]');
    if (problemsTab) {
      // 先确保应用了样式
      manager.addProblemTabStyles && manager.addProblemTabStyles();
      // 添加has-problems类，使红点指示器可见
      problemsTab.classList.add('has-problems');
      console.log('问题标签已添加has-problems样式类');
    }
    
    // 设置问题项点击处理程序
    setupProblemItemClickHandlers();
    
    manager.log(window.PANEL_LOG_LEVEL.INFO, `已显示 ${filteredProblems.length} 个问题`);
  }
  
  /**
   * 设置问题项的点击事件处理程序
   */
  function setupProblemItemClickHandlers() {
    const problemItems = document.querySelectorAll('.problem-item');
    
    problemItems.forEach(item => {
      manager.addOneTimeEventListener(item, 'click', () => {
        const file = item.getAttribute('data-file');
        const line = parseInt(item.getAttribute('data-line'), 10);
        
        if (file && !isNaN(line)) {
          goToEditorPosition(line, 0, file);
        }
      }, '_hasClickListener');
    });
  }
  
  /**
   * 跳转到编辑器指定位置
   * @param {number} line - 行号
   * @param {number} column - 列号
   * @param {string} file - 文件名
   */
  function goToEditorPosition(line, column, file) {
    manager.log(window.PANEL_LOG_LEVEL.INFO, `跳转到编辑器位置: ${file}:${line}:${column}`);
    
    // 检查是否有编辑器API可用
    if (window.monacoEditorAPI) {
      window.monacoEditorAPI.goToPosition(line, column, file);
    } else if (window.editor && typeof window.editor.revealPositionInCenter === 'function') {
      // 直接使用Monaco编辑器API
      const position = { lineNumber: line, column: column || 1 };
      window.editor.revealPositionInCenter(position);
      window.editor.setPosition(position);
      window.editor.focus();
    } else {
      manager.log(window.PANEL_LOG_LEVEL.ERROR, '无法找到编辑器API，无法跳转到指定位置');
    }
  }
  
  /**
   * 清除所有问题
   */
  function clearProblems() {
    manager.log(window.PANEL_LOG_LEVEL.INFO, '清除所有问题');
    
    if (manager.checkVueApp()) {
      window.app.$data.problems = [];
      updateProblemsList();
    }
  }
  
  /**
   * 添加问题样式
   */
  function addProblemTabStyles() {
    manager.addStyles('problem-tab-styles', `
      .panel-tabs .tab[data-tab="problems"].has-problems {
        position: relative;
      }
      
      .panel-tabs .tab[data-tab="problems"].has-problems::after {
        content: '';
        position: absolute;
        top: 5px;
        right: 5px;
        width: 8px;
        height: 8px;
        background-color: #d32f2f;
        border-radius: 50%;
        animation: pulsate 1.5s infinite ease-in-out;
      }
      
      @keyframes pulsate {
        0% { opacity: 0.5; transform: scale(0.8); }
        50% { opacity: 1; transform: scale(1.2); }
        100% { opacity: 0.5; transform: scale(0.8); }
      }
      
      .problems-list {
        width: 100%;
        overflow-x: hidden;
        display: flex;
        flex-direction: column;
      }
      
      .problem-item {
        display: flex;
        align-items: center;
        height: 28px;
        padding: 5px;
        border-bottom: 1px solid #e0e0e0;
        cursor: pointer;
        transition: background-color 0.2s;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin: 0; /* 确保没有外边距 */
      }
      
      .problem-item:hover {
        background-color: #f5f5f5;
      }
      
      .problem-indicator {
        display: inline-block;
        width: 16px;
        text-align: center;
        margin-right: 8px;
        font-weight: bold;
      }
      
      .problem-message {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-right: 8px;
      }
      
      .problem-location {
        color: #666;
        font-size: 12px;
        flex-shrink: 0;
      }
      
      .problem-item.error .problem-indicator {
        color: #d32f2f;
      }
      
      .problem-item.warning .problem-indicator {
        color: #f57c00;
      }
      
      .problem-item.info .problem-indicator {
        color: #0277bd;
      }
      
      .problem-item.error .problem-message {
        color: #d32f2f;
      }
      
      .problem-item.warning .problem-message {
        color: #f57c00;
      }
      
      .problem-item.info .problem-message {
        color: #0277bd;
      }
      
      .no-problems {
        padding: 10px;
        color: #666;
        font-style: italic;
        text-align: center;
        margin: 0;
      }
    `);
  }
  
  // 导出模块功能
  window.ProblemsPanelManager = {
    ...manager, // 继承基础管理器的所有属性和方法
    updateProblemsList,
    clearProblems,
    goToEditorPosition,
    addProblemTabStyles
  };
  
  // 立即添加问题标签样式，确保样式在模块加载时就可用
  addProblemTabStyles();
})(); 