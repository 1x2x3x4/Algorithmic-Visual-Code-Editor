require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const cors = require('cors');
const util = require('util');
const AlgorithmIntegrator = require('./public/AnimatedArea/visualizationSteps.js');

// 设置DeepSeek API密钥
if (!process.env.DEEPSEEK_API_KEY) {
    process.env.DEEPSEEK_API_KEY = 'sk-3cb1dbac887b404084eb00fc9c2d6583';
}

// 导入自定义路由和中间件
const aiRoutes = require('./public/Ai/ai-routes.js');
const rateLimiter = require('./public/Ai/rate-limiter.js');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 确保所有必要的目录存在
const publicDir = path.join(__dirname, 'public');
const tempDir = path.join(__dirname, 'temp');
const logsDir = path.join(__dirname, 'logs');
const animatedAreaDir = path.join(publicDir, 'AnimatedArea');
const codeDir = path.join(publicDir, 'Code');

[publicDir, tempDir, logsDir, animatedAreaDir, codeDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// 中间件配置
app.use(cors({ origin: '*', methods: ['GET', 'POST'], credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(publicDir, {
  setHeaders: (res, path) => {
    if (path.endsWith('.mjs') || path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// 为AI相关路由添加速率限制
app.use('/api', rateLimiter({
    windowMs: 60000, // 1分钟
    maxRequests: 15  // 每分钟15个请求
}));

// 添加AI API路由
app.use('/api', aiRoutes);

// 根路由
app.get('/', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
});

// API密钥测试路由
app.get('/api-key-test', (req, res) => {
    const maskedKey = process.env.DEEPSEEK_API_KEY ? 
        `${process.env.DEEPSEEK_API_KEY.substring(0, 5)}...${process.env.DEEPSEEK_API_KEY.substring(process.env.DEEPSEEK_API_KEY.length - 5)}` : 
        'Not set';
    res.json({
        status: 'success',
        message: `API密钥已设置: ${maskedKey}`
    });
});

// 编译代码API
app.post('/compile', async (req, res) => {
    const code = req.body.code;
    if (!code) {
        return res.status(400).json({
            status: 'error',
            message: '代码不能为空'
        });
    }
    
    try {
        const result = await compileAndRunCode(code);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: `编译错误: ${error.message}`
        });
    }
});

// 404处理
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: '找不到请求的资源'
    });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('错误:', err);
    res.status(500).json({
        status: 'error',
        message: err.message || '服务器内部错误'
    });
});

// WebSocket处理
wss.on('connection', (ws) => {
  console.log('客户端已连接');
  
  ws._visualizationActive = false;
  ws._visualizationAlgorithm = null;

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'startVisualization') {
        ws._visualizationActive = true;
        ws._visualizationAlgorithm = data.algorithm;
        
        sendVisualizationData(ws, {
          algorithm: data.algorithm,
          speed: data.speed,
          initialNodes: [
            { id: 1, value: 10, next: 2 },
            { id: 2, value: 20, next: null },
          ],
          array: data.array,
        });
      } else if (data.type === 'cancelVisualization') {
        ws._visualizationActive = false;
        ws._visualizationAlgorithm = null;
        ws.send(JSON.stringify({
          type: 'visualization_cancelled'
        }));
      }
    } catch (e) {
      console.error('处理WebSocket消息时出错:', e);
      ws.send(JSON.stringify({
        type: 'error',
        message: '处理请求时出错'
      }));
    }
  });

  ws.on('close', () => {
    console.log('客户端断开连接');
    ws._visualizationActive = false;
  });
});

async function compileAndRunCode(code) {
  return new Promise((resolve, reject) => {
    try {
      // 创建临时文件
      const tempFile = path.join(tempDir, `temp_${Date.now()}.js`);
      fs.writeFileSync(tempFile, code);
      
      // 执行代码
      exec(`node ${tempFile}`, (error, stdout, stderr) => {
        // 清理临时文件
        try {
          fs.unlinkSync(tempFile);
        } catch (e) {
          console.error('删除临时文件失败', e);
        }
        
        if (error) {
          return resolve({
            status: 'error',
            output: stderr || error.message
          });
        }
        
        resolve({
          status: 'success',
          output: stdout
        });
      });
    } catch (error) {
      reject(error);
    }
  });
}

function sendVisualizationData(ws, data) {
  try {
    if (!ws || ws.readyState !== 1) return;
    
    if (!data.algorithm) {
      ws.send(JSON.stringify({
        type: 'error',
        message: '未指定算法类型'
      }));
      return;
    }
    
    // 检查数组数据（对于排序算法）
    if (['bubbleSort', 'selectionSort', 'insertionSort', 'quickSort', 'heapSort', 'mergeSort', 'radixSort', 'bucketSort', 'countingSort'].includes(data.algorithm)) {
      if (!data.array || !Array.isArray(data.array) || data.array.length === 0) {
        data.array = [38, 27, 43, 3, 9, 82, 10]; // 使用默认数组
      }
    }
    
    // 生成步骤
    const steps = generateVisualizationSteps(data);
    
    // 发送可视化步骤
    sendAlgorithmSteps(ws, data, steps);
  } catch (error) {
    ws.send(JSON.stringify({
      type: 'error',
      message: `处理可视化请求失败: ${error.message}`
    }));
  }
}

// 生成可视化步骤
function generateVisualizationSteps(data) {
  try {
    // 添加调试输出
    console.log(`开始生成 ${data.algorithm} 的可视化步骤，数据：`, 
                JSON.stringify({
                  algorithm: data.algorithm,
                  arrayLength: data.array ? data.array.length : 0,
                  array: data.array
                }));
                
    const steps = algorithmIntegrator.generateSteps(data.algorithm, data);
    console.log(`${data.algorithm} 生成了 ${steps.length} 个步骤`);
    
    return steps;
  } catch (error) {
    console.error(`生成可视化步骤失败: ${error.message}`);
    throw error;
  }
}

// 发送算法步骤到客户端
function sendAlgorithmSteps(ws, data, steps) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  
  if (steps.length === 0) {
    ws.send(JSON.stringify({
      type: 'error',
      message: '未生成任何可视化步骤'
    }));
    return;
  }
  
  // 发送初始化信息
  ws.send(JSON.stringify({
    type: 'visualization_start',
    algorithm: data.algorithm,
    stepsCount: steps.length
  }));

  // 一次性发送所有步骤
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'visualization_all_steps',
      algorithm: data.algorithm,
      steps: steps,
      totalSteps: steps.length
    }));
    
    // 发送完成信号
    ws.send(JSON.stringify({
      type: 'visualization_steps_ready',
      algorithm: data.algorithm
    }));
  } else {
    ws._visualizationActive = false;
  }
}

function logError(logPath, message) {
  fs.appendFileSync(logPath, `[ERROR] ${new Date().toISOString()} - ${message}\n`);
}

function logSuccess(logPath, message) {
  fs.appendFileSync(logPath, `[SUCCESS] ${new Date().toISOString()} - ${message}\n`);
}

// 设置服务器端口
const PORT = 3001;

// 启动服务器
server.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

// 在应用初始化部分，添加以下代码
// 初始化算法集成器
const algorithmIntegrator = AlgorithmIntegrator.loadAll(__dirname);