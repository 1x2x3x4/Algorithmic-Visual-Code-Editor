/**
 * 速率限制中间件
 * 防止API请求过于频繁，保护API密钥不被滥用
 */

// 简单的内存存储请求记录
const requestStore = {};

// 清理过期的请求记录
setInterval(() => {
  const now = Date.now();
  for (const ip in requestStore) {
    requestStore[ip] = requestStore[ip].filter(time => now - time < 60000); // 保留一分钟内的请求
    if (requestStore[ip].length === 0) {
      delete requestStore[ip]; // 如果没有请求记录，删除IP条目
    }
  }
}, 60000); // 每分钟清理一次

/**
 * 速率限制中间件
 * @param {Object} options 配置选项
 * @param {number} options.windowMs 时间窗口（毫秒）
 * @param {number} options.maxRequests 在时间窗口内允许的最大请求数
 * @returns {Function} Express中间件函数
 */
function rateLimiter(options = { windowMs: 60000, maxRequests: 10 }) {
  const { windowMs, maxRequests } = options;
  
  return (req, res, next) => {
    // 获取客户端IP
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    
    // 初始化请求记录
    if (!requestStore[ip]) {
      requestStore[ip] = [];
    }
    
    // 清理过期的请求记录
    const now = Date.now();
    requestStore[ip] = requestStore[ip].filter(time => now - time < windowMs);
    
    // 检查是否超过速率限制
    if (requestStore[ip].length >= maxRequests) {
      console.warn(`速率限制: IP ${ip} 超过每 ${windowMs/1000} 秒 ${maxRequests} 次的限制`);
      return res.status(429).json({
        status: 'error',
        message: '请求过于频繁，请稍后再试',
        retryAfter: Math.ceil((requestStore[ip][0] + windowMs - now) / 1000) // 多少秒后可以重试
      });
    }
    
    // 记录当前请求时间
    requestStore[ip].push(now);
    
    // 继续处理请求
    next();
  };
}

module.exports = rateLimiter; 