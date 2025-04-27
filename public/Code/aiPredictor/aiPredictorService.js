/**
 * AI预测服务 - 提供在线AI预测API服务
 * 
 * 注意: 此文件目前已被弃用，服务器端已不再引用此模块。
 * 保留此文件是为了将来可能的恢复使用。
 * 
 * 弃用原因：
 * 1. 当前版本使用本地代码补全替代在线API调用
 * 2. 减少对外部API的依赖
 * 3. 提高编辑器响应速度
 * 
 * 最后更新时间: 2023-03-26
 */

//====================== 以下代码暂时弃用 ======================

// 注意这是后端文件 提供在线AI预测API服务

const express = require('express');
const router = express.Router();
const axios = require('axios');

// DeepSeek API 配置
const DEEPSEEK_API_URL = 'https://api.deepseek.com/beta';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// 是否启用模拟响应（API调用失败时使用）
const USE_MOCK_RESPONSE = true;

// 验证API配置
if (!DEEPSEEK_API_KEY) {
    console.error('错误: 未配置 DEEPSEEK_API_KEY 环境变量');
}

console.log('AI预测服务初始化...');
console.log('API密钥状态:', DEEPSEEK_API_KEY ? '已配置' : '未配置');
console.log('模拟响应:', USE_MOCK_RESPONSE ? '已启用' : '已禁用');

// 提取代码上下文的函数
function extractContext(prefix, suffix, cursor, maxContextLength = 1000) {
    // 限制上下文长度，避免请求过大
    if (prefix && prefix.length > maxContextLength) {
        prefix = prefix.slice(-maxContextLength);
    }
    if (suffix && suffix.length > maxContextLength) {
        suffix = suffix.slice(0, maxContextLength);
    }
    
    // 分析当前行的缩进
    const currentLineMatch = prefix.match(/[^\n]*$/);
    const currentLine = currentLineMatch ? currentLineMatch[0] : '';
    const indentation = currentLine.match(/^\s*/)[0];
    
    return {
        prefix,
        suffix,
        indentation,
        cursor
    };
}

// 添加请求限流
const requestLimiter = {
    requests: new Map(),
    maxRequests: 10, // 每个时间窗口的最大请求数
    timeWindow: 1000, // 时间窗口大小(毫秒)
    
    // 检查是否允许请求
    isAllowed(clientId) {
        const now = Date.now();
        const clientRequests = this.requests.get(clientId) || [];
        
        // 清理过期的请求记录
        const validRequests = clientRequests.filter(time => now - time < this.timeWindow);
        
        if (validRequests.length >= this.maxRequests) {
            return false;
        }
        
        // 更新请求记录
        validRequests.push(now);
        this.requests.set(clientId, validRequests);
        return true;
    }
};

// AI预测服务状态检查
router.get('/status', (req, res) => {
    console.log('收到状态检查请求');
    res.json({ status: 'ok', message: 'AI预测服务正常运行' });
});

// 模拟响应生成器
function generateMockResponse(prefix) {
    // 基于前缀内容生成简单的代码补全
    const lastLine = prefix.split('\n').pop() || '';
    const trimmedLastLine = lastLine.trim();
    
    console.log('生成模拟响应，最后一行:', trimmedLastLine);
    
    // 提取缩进
    const indentation = lastLine.match(/^\s*/)[0];
    
    // 清理前缀，删除注释和重复代码
    const cleanPrefix = prefix.replace(/\/\/[^\n]*/g, '');
    
    // 分析上下文
    const fullPrefix = cleanPrefix.trim();
    const lines = fullPrefix.split('\n');
    
    // 分析函数定义和参数
    let functionParams = [];
    let insideFunction = false;
    let functionName = '';
    
    // 查找当前函数定义
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        const functionDefMatch = line.match(/(\w+)\s+(\w+)\s*\(([^)]*)\)/);
        
        if (functionDefMatch) {
            functionName = functionDefMatch[2];
            const paramsStr = functionDefMatch[3];
            if (paramsStr) {
                functionParams = paramsStr.split(',').map(param => {
                    const parts = param.trim().split(/\s+/);
                    return parts[parts.length - 1]; // 获取参数名
                }).filter(p => p && p !== 'int'); // 过滤掉空参数和类型名
            }
            insideFunction = true;
            break;
        }
        
        // 如果遇到函数结束，则停止向上查找
        if (line.includes('}') && !line.includes('{')) {
            break;
        }
    }
    
    console.log('上下文分析:', {
        insideFunction,
        functionName,
        functionParams
    });
    
    // 检查是否已经包含了完整的return语句
    const hasReturn = cleanPrefix.includes('return ') && cleanPrefix.includes(';');
    
    // 检测常见模式并提供合适的建议
    let suggestion = '';
    
    // 如果已经有完整return语句，不生成新的
    if (hasReturn && trimmedLastLine.includes('return')) {
        console.log('已经存在return语句，不生成重复建议');
        suggestion = '';
    }
    // 特殊处理 return 语句
    else if (/re(?:t)?(?:u)?(?:r)?(?:n)?/.test(trimmedLastLine)) {
        if (insideFunction && functionParams.length > 0) {
            if (functionName.includes('calc') || functionName.includes('sum') || 
                functionName.includes('add') || functionName.includes('compute')) {
                // 计算相关函数，可能需要返回参数的和或计算结果
                if (functionParams.length === 2) {
                    suggestion = `return ${functionParams[0]} + ${functionParams[1]};`;
                } else if (functionParams.length === 1) {
                    suggestion = `return ${functionParams[0]};`;
                } else {
                    suggestion = `return result;`;
                }
            } else if (functionName.includes('get') || functionName.includes('find')) {
                // 获取类函数，通常返回参数或结果
                suggestion = `return ${functionParams[0]};`;
            } else if (functionName.includes('is') || functionName.includes('has') || functionName.includes('check')) {
                // 布尔类函数
                suggestion = `return true;`;
            } else {
                // 其他函数根据参数生成返回语句
                if (functionParams.length > 0) {
                    suggestion = `return ${functionParams[0]};`;
                } else {
                    suggestion = `return 0;`;
                }
            }
        } else {
            suggestion = `return 0;`;
        }
    }
    // printf/print相关
    else if (/pr(?:i)?(?:n)?(?:t)?(?:f)?/.test(trimmedLastLine)) {
        // 如果有参数，则使用第一个参数
        if (insideFunction && functionParams.length > 0) {
            suggestion = `printf("%d\\n", ${functionParams[0]});`;
        } else {
            suggestion = `printf("%d\\n", value);`;
        }
    } 
    // int声明
    else if (/int\s+\w+\s*$/.test(trimmedLastLine)) {
        suggestion = `= 0;`;
    }
    // for循环
    else if (/fo(?:r)?/.test(trimmedLastLine)) {
        suggestion = `for (int i = 0; i < n; i++) {\n${indentation}    \n${indentation}}`;
    }
    // if条件
    else if (/if/.test(trimmedLastLine)) {
        if (functionParams.length > 0) {
            suggestion = `if (${functionParams[0]} > 0) {\n${indentation}    \n${indentation}}`;
        } else {
            suggestion = `if (condition) {\n${indentation}    \n${indentation}}`;
        }
    }
    // while循环
    else if (/wh(?:i)?(?:l)?(?:e)?/.test(trimmedLastLine)) {
        suggestion = `while (condition) {\n${indentation}    \n${indentation}}`;
    }
    // scanf
    else if (/sc(?:a)?(?:n)?(?:f)?/.test(trimmedLastLine)) {
        if (functionParams.length > 0) {
            suggestion = `scanf("%d", &${functionParams[0]});`;
        } else {
            suggestion = `scanf("%d", &value);`;
        }
    }
    // main函数
    else if (/ma(?:i)?(?:n)?/.test(trimmedLastLine)) {
        suggestion = `main() {\n${indentation}    \n${indentation}    return 0;\n${indentation}}`;
    }
    // struct定义
    else if (/st(?:r)?(?:u)?(?:c)?(?:t)?/.test(trimmedLastLine)) {
        suggestion = `struct Node {\n${indentation}    int data;\n${indentation}    struct Node* next;\n${indentation}};`;
    }
    // include
    else if (/#in(?:c)?(?:l)?(?:u)?(?:d)?(?:e)?/.test(trimmedLastLine)) {
        suggestion = `#include <stdio.h>`;
    }
    // define
    else if (/#de(?:f)?(?:i)?(?:n)?(?:e)?/.test(trimmedLastLine)) {
        suggestion = `#define MAX 100`;
    }
    // void函数
    else if (/vo(?:i)?(?:d)?/.test(trimmedLastLine)) {
        suggestion = `void function(int param) {\n${indentation}    \n${indentation}}`;
    }
    // 变量赋值
    else if (/=\s*$/.test(trimmedLastLine)) {
        suggestion = ` 0;`;
    }
    // 函数调用
    else if (/\w+\(\s*$/.test(trimmedLastLine)) {
        suggestion = `);`;
    }
    // 数组
    else if (/\w+\[\s*$/.test(trimmedLastLine)) {
        suggestion = `i] = 0;`;
    }
    // 检查文件上下文整体内容特征
    else {
        // 检查是否在函数体内
        if (insideFunction) {
            if (functionName.includes('calc') || functionName.includes('sum') || 
                functionName.includes('add') || functionName.includes('compute')) {
                // 计算相关函数
                if (functionParams.length === 2) {
                    suggestion = `return ${functionParams[0]} + ${functionParams[1]};`;
                } else {
                    suggestion = `return result;`;
                }
            } else {
                suggestion = `printf("Function: %s\\n", "${functionName}");`;
            }
        } else if (prefix.includes('main(') || prefix.includes('main (')) {
            suggestion = `printf("Hello, World!\\n");`;
        } else {
            // 默认建议
            suggestion = `// 补全建议`;
        }
    }
    
    console.log('生成的模拟建议:', suggestion);
    
    if (!suggestion) {
        // 如果没有有效建议，返回空结果
        return {
            status: 'success',
            suggestions: []
        };
    }
    
    return {
        status: 'success',
        suggestions: [{
            label: suggestion,
            insertText: suggestion,
            detail: 'AI 补全建议 (模拟)',
            kind: 'snippet'
        }]
    };
}

// 处理代码补全请求
router.post('/predict', async (req, res) => {
    const clientId = req.ip;
    
    // 验证API密钥
    if (!DEEPSEEK_API_KEY) {
        console.error('无效的API密钥，尝试使用模拟响应');
        if (USE_MOCK_RESPONSE) {
            return res.json(generateMockResponse(req.body.prefix || ''));
        }
        
        return res.status(500).json({
            status: 'error',
            message: '服务未正确配置，请检查API密钥'
        });
    }
    
    // 检查请求频率
    if (!requestLimiter.isAllowed(clientId)) {
        console.warn('请求频率限制:' + clientId);
        if (USE_MOCK_RESPONSE) {
            return res.json(generateMockResponse(req.body.prefix || ''));
        }
        
        return res.status(429).json({
            status: 'error',
            message: '请求过于频繁，请稍后再试'
        });
    }
    
    try {
        const { prefix, suffix, cursor } = req.body;
        
        // 详细日志
        console.log('补全请求:', {
            ip: clientId,
            timestamp: new Date().toISOString(),
            prefixLength: prefix?.length || 0,
            suffixLength: suffix?.length || 0,
            cursor: cursor
        });
        
        // 参数验证
        if (!prefix) {
            return res.status(400).json({
                status: 'error',
                message: '缺少prefix参数'
            });
        }
        
        if (!cursor || typeof cursor.line !== 'number' || typeof cursor.column !== 'number') {
            return res.status(400).json({
                status: 'error',
                message: '无效的cursor参数'
            });
        }

        try {
            // 准备请求体
            const requestBody = {
                model: "deepseek-coder",
                prompt: prefix,
                suffix: suffix || "",
                max_tokens: 128,
                temperature: 0.3,
                n: 1,
                stop: ["\n\n", "```"]
            };

            // 调用 DeepSeek API
            const response = await axios.post(`${DEEPSEEK_API_URL}/v1/completions`, requestBody, {
                headers: {
                    'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 5000 // 5秒超时
            });

            // 验证API响应
            if (!response.data) {
                throw new Error('API返回空响应');
            }

            // 处理建议
            const suggestion = response.data.choices[0];
            let code = suggestion.text.trim();
            
            // 处理代码格式
            code = code.replace(/^```[^\n]*\n?|\n?```$/g, '');
            code = code.replace(/^.*?\{|\}.*?$/g, '').trim();
            
            // 验证生成的代码
            if (!code) {
                throw new Error('生成的代码为空');
            }

            // 返回处理后的建议
            return res.json({
                status: 'success',
                suggestions: [{
                    label: code,
                    insertText: code,
                    detail: 'AI 补全建议',
                    kind: 'snippet'
                }]
            });
        } catch (apiError) {
            console.error('API调用失败:', apiError.message);
            
            // 如果启用了模拟响应，在API调用失败时返回模拟数据
            if (USE_MOCK_RESPONSE) {
                console.log('使用模拟响应');
                return res.json(generateMockResponse(prefix));
            }
            
            throw apiError; // 抛出异常，让外层处理
        }
    } catch (error) {
        console.error('处理请求失败:', {
            message: error.message,
            stack: error.stack,
            response: error.response?.data,
            status: error.response?.status
        });
        
        // 根据错误类型返回不同的状态码和消息
        if (error.code === 'ECONNABORTED') {
            res.status(504).json({
                status: 'error',
                message: 'API请求超时'
            });
        } else if (error.response?.status === 401) {
            res.status(500).json({
                status: 'error',
                message: 'API密钥无效'
            });
        } else if (error.response?.status === 429) {
            res.status(429).json({
                status: 'error',
                message: 'API请求频率超限'
            });
        } else {
            res.status(500).json({
                status: 'error',
                message: '服务暂时不可用',
                details: error.message
            });
        }
    }
});

module.exports = router; 