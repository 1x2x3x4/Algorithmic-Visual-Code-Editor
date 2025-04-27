/**
 * 问题面板管理模块
 * 负责处理代码问题和错误的显示及交互
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
      console.log(`${prefix} ProblemsPanel: ${message}`, ...args);
    }
  }
  
  /**
   * 更新问题列表
   * @param {string} filterText - 筛选文本
   */
  function updateProblemsList(filterText) {
    log(LOG_LEVEL.INFO, '更新问题列表，筛选条件:', filterText);
    
    // 获取问题面板元素
    const problemsPanel = document.querySelector('.problems-panel');
    if (!problemsPanel) {
      log(LOG_LEVEL.ERROR, '未找到.problems-panel元素');
      return;
    }
    
    // 获取问题列表元素
    const problemsList = problemsPanel.querySelector('.problems-list');
    if (!problemsList) {
      log(LOG_LEVEL.ERROR, '未找到.problems-list元素');
      return;
    }
    
    // 检查Vue实例是否存在
    if (!window.app || typeof window.app.$data === 'undefined') {
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
          (typeof problem.line === 'number' && problem.line.toString().includes(filterText))
        );
      });
    }
    
    // 检查是否有问题
    if (filteredProblems.length === 0) {
      problemsList.innerHTML = '<div class="no-problems">目前没有发现问题</div>';
      
      // 更新问题标签样式
      const problemsTab = document.querySelector('.panel-tabs .tab[data-tab="problems"]');
      if (problemsTab) {
        problemsTab.classList.remove('has-problems');
      }
      
      log(LOG_LEVEL.INFO, '没有问题需要显示');
      return;
    }
    
    // 构建问题列表HTML
    let problemsHTML = '';
    filteredProblems.forEach(problem => {
      const severity = problem.severity || 'error';
      const message = problem.message || '未知错误';
      const file = problem.file || '未知文件';
      const line = typeof problem.line === 'number' ? problem.line : 0;
      
      problemsHTML += `
        <div class="problem-item ${severity}" data-file="${file}" data-line="${line}">
          <div class="problem-severity ${severity}">${severity === 'error' ? '×' : '!'}</div>
          <div class="problem-details">
            <div class="problem-message">${message}</div>
            <div class="problem-location">${file}:${line}</div>
          </div>
        </div>
      `;
    });
    
    // 更新问题列表HTML
    problemsList.innerHTML = problemsHTML;
    
    // 更新问题标签样式
    const problemsTab = document.querySelector('.panel-tabs .tab[data-tab="problems"]');
    if (problemsTab) {
      problemsTab.classList.add('has-problems');
    }
    
    // 设置问题项点击处理程序
    setupProblemItemClickHandlers();
    
    log(LOG_LEVEL.INFO, `已显示 ${filteredProblems.length} 个问题`);
  }
  
  /**
   * 设置问题项的点击事件处理程序
   */
  function setupProblemItemClickHandlers() {
    const problemItems = document.querySelectorAll('.problem-item');
    
    problemItems.forEach(item => {
      if (!item._hasClickListener) {
        item.addEventListener('click', () => {
          const file = item.getAttribute('data-file');
          const line = parseInt(item.getAttribute('data-line'), 10);
          
          if (file && !isNaN(line)) {
            goToEditorPosition(line, 0, file);
          }
        });
        
        item._hasClickListener = true;
      }
    });
  }
  
  /**
   * 跳转到编辑器指定位置
   * @param {number} line - 行号
   * @param {number} column - 列号
   * @param {string} file - 文件名
   */
  function goToEditorPosition(line, column, file) {
    log(LOG_LEVEL.INFO, `跳转到编辑器位置: ${file}:${line}:${column}`);
    
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
      log(LOG_LEVEL.ERROR, '无法找到编辑器API，无法跳转到指定位置');
    }
  }
  
  /**
   * 清除所有问题
   */
  function clearProblems() {
    log(LOG_LEVEL.INFO, '清除所有问题');
    
    if (window.app && typeof window.app.$data !== 'undefined') {
      window.app.$data.problems = [];
      updateProblemsList();
    }
  }
  
  /**
   * 添加问题样式
   */
  function addProblemTabStyles() {
    if (document.querySelector('#problem-tab-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'problem-tab-styles';
    style.textContent = `
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
      
      .problem-item {
        display: flex;
        padding: 6px 10px;
        border-bottom: 1px solid #e0e0e0;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      
      .problem-item:hover {
        background-color: #f5f5f5;
      }
      
      .problem-item .problem-severity {
        margin-right: 10px;
        flex-shrink: 0;
      }
      
      .problem-item .problem-details {
        flex: 1;
      }
      
      .problem-item .problem-message {
        font-weight: 500;
        margin-bottom: 3px;
      }
      
      .problem-item .problem-location {
        font-size: 12px;
        color: #666;
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
    `;
    
    document.head.appendChild(style);
  }
  
  // 导出模块功能
  window.ProblemsPanelManager = {
    updateProblemsList,
    clearProblems,
    goToEditorPosition,
    addProblemTabStyles,
    setLogLevel: function(level) {
      if (typeof level === 'number' && level >= 0 && level <= 3) {
        currentLogLevel = level;
      }
    }
  };
})(); 