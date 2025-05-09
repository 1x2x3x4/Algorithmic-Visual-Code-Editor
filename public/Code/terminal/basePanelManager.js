/**
 * 基础面板管理器模块
 * 提供所有面板管理器共用的基础功能
 */
(function() {
  // 全局日志级别常量
  window.PANEL_LOG_LEVEL = window.PANEL_LOG_LEVEL || {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
  };
  
  /**
   * 创建面板管理器基础类
   * @param {string} name 管理器名称
   * @param {number} defaultLogLevel 默认日志级别
   * @returns {Object} 面板管理器基础对象
   */
  function createBasePanelManager(name, defaultLogLevel = window.PANEL_LOG_LEVEL.INFO) {
    let currentLogLevel = defaultLogLevel;
    
    // 基础管理器对象
    const baseManager = {
      /**
       * 记录日志
       * @param {number} level - 日志级别
       * @param {string} message - 日志消息
       * @param  {...any} args - 附加参数
       */
      log(level, message, ...args) {
        if (level <= currentLogLevel) {
          const prefix = ['[错误]', '[警告]', '[信息]', '[调试]'][level];
          console.log(`${prefix} ${name}: ${message}`, ...args);
        }
      },
      
      /**
       * 设置日志级别
       * @param {number} level 新的日志级别
       */
      setLogLevel(level) {
        if (typeof level === 'number' && level >= 0 && level <= 3) {
          currentLogLevel = level;
          this.log(window.PANEL_LOG_LEVEL.INFO, `日志级别已设置为 ${level}`);
        }
      },
      
      /**
       * 获取当前日志级别
       * @returns {number} 当前日志级别
       */
      getLogLevel() {
        return currentLogLevel;
      },
      
      /**
       * 添加样式到文档
       * @param {string} id 样式元素ID
       * @param {string} cssText CSS文本内容
       */
      addStyles(id, cssText) {
        if (document.querySelector(`#${id}`)) return;
        
        const style = document.createElement('style');
        style.id = id;
        style.textContent = cssText;
        document.head.appendChild(style);
        
        this.log(window.PANEL_LOG_LEVEL.INFO, `已添加样式 ${id}`);
      },
      
      /**
       * 查找DOM元素
       * @param {string} selector 选择器
       * @param {boolean} required 是否必需
       * @returns {Element|null} DOM元素
       */
      getElement(selector, required = false) {
        const element = document.querySelector(selector);
        
        if (!element && required) {
          this.log(window.PANEL_LOG_LEVEL.ERROR, `未找到 ${selector} 元素`);
        }
        
        return element;
      },
      
      /**
       * 检查Vue应用实例
       * @returns {boolean} Vue应用是否可用
       */
      checkVueApp() {
        if (!window.app || typeof window.app.$data === 'undefined') {
          this.log(window.PANEL_LOG_LEVEL.WARN, 'Vue应用实例未初始化');
          return false;
        }
        return true;
      },
      
      /**
       * 为元素添加一次性事件监听器
       * @param {Element} element DOM元素
       * @param {string} event 事件名称
       * @param {Function} callback 回调函数
       * @param {string} flagName 标记属性名
       */
      addOneTimeEventListener(element, event, callback, flagName = '_hasEventListener') {
        if (!element) return;
        
        // 如果元素已经有事件监听器，则不再添加
        if (element[flagName]) return;
        
        // 添加事件监听器
        element.addEventListener(event, callback);
        element[flagName] = true;
        
        this.log(window.PANEL_LOG_LEVEL.DEBUG, `为 ${element.className || element.id || 'DOM元素'} 添加 ${event} 事件监听器`);
      }
    };
    
    return baseManager;
  }
  
  // 导出工厂函数
  window.createBasePanelManager = createBasePanelManager;
})(); 