/**
 * AI聊天API连接模块
 * 负责处理与后端AI服务的通信
 */

// 配置API基础URL
const API_BASE_URL = '/api'; // 本地开发环境使用相对路径

// API请求的基本配置
const API_CONFIG = {
  headers: {
    'Content-Type': 'application/json'
  },
  timeoutMs: 60000 // 增加到60秒超时，因为AI生成可能需要较长时间
};

// 请求重试配置
const RETRY_CONFIG = {
  maxRetries: 2,          // 最大重试次数
  retryDelay: 1000,       // 初始重试延迟（毫秒）
  retryBackoffFactor: 2   // 重试延迟增长因子
};

/**
 * 发送请求到API（带重试机制）
 * @param {string} endpoint - API端点
 * @param {Object} data - 请求数据
 * @returns {Promise<Object>} - API响应
 */
async function sendApiRequest(endpoint, data, retryCount = 0) {
  try {
    const url = `${API_BASE_URL}/${endpoint}`;
    console.log(`发送请求到: ${url}${retryCount > 0 ? ` (重试 #${retryCount})` : ''}`);
    
    // 设置请求超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeoutMs);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: API_CONFIG.headers,
      body: JSON.stringify(data),
      signal: controller.signal
    });
    
    // 清除超时计时器
    clearTimeout(timeoutId);
    
    // 检查响应状态
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `API请求失败: ${response.status} ${response.statusText}`;
      
      // 对于某些错误码尝试重试
      if (retryCount < RETRY_CONFIG.maxRetries && 
          (response.status === 429 || response.status >= 500)) {
        
        // 计算重试延迟时间（指数退避）
        const delay = RETRY_CONFIG.retryDelay * Math.pow(RETRY_CONFIG.retryBackoffFactor, retryCount);
        console.log(`将在 ${delay}ms 后重试请求...`);
        
        // 等待延迟后重试
        await new Promise(resolve => setTimeout(resolve, delay));
        return sendApiRequest(endpoint, data, retryCount + 1);
      }
      
      throw new Error(errorMessage);
    }
    
    // 解析响应数据
    return await response.json();
  } catch (error) {
    // 特殊处理超时错误
    if (error.name === 'AbortError') {
      throw new Error('请求超时，请稍后再试');
    }
    
    // 对于网络错误尝试重试
    if (retryCount < RETRY_CONFIG.maxRetries && 
        (error.message.includes('network') || error.message.includes('Network'))) {
      
      // 计算重试延迟时间
      const delay = RETRY_CONFIG.retryDelay * Math.pow(RETRY_CONFIG.retryBackoffFactor, retryCount);
      console.log(`网络错误，将在 ${delay}ms 后重试请求...`);
      
      // 等待延迟后重试
      await new Promise(resolve => setTimeout(resolve, delay));
      return sendApiRequest(endpoint, data, retryCount + 1);
    }
    
    console.error(`API请求错误 (${endpoint}):`, error);
    throw error;
  }
}

/**
 * 检查API连接是否可用
 * @returns {Promise<boolean>} 连接状态
 */
async function checkApiConnection() {
  try {
    // 添加随机参数防止缓存
    const cacheBuster = Date.now();
    const response = await fetch(`${API_BASE_URL}/health-check?cache=${cacheBuster}`);
    if (response.ok) {
      const data = await response.json();
      console.log('API连接状态:', data.message);
      return true;
    }
    return false;
  } catch (error) {
    console.error('API连接检查失败:', error);
    return false;
  }
}

/**
 * 发送聊天请求
 * @param {Array} messages - 消息数组，格式为 [{role: 'user', content: '...'}, ...]
 * @param {boolean} stream - 是否使用流式输出
 * @param {Function} onChunk - 流式输出时，每接收到一个块时的回调函数
 * @returns {Promise<string>} - AI回复的文本（非流式模式）或null（流式模式）
 */
async function sendChatRequest(messages, stream = false, onChunk = null) {
  try {
    // 记录请求时间用于计算延迟
    const startTime = Date.now();
    
    // 验证消息数组
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('消息数组不能为空');
    }
    
    // 确保messages中有用户消息
    const hasUserMessage = messages.some(msg => msg.role === 'user');
    if (!hasUserMessage) {
      throw new Error('消息数组必须包含至少一条用户消息');
    }
    
    // 如果是流式输出模式
    if (stream && onChunk) {
      console.log(`发送流式聊天请求: ${messages.length}条消息`);
      return streamChatRequest(messages, onChunk, startTime);
    } else {
      // 非流式模式（原有逻辑）
      console.log(`发送聊天请求: ${messages.length}条消息`);
      const response = await sendApiRequest('chat', { messages });
      
      // 计算响应延迟
      const responseTime = Date.now() - startTime;
      console.log(`AI响应延迟: ${responseTime}ms`);
      
      // 提取AI回复文本
      if (response.status === 'success' && response.message) {
        return response.message;
      } else {
        throw new Error('无效的AI响应格式');
      }
    }
  } catch (error) {
    console.error('聊天请求失败:', error);
    throw error;
  }
}

/**
 * 发送流式聊天请求
 * @param {Array} messages - 消息数组
 * @param {Function} onChunk - 每次接收到数据块时的回调函数
 * @param {number} startTime - 请求开始时间
 * @returns {Promise<null>} - 流式处理不返回最终结果
 */
async function streamChatRequest(messages, onChunk, startTime) {
  try {
    const url = `${API_BASE_URL}/chat`;
    
    // 创建AbortController用于超时处理
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeoutMs);
    
    // 发送请求，并指定stream=true
    const response = await fetch(url, {
      method: 'POST',
      headers: API_CONFIG.headers,
      body: JSON.stringify({ messages, stream: true }),
      signal: controller.signal
    });
    
    // 清除超时
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`流式请求失败: ${response.status} ${errorText}`);
    }
    
    // 获取响应的Reader
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let fullText = '';
    
    // 读取流
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }
      
      // 解码新收到的块
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;
      
      // 处理缓冲区中的每一行
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // 最后一行可能不完整，保留到下一次处理
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.substring(6);
          
          // 检查是否是结束标记
          if (data === '[DONE]') {
            console.log('流式响应完成');
            
            // 计算总响应时间
            const responseTime = Date.now() - startTime;
            console.log(`总AI响应延迟: ${responseTime}ms`);
            
            return null;
          }
          
          try {
            // 解析数据
            const parsedData = JSON.parse(data);
            
            if (parsedData.content) {
              // 添加到完整文本
              fullText += parsedData.content;
              
              // 调用回调函数
              onChunk(parsedData.content, fullText);
            }
          } catch (e) {
            console.error('解析流数据错误:', e, data);
          }
        }
      }
    }
    
    return null;
    
  } catch (error) {
    // 处理流请求错误
    console.error('流式聊天请求失败:', error);
    if (error.name === 'AbortError') {
      throw new Error('流式请求超时');
    }
    throw error;
  }
}

/**
 * 获取代码建议
 * @param {string} code - 要分析的代码
 * @param {string} language - 编程语言
 * @returns {Promise<string>} - 代码建议
 */
async function getCodeSuggestion(code, language) {
  try {
    const response = await sendApiRequest('code-suggestion', { code, language });
    
    if (response.status === 'success' && response.suggestion) {
      return response.suggestion;
    } else {
      throw new Error('无效的代码建议响应格式');
    }
  } catch (error) {
    console.error('代码建议请求失败:', error);
    throw error;
  }
}

/**
 * 获取代码解释
 * @param {string} code - 要解释的代码
 * @param {string} language - 编程语言
 * @returns {Promise<string>} - 代码解释
 */
async function getCodeExplanation(code, language) {
  try {
    const response = await sendApiRequest('code-explanation', { code, language });
    
    if (response.status === 'success' && response.explanation) {
      return response.explanation;
    } else {
      throw new Error('无效的代码解释响应格式');
    }
  } catch (error) {
    console.error('代码解释请求失败:', error);
    throw error;
  }
}

/**
 * 获取错误修复建议
 * @param {string} code - 含有错误的代码
 * @param {string} error - 错误信息
 * @param {string} language - 编程语言
 * @returns {Promise<string>} - 修复建议
 */
async function getErrorFixSuggestion(code, error, language) {
  try {
    const response = await sendApiRequest('error-fix', { code, error, language });
    
    if (response.status === 'success' && response.fix) {
      return response.fix;
    } else {
      throw new Error('无效的错误修复响应格式');
    }
  } catch (error) {
    console.error('错误修复请求失败:', error);
    throw error;
  }
}

// 导出API函数
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sendChatRequest,
    getCodeSuggestion,
    getCodeExplanation,
    getErrorFixSuggestion,
    checkApiConnection
  };
} else {
  // 浏览器环境下，将函数添加到全局对象
  window.aiApi = {
    sendChatRequest,
    getCodeSuggestion,
    getCodeExplanation,
    getErrorFixSuggestion,
    checkApiConnection
  };
} 