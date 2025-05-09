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
      } else if (data.type === 'runCode') {
        // 处理代码运行请求
        console.log('收到代码运行请求:', data.language);
        
        if (data.language === 'c' || data.language === 'cpp') {
          // 处理C/C++代码
          try {
            const tempFileName = `temp_${Date.now()}`;
            const tempFilePath = path.join(tempDir, `${tempFileName}.${data.language}`);
            const outputFilePath = path.join(tempDir, `${tempFileName}.exe`);
            
            console.log(`创建临时文件: ${tempFilePath}`);
            // 保存代码到临时文件
            fs.writeFileSync(tempFilePath, data.code);
            
            // 创建编译命令
            const compileCommand = data.language === 'c' 
              ? `gcc "${tempFilePath}" -o "${outputFilePath}"` 
              : `g++ "${tempFilePath}" -o "${outputFilePath}"`;
            
            console.log(`执行编译命令: ${compileCommand}`);
            // 编译代码
            exec(compileCommand, (compileErr, compileStdout, compileStderr) => {
              if (compileErr) {
                // 编译错误
                console.error('编译错误:', compileStderr);
                const response = {
                  status: 'error',
                  message: '编译错误',
                  output: compileStderr
                };
                console.log('发送编译错误响应:', JSON.stringify(response).substring(0, 200));
                
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify(response));
                } else {
                  console.error('WebSocket连接已关闭，无法发送编译错误响应');
                }
                
                // 清理临时文件
                try {
                  if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
                } catch (e) {
                  console.error('删除临时文件失败', e);
                }
                return;
              }
              
              console.log('编译成功，运行程序:', outputFilePath);
              // 运行编译后的程序
              const execOptions = {
                encoding: 'utf8', // 确保输出使用UTF-8编码
                env: { ...process.env, LANG: 'zh_CN.UTF-8', LC_ALL: 'zh_CN.UTF-8' } // 设置中文环境变量
              };
              
              exec(`"${outputFilePath}"`, execOptions, (runErr, runStdout, runStderr) => {
                let response;
                // 发送运行结果
                if (runErr) {
                  console.error('运行错误:', runStderr);
                  response = {
                    status: 'error',
                    message: '运行错误',
                    output: runStderr
                  };
                } else {
                  console.log('运行成功，输出:', runStdout ? runStdout.substring(0, 100) + '...' : '无输出');
                  response = {
                    status: 'success',
                    output: runStdout || '程序运行成功，但没有输出'
                  };
                }
                
                console.log('发送运行结果响应:', JSON.stringify(response).substring(0, 200));
                // 确保WebSocket连接仍然打开
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify(response));
                } else {
                  console.error('WebSocket连接已关闭，无法发送运行结果响应');
                }
                
                // 清理临时文件
                try {
                  if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
                  if (fs.existsSync(outputFilePath)) fs.unlinkSync(outputFilePath);
                } catch (e) {
                  console.error('删除临时文件失败', e);
                }
              });
            });
          } catch (error) {
            console.error('处理C/C++代码时出错:', error);
            const response = {
              status: 'error',
              message: '处理C/C++代码时出错',
              output: error.message
            };
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify(response));
            } else {
              console.error('WebSocket连接已关闭，无法发送错误响应');
            }
          }
        } else if (data.language === 'python') {
          // 处理Python代码
          try {
            const tempFilePath = path.join(tempDir, `temp_${Date.now()}.py`);
            
            // 创建确保编码正确的Python代码文件
            const codePreamble = `
# -*- coding: utf-8 -*-
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
`;
            const fullCode = codePreamble + '\n' + data.code;
            fs.writeFileSync(tempFilePath, fullCode, 'utf8');
            
            // 使用-u选项确保输出不缓冲，并指定UTF-8编码
            exec(`python -u "${tempFilePath}"`, { encoding: 'utf8' }, (error, stdout, stderr) => {
              // 清理临时文件
              try {
                if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
              } catch (e) {
                console.error('删除临时文件失败', e);
              }
              
              if (error) {
                ws.send(JSON.stringify({
                  status: 'error',
                  output: stderr || error.message
                }));
              } else {
                ws.send(JSON.stringify({
                  status: 'success',
                  output: stdout
                }));
              }
            });
          } catch (error) {
            ws.send(JSON.stringify({
              status: 'error',
              message: '处理Python代码时出错',
              output: error.message
            }));
          }
        } else if (data.language === 'javascript' || data.language === 'js') {
          // 处理JavaScript代码
          try {
            const result = await compileAndRunCode(data.code);
            ws.send(JSON.stringify(result));
          } catch (error) {
            ws.send(JSON.stringify({
              status: 'error',
              message: '处理JavaScript代码时出错',
              output: error.message
            }));
          }
        } else if (data.language === 'java') {
          // 处理Java代码
          try {
            // 从代码中提取类名
            const classNameMatch = data.code.match(/public\s+class\s+(\w+)/);
            if (!classNameMatch) {
              ws.send(JSON.stringify({
                status: 'error',
                message: '无法确定Java主类名',
                output: '请确保代码中包含一个public class'
              }));
              return;
            }
            
            const className = classNameMatch[1];
            const tempFilePath = path.join(tempDir, `${className}.java`);
            
            fs.writeFileSync(tempFilePath, data.code);
            
            // 编译Java代码
            exec(`javac "${tempFilePath}"`, (compileErr, compileStdout, compileStderr) => {
              if (compileErr) {
                ws.send(JSON.stringify({
                  status: 'error',
                  message: 'Java编译错误',
                  output: compileStderr
                }));
                
                // 清理临时文件
                try {
                  if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
                } catch (e) {
                  console.error('删除临时文件失败', e);
                }
                return;
              }
              
              // 运行Java程序
              const javaOptions = {
                encoding: 'utf8',
                env: { ...process.env, JAVA_TOOL_OPTIONS: '-Dfile.encoding=UTF-8' }
              };
              
              exec(`java -cp "${tempDir}" ${className}`, javaOptions, (runErr, runStdout, runStderr) => {
                // 发送运行结果
                if (runErr) {
                  ws.send(JSON.stringify({
                    status: 'error',
                    message: 'Java运行错误',
                    output: runStderr
                  }));
                } else {
                  ws.send(JSON.stringify({
                    status: 'success',
                    output: runStdout
                  }));
                }
                
                // 清理临时文件
                try {
                  if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
                  if (fs.existsSync(path.join(tempDir, `${className}.class`))) 
                    fs.unlinkSync(path.join(tempDir, `${className}.class`));
                } catch (e) {
                  console.error('删除临时文件失败', e);
                }
              });
            });
          } catch (error) {
            ws.send(JSON.stringify({
              status: 'error',
              message: '处理Java代码时出错',
              output: error.message
            }));
          }
        } else {
          ws.send(JSON.stringify({
            status: 'error',
            message: `不支持的语言: ${data.language}`,
            output: '目前支持C, C++, Python, JavaScript和Java'
          }));
        }
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
      const nodeOptions = {
        encoding: 'utf8',
        env: { ...process.env, NODE_OPTIONS: '--no-warnings' }
      };
      
      exec(`node ${tempFile}`, nodeOptions, (error, stdout, stderr) => {
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

    
    //如果传入的 data.array 不是一个有效的数组，就给它赋一个默认数组
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