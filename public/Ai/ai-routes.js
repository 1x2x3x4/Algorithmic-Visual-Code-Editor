const express = require('express');
const axios = require('axios');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// DeepSeek API配置
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const API_KEY = process.env.DEEPSEEK_API_KEY;

// 确保日志目录存在
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// 记录AI请求日志
function logAiRequest(requestType, messages, response) {
  const timestamp = new Date().toISOString();
  const logFile = path.join(logsDir, 'ai-requests.log');
  
  const logEntry = {
    timestamp,
    type: requestType,
    messages: messages,
    response: response
  };
  
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
}

// 聊天API路由
router.post('/chat', async (req, res) => {
  try {
    // 获取请求中的消息
    const { messages, stream = false } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        status: 'error',
        message: '请求格式错误，缺少消息数组'
      });
    }
    
    console.log(`收到聊天请求: ${messages.length}条消息, stream=${stream}`);
    console.log(`最后一条用户消息: ${messages.find(m => m.role === 'user')?.content.substring(0, 50)}...`);
    
    // 验证消息数组结构
    const validMessages = messages.filter(msg => 
      msg && typeof msg === 'object' && 
      ['system', 'user', 'assistant'].includes(msg.role) && 
      typeof msg.content === 'string'
    );
    
    if (validMessages.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: '消息数组格式无效'
      });
    }
    
    // 构建发送到DeepSeek的请求体
    const requestBody = {
      model: 'deepseek-chat', // 使用DeepSeek的聊天模型
      messages: validMessages, // 传递有效的完整对话上下文
      temperature: 0.7,
      max_tokens: 1000,
      stream: stream // 启用或禁用流式输出
    };

    // 判断是否使用流式输出
    if (stream) {
      // 设置正确的响应头，以支持流式传输
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // 发送请求到DeepSeek API，使用流式处理
      const response = await axios.post(DEEPSEEK_API_URL, requestBody, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        responseType: 'stream' // 设置响应类型为流
      });

      // 处理流式响应
      response.data.on('data', (chunk) => {
        try {
          const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
          
          for (const line of lines) {
            // 处理每一行数据
            if (line.startsWith('data: ')) {
              const data = line.substring(6);
              
              // 检查是否是结束标记
              if (data === '[DONE]') {
                res.write(`data: [DONE]\n\n`);
                return;
              }
              
              try {
                // 解析JSON数据
                const parsedData = JSON.parse(data);
                const content = parsedData.choices[0].delta.content || '';
                
                if (content) {
                  // 发送部分内容到客户端
                  res.write(`data: ${JSON.stringify({ content })}\n\n`);
                }
              } catch (e) {
                console.error('解析流数据错误:', e);
              }
            }
          }
        } catch (error) {
          console.error('处理流数据错误:', error);
        }
      });

      // 处理流结束
      response.data.on('end', () => {
        // 确保最后发送结束标记
        res.write(`data: [DONE]\n\n`);
        res.end();
        
        // 日志记录（这里仅记录请求，但没有完整的响应）
        logAiRequest('chat-stream', validMessages, '流式输出');
      });

      // 处理错误
      response.data.on('error', (err) => {
        console.error('流处理错误:', err);
        res.end();
      });
      
    } else {
      // 使用非流式处理方式（原有逻辑）
      const response = await axios.post(DEEPSEEK_API_URL, requestBody, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      // 从DeepSeek响应中提取文本
      const aiResponse = response.data.choices[0].message.content;
      
      // 记录请求和响应
      logAiRequest('chat', validMessages, aiResponse);
      
      // 返回响应给客户端
      res.json({
        status: 'success',
        message: aiResponse
      });
    }
    
  } catch (error) {
    console.error('AI聊天请求失败:', error.message);
    
    // 如果有响应数据，记录更详细的错误信息
    if (error.response) {
      console.error('错误详情:', error.response.data);
    }
    
    res.status(500).json({
      status: 'error',
      message: '与AI服务通信时出错',
      details: error.message
    });
  }
});

// 添加健康检查路由
router.get('/health-check', (req, res) => {
  // 检查API密钥是否存在
  const isApiKeyAvailable = !!API_KEY;
  
  res.json({
    status: 'success',
    message: isApiKeyAvailable ? 'AI服务可用' : 'AI服务配置不完整',
    available: isApiKeyAvailable
  });
});

// 代码建议API路由
router.post('/code-suggestion', async (req, res) => {
  try {
    const { code, language } = req.body;
    
    if (!code) {
      return res.status(400).json({
        status: 'error',
        message: '请求格式错误，缺少代码内容'
      });
    }
    
    // 构建发送到DeepSeek的消息
    const messages = [
      { role: 'system', content: `你是一个专业的${language || '编程'}助手，请为以下代码提供改进建议。` },
      { role: 'user', content: code }
    ];
    
    // 构建请求体
    const requestBody = {
      model: 'deepseek-coder', // 使用DeepSeek的代码模型
      messages: messages,
      temperature: 0.3, // 较低的温度以获得更精确的代码建议
      max_tokens: 1500
    };
    
    // 发送请求到DeepSeek API
    const response = await axios.post(DEEPSEEK_API_URL, requestBody, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    // 提取响应
    const suggestion = response.data.choices[0].message.content;
    
    // 记录请求和响应
    logAiRequest('code-suggestion', messages, suggestion);
    
    // 返回响应给客户端
    res.json({
      status: 'success',
      suggestion: suggestion
    });
    
  } catch (error) {
    console.error('代码建议请求失败:', error.message);
    
    res.status(500).json({
      status: 'error',
      message: '获取代码建议时出错',
      details: error.message
    });
  }
});

// 代码解释API路由
router.post('/code-explanation', async (req, res) => {
  try {
    const { code, language } = req.body;
    
    if (!code) {
      return res.status(400).json({
        status: 'error',
        message: '请求格式错误，缺少代码内容'
      });
    }
    
    // 构建发送到DeepSeek的消息
    const messages = [
      { role: 'system', content: `你是一个专业的${language || '编程'}助手，请用简洁明了的语言解释以下代码的功能和工作原理。` },
      { role: 'user', content: code }
    ];
    
    // 构建请求体
    const requestBody = {
      model: 'deepseek-coder', // 使用DeepSeek的代码模型
      messages: messages,
      temperature: 0.3,
      max_tokens: 1500
    };
    
    // 发送请求到DeepSeek API
    const response = await axios.post(DEEPSEEK_API_URL, requestBody, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    // 提取响应
    const explanation = response.data.choices[0].message.content;
    
    // 记录请求和响应
    logAiRequest('code-explanation', messages, explanation);
    
    // 返回响应给客户端
    res.json({
      status: 'success',
      explanation: explanation
    });
    
  } catch (error) {
    console.error('代码解释请求失败:', error.message);
    
    res.status(500).json({
      status: 'error',
      message: '获取代码解释时出错',
      details: error.message
    });
  }
});

// 错误修复API路由
router.post('/error-fix', async (req, res) => {
  try {
    const { code, error, language } = req.body;
    
    if (!code) {
      return res.status(400).json({
        status: 'error',
        message: '请求格式错误，缺少代码内容'
      });
    }
    
    // 构建发送到DeepSeek的消息
    const messages = [
      { role: 'system', content: `你是一个专业的${language || '编程'}助手，请帮助修复以下代码中的错误。` },
      { role: 'user', content: `我的代码：\n\n${code}\n\n错误信息：\n\n${error || '代码运行不正确，请帮我找出并修复问题。'}` }
    ];
    
    // 构建请求体
    const requestBody = {
      model: 'deepseek-coder', // 使用DeepSeek的代码模型
      messages: messages,
      temperature: 0.2, // 更低的温度以获得准确的错误修复
      max_tokens: 1500
    };
    
    // 发送请求到DeepSeek API
    const response = await axios.post(DEEPSEEK_API_URL, requestBody, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    // 提取响应
    const fix = response.data.choices[0].message.content;
    
    // 记录请求和响应
    logAiRequest('error-fix', messages, fix);
    
    // 返回响应给客户端
    res.json({
      status: 'success',
      fix: fix
    });
    
  } catch (error) {
    console.error('错误修复请求失败:', error.message);
    
    res.status(500).json({
      status: 'error',
      message: '获取错误修复建议时出错',
      details: error.message
    });
  }
});

module.exports = router; 