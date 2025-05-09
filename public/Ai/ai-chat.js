// AI聊天窗口的JavaScript功能
document.addEventListener('DOMContentLoaded', () => {
  // 初始化聊天组件
  initAiChat();
});

// 存储对话上下文的数组
let chatContext = [
  // 添加系统角色提示作为初始消息
  { role: 'system', content: '你是一个代码专家，熟悉各种编程语言和算法，可以提供代码分析、改进建议和问题解决方案。' },
  { role: 'assistant', content: '您好！我是您的AI助手，有什么可以帮您的？' }
];

// 定义最大保留消息数量
const MAX_MESSAGES = 10;

// 定义API调用是否可用
let isApiAvailable = false;
// 保存当前是否正在等待AI响应
let isWaitingForResponse = false;
// 是否使用流式输出
let useStreamOutput = true;
// 当前流式响应的消息元素
let currentStreamMessageElement = null;

// 检查API连接状态
async function checkApiAvailability() {
  try {
    // 使用API健康检查端点
    isApiAvailable = await window.aiApi.checkApiConnection();
    
    if (isApiAvailable) {
      console.log('AI API连接成功，使用后端服务');
    } else {
      console.log('AI API不可用，使用模拟响应');
    }
  } catch (error) {
    console.error('API连接检查失败:', error);
    isApiAvailable = false;
    console.log('使用模拟AI响应 (API检查失败)');
  }
}

async function initAiChat() {
  // 检查API可用性
  await checkApiAvailability();
  
  // 从本地存储加载保存的对话
  loadConversationFromLocalStorage();
  
  // 创建聊天按钮
  createChatButton();
  // 创建聊天窗口
  createChatWindow();
  // 绑定拖拽功能
  enableDragging();
}

// 创建聊天按钮
function createChatButton() {
  const button = document.createElement('div');
  button.className = 'ai-chat-button';
  button.innerHTML = '<span class="ai-chat-icon">🤖</span>';
  button.addEventListener('click', toggleChatWindow);
  document.body.appendChild(button);
}

// 添加设置菜单到聊天窗口头部
function addSettingsMenu(chatHeader) {
  const settingsButton = document.createElement('button');
  settingsButton.className = 'ai-chat-control ai-settings-button';
  settingsButton.innerHTML = '⚙️';
  settingsButton.title = '设置';
  
  const settingsMenu = document.createElement('div');
  settingsMenu.className = 'ai-settings-menu hidden';
  
  // 添加流式输出开关
  const streamToggle = document.createElement('div');
  streamToggle.className = 'ai-settings-item';
  
  const streamCheckbox = document.createElement('input');
  streamCheckbox.type = 'checkbox';
  streamCheckbox.id = 'stream-toggle';
  streamCheckbox.checked = useStreamOutput;
  streamCheckbox.addEventListener('change', (e) => {
    useStreamOutput = e.target.checked;
    console.log(`流式输出已${useStreamOutput ? '启用' : '禁用'}`);
  });
  
  const streamLabel = document.createElement('label');
  streamLabel.htmlFor = 'stream-toggle';
  streamLabel.textContent = '启用流式输出';
  
  streamToggle.appendChild(streamCheckbox);
  streamToggle.appendChild(streamLabel);
  settingsMenu.appendChild(streamToggle);
  
  // 添加清空对话按钮
  const clearButton = document.createElement('button');
  clearButton.className = 'ai-settings-button';
  clearButton.textContent = '清空对话';
  clearButton.addEventListener('click', () => {
    clearConversation();
    settingsMenu.classList.add('hidden');
  });
  settingsMenu.appendChild(clearButton);
  
  // 切换设置菜单显示
  settingsButton.addEventListener('click', (e) => {
    e.stopPropagation();
    settingsMenu.classList.toggle('hidden');
  });
  
  // 点击其他区域关闭菜单
  document.addEventListener('click', () => {
    settingsMenu.classList.add('hidden');
  });
  
  // 防止点击菜单时关闭
  settingsMenu.addEventListener('click', (e) => {
    e.stopPropagation();
  });
  
  chatHeader.querySelector('.ai-chat-controls').prepend(settingsButton);
  chatHeader.appendChild(settingsMenu);
}

// 创建聊天窗口
function createChatWindow() {
  const chatWindow = document.createElement('div');
  chatWindow.className = 'ai-chat-window hidden';
  chatWindow.id = 'ai-chat-window';
  
  // 添加窗口头部
  chatWindow.innerHTML = `
    <div class="ai-chat-header" id="ai-chat-header">
      <div class="ai-chat-title">AI 助手 ${isApiAvailable ? '(在线)' : '(离线模式)'}</div>
      <div class="ai-chat-controls">
        <button class="ai-chat-control" id="ai-chat-minimize">—</button>
        <button class="ai-chat-control" id="ai-chat-close">×</button>
      </div>
    </div>
    <div class="ai-chat-messages" id="ai-chat-messages">
      <div class="ai-message">您好！我是您的AI助手，有什么可以帮您的？</div>
    </div>
    <div class="ai-chat-input-area">
      <textarea class="ai-chat-input" id="ai-chat-input" placeholder="输入您的问题..." rows="1"></textarea>
      <button class="ai-chat-send" id="ai-chat-send">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 2L11 13" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  `;
  
  document.body.appendChild(chatWindow);
  
  // 添加设置菜单
  addSettingsMenu(document.getElementById('ai-chat-header'));
  
  // 调整初始位置，使窗口完全显示在可见区域内
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const chatWidth = 460; // 需要与CSS中的宽度值匹配
  const chatHeight = 580; // 需要与CSS中的高度值匹配
  
  // 检查默认位置是否会导致窗口显示不全
  if (windowWidth < chatWidth + 40 || windowHeight < chatHeight + 110) {
    // 如果屏幕太小，调整窗口位置和大小
    chatWindow.style.right = '10px';
    chatWindow.style.bottom = '80px';
    chatWindow.style.maxWidth = (windowWidth - 20) + 'px';
    chatWindow.style.maxHeight = (windowHeight - 100) + 'px';
  }
  
  // 绑定事件
  document.getElementById('ai-chat-close').addEventListener('click', closeChatWindow);
  document.getElementById('ai-chat-minimize').addEventListener('click', minimizeChatWindow);
  document.getElementById('ai-chat-send').addEventListener('click', sendMessage);
  
  const inputField = document.getElementById('ai-chat-input');
  inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
}

// 切换聊天窗口显示状态
function toggleChatWindow() {
  const chatWindow = document.getElementById('ai-chat-window');
  chatWindow.classList.toggle('hidden');
  
  // 如果显示了窗口，就聚焦到输入框
  if (!chatWindow.classList.contains('hidden')) {
    document.getElementById('ai-chat-input').focus();
    
    // 更新状态指示器
    updateStatusIndicator();
  }
}

// 更新状态指示器
function updateStatusIndicator() {
  const chatTitle = document.querySelector('.ai-chat-title');
  if (chatTitle) {
    if (isApiAvailable) {
      chatTitle.textContent = `AI 助手 (在线)`;
      chatTitle.classList.add('online');
      chatTitle.classList.remove('offline');
    } else {
      chatTitle.textContent = `AI 助手 (离线模式)`;
      chatTitle.classList.add('offline');
      chatTitle.classList.remove('online');
    }
  }
}

// 关闭聊天窗口
function closeChatWindow() {
  document.getElementById('ai-chat-window').classList.add('hidden');
}

// 最小化聊天窗口
function minimizeChatWindow() {
  closeChatWindow();
}

// 发送消息
function sendMessage() {
  // 如果正在等待响应，不处理新消息
  if (isWaitingForResponse) {
    return;
  }
  
  const inputField = document.getElementById('ai-chat-input');
  const message = inputField.value.trim();
  
  if (message) {
    // 标记为正在等待响应
    isWaitingForResponse = true;
    
    // 添加消息到上下文数组
    const userMessage = { role: 'user', content: message };
    chatContext.push(userMessage);
    
    // 限制上下文消息数量，保留系统提示和最近的消息
    if (chatContext.length > MAX_MESSAGES + 1) { // +1 是为了保留系统消息
      // 始终保留第一条系统消息
      const systemMessage = chatContext[0];
      // 保留最近的消息
      chatContext = [
        systemMessage,
        ...chatContext.slice(-(MAX_MESSAGES))
      ];
    }
    
    // 添加用户消息到UI
    displayUserMessage(message);
    
    // 清空输入框
    inputField.value = '';
    
    // 滚动到底部
    scrollToBottom();
    
    // 禁用发送按钮防止重复发送
    toggleSendButton(false);
    
    // 发送请求到后端
    sendMessageToBackend();
  }
}

// 启用/禁用发送按钮
function toggleSendButton(enabled) {
  const sendButton = document.getElementById('ai-chat-send');
  const inputField = document.getElementById('ai-chat-input');
  
  if (enabled) {
    sendButton.disabled = false;
    sendButton.style.opacity = '1';
    inputField.disabled = false;
  } else {
    sendButton.disabled = true;
    sendButton.style.opacity = '0.5';
    inputField.disabled = true;
  }
}

// 显示用户消息在UI上
function displayUserMessage(message) {
  const messagesContainer = document.getElementById('ai-chat-messages');
  const userMessageDiv = document.createElement('div');
  userMessageDiv.className = 'user-message';
  
  // 处理消息中的换行符和代码块
  // 用户消息也使用Markdown渲染，但限制部分功能
  const formattedMessage = renderMarkdownLite(message);
  userMessageDiv.innerHTML = formattedMessage;
  
  messagesContainer.appendChild(userMessageDiv);
  scrollToBottom();
}

// 用户消息的简化Markdown渲染
function renderMarkdownLite(text) {
  // 用户消息仅支持基础Markdown功能，如代码块、粗体、斜体和链接
  
  // 处理代码块
  let processedText = text.replace(/```(?:([\w-]+)\n)?([\s\S]+?)```/g, (match, language, code) => {
    return `<pre class="code-block" data-language="${language || ''}">${escapeHtml(code.trim())}</pre>`;
  });
  
  // 处理内联代码
  processedText = processedText.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // 处理简易表格 (以|分隔的行)
  processedText = processedText.replace(/^([^<>\n]+\|[^<>\n]+)$/gm, (match) => {
    // 跳过已经处理过的HTML标签行
    if (match.includes('<tr>') || match.includes('<td>')) return match;
    
    // 拆分行
    const parts = match.split('|').map(part => part.trim());
    
    // 创建表格行
    if (parts.length >= 2) {
      const cells = parts.map(part => `<td>${part}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }
    return match; // 如果没有足够的分隔符，保持原样
  });
  
  // 将简易表格行包装在table标签中
  processedText = processedText.replace(/(<tr>.*?<\/tr>)(?:\s*<tr>)/gs, '<table class="simple-table">$1<tr>');
  processedText = processedText.replace(/(<tr>.*?<\/tr>)(?!\s*<tr>)/gs, '$1</table>');
  
  // 处理粗体
  processedText = processedText.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // 处理斜体
  processedText = processedText.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  
  // 处理链接
  processedText = processedText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
  
  // 处理换行符
  processedText = processedText.replace(/\n/g, '<br>');
  
  return processedText;
}

// 显示AI消息
function displayAIMessage(message, isError = false) {
  const messagesContainer = document.getElementById('ai-chat-messages');
  
  // 创建新消息元素
  const messageElement = document.createElement('div');
  messageElement.className = isError ? 'ai-message error' : 'ai-message';

  // 添加消息内容
  messageElement.textContent = message;
  
  // 格式化消息 - 先处理代码块，再处理Markdown
  const formattedMessage = renderMarkdown(message);
  if (formattedMessage !== message) {
    messageElement.innerHTML = formattedMessage;
  }
  
  // 添加到消息容器
  messagesContainer.appendChild(messageElement);
  
  // 滚动到底部
  scrollToBottom();
  
  return messageElement;
}

// 渲染Markdown格式内容
function renderMarkdown(text) {
  // 存储已处理的代码块，以防止Markdown在代码块内部被处理
  const codeBlocks = [];
  let processedText = text;
  
  // 步骤1: 提取并保存代码块
  processedText = processedText.replace(/```(?:([\w-]+)\n)?([\s\S]+?)```/g, (match, language, code) => {
    const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push({
      language: language || '',
      code: code.trim(),
      placeholder: placeholder
    });
    return placeholder;
  });
  
  // 步骤2: 处理Markdown语法
  
  // 处理标题 (h1-h6)
  processedText = processedText.replace(/^(#{1,6})\s+(.+)$/gm, (match, hashes, content) => {
    const level = hashes.length;
    return `<h${level}>${content}</h${level}>`;
  });
  
  // 处理标准Markdown表格
  processedText = processedText.replace(/^\|(.+)\|$/gm, (match, content) => {
    // 检测是否是表格分隔行（包含 -）
    if (/^\s*[\-:]+\s*(?:\|\s*[\-:]+\s*)+$/.test(content)) {
      return `<tr class="md-table-separator">${content.split('|').map(cell => `<td>${cell.trim()}</td>`).join('')}</tr>`;
    }
    return `<tr>${content.split('|').map(cell => `<td>${cell.trim()}</td>`).join('')}</tr>`;
  });
  
  // 将表格行包装在table标签中
  processedText = processedText.replace(/(<tr>.*?<\/tr>)(?:\s*<tr>)/gs, '<table class="md-table">$1<tr>');
  processedText = processedText.replace(/(<tr>.*?<\/tr>)(?!\s*<tr>)/gs, '$1</table>');
  
  // 处理简易表格格式 (只使用|分隔的行，不一定有标准表头)
  processedText = processedText.replace(/^([^<>\n]+\|[^<>\n]+)$/gm, (match) => {
    // 跳过已经处理过的HTML标签行
    if (match.includes('<tr>') || match.includes('<td>')) return match;
    
    // 拆分行
    const parts = match.split('|').map(part => part.trim());
    
    // 创建表格行
    if (parts.length >= 2) {
      const cells = parts.map(part => `<td>${part}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }
    return match; // 如果没有足够的分隔符，保持原样
  });
  
  // 将简易表格行包装在table标签中
  processedText = processedText.replace(/(<tr>(?!.*?<table>).*?<\/tr>)(?:\s*<tr>(?!.*?<table>))/gs, '<table class="simple-table">$1<tr>');
  processedText = processedText.replace(/(<tr>(?!.*?<table>).*?<\/tr>)(?!\s*<tr>(?!.*?<table>))/gs, '$1</table>');
  
  // 处理粗体
  processedText = processedText.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // 处理斜体
  processedText = processedText.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  
  // 处理删除线
  processedText = processedText.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  
  // 处理无序列表
  processedText = processedText.replace(/^[-*+]\s+(.+)$/gm, '<li>$1</li>');
  processedText = processedText.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  
  // 处理有序列表
  processedText = processedText.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
  processedText = processedText.replace(/(<li>.*<\/li>)/s, (match) => {
    if (!match.startsWith('<ul>')) {
      return '<ol>' + match + '</ol>';
    }
    return match;
  });
  
  // 处理引用
  processedText = processedText.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');
  
  // 处理链接
  processedText = processedText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
  
  // 处理段落和换行
  processedText = processedText.replace(/\n\n/g, '</p><p>');
  processedText = '<p>' + processedText + '</p>';
  processedText = processedText.replace(/<p><\/p>/g, '');
  
  // 步骤3: 恢复代码块
  codeBlocks.forEach(block => {
    const codeHtml = `<pre class="code-block" data-language="${block.language}">${escapeHtml(block.code)}</pre>`;
    processedText = processedText.replace(block.placeholder, codeHtml);
  });
  
  // 修复因为表格处理可能导致的段落嵌套问题
  processedText = processedText.replace(/<p>(<table.*?<\/table>)<\/p>/gs, '$1');
  
  return processedText;
}

// HTML转义
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 滚动到底部
function scrollToBottom() {
  const messagesContainer = document.getElementById('ai-chat-messages');
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 发送消息到后端
async function sendMessageToBackend() {
  try {
    // 如果API不可用，使用模拟响应
    if (!isApiAvailable) {
      console.warn('API不可用，使用模拟响应');
      const message = chatContext[chatContext.length - 1].content;
      const response = simulateAiResponse(message);
      
      // 添加AI回复到上下文
      chatContext.push({ role: 'assistant', content: response });
      
      // 显示响应
      displayAIMessage(response);
      
      // 储存对话
      saveConversationToLocalStorage();
      
      return;
    }
    
    // 如果是流式输出模式
    if (useStreamOutput) {
      // 准备接收流式响应
      currentStreamMessageElement = displayAIMessage('');
      currentStreamMessageElement.classList.add('streaming');
      
      let accumulatedText = '';
      
      // 处理流式数据块的回调函数
      const handleStreamChunk = (chunk, fullText) => {
        // 更新当前消息元素的内容
        if (currentStreamMessageElement) {
          // 保存完整文本用于更新
          accumulatedText = fullText;
          
          // 使用Markdown渲染器处理整个文本
          const renderedContent = renderMarkdown(accumulatedText);
          currentStreamMessageElement.innerHTML = renderedContent;
          
          // 滚动到底部
          scrollToBottom();
        }
      };
      
      // 发送带流式处理的请求
      const result = await window.aiApi.sendChatRequest(
        chatContext,
        true, // 启用流式输出
        handleStreamChunk
      );
      
      // 流式处理完成后，保存最终内容到上下文
      if (currentStreamMessageElement) {
        currentStreamMessageElement.classList.remove('streaming');
        const finalContent = accumulatedText;
        chatContext.push({ role: 'assistant', content: finalContent });
        
        // 储存对话
        saveConversationToLocalStorage();
      }
      
      // 重置当前流式消息元素
      currentStreamMessageElement = null;
      
    } else {
      // 使用非流式处理方式（原有逻辑）
      
      // 发送请求
      const response = await window.aiApi.sendChatRequest(chatContext);
      
      // 添加AI回复到上下文
      chatContext.push({ role: 'assistant', content: response });
      
      // 显示响应
      displayAIMessage(response);
      
      // 储存对话
      saveConversationToLocalStorage();
    }
  } catch (error) {
    // 处理错误
    console.error('发送消息失败:', error);
    
    // 显示错误消息
    displayAIMessage(`很抱歉，发生了错误: ${error.message}`, true);
  } finally {
    // 标记为不再等待响应
    isWaitingForResponse = false;
    
    // 启用输入框
    toggleSendButton(true);
  }
}

// 保存对话到本地存储
function saveConversationToLocalStorage() {
  try {
    localStorage.setItem('aiChatContext', JSON.stringify(chatContext));
  } catch (error) {
    console.error('保存对话到本地存储失败:', error);
  }
}

// 从本地存储加载对话
function loadConversationFromLocalStorage() {
  try {
    const savedContext = localStorage.getItem('aiChatContext');
    if (savedContext) {
      const parsedContext = JSON.parse(savedContext);
      
      // 验证是否包含必要的系统消息
      if (parsedContext && Array.isArray(parsedContext)) {
        // 确保始终有系统角色提示
        const hasSystemPrompt = parsedContext.some(msg => msg.role === 'system');
        
        if (hasSystemPrompt) {
          chatContext = parsedContext;
        } else {
          // 如果没有系统提示，添加一个并保留其他消息
          chatContext = [
            { role: 'system', content: '你是一个代码专家，熟悉各种编程语言和算法，可以提供代码分析、改进建议和问题解决方案。' },
            ...parsedContext
          ];
        }
        
        // 重新应用消息限制
        if (chatContext.length > MAX_MESSAGES + 1) {
          const systemMessage = chatContext[0];
          chatContext = [
            systemMessage,
            ...chatContext.filter(msg => msg.role !== 'system').slice(-(MAX_MESSAGES))
          ];
        }
        
        // 更新UI以显示加载的对话
        const messagesContainer = document.getElementById('ai-chat-messages');
        if (messagesContainer) {
          messagesContainer.innerHTML = '';
          
          // 跳过系统消息，只显示用户和助手消息
          chatContext.forEach(message => {
            if (message.role === 'user') {
              displayUserMessage(message.content);
            } else if (message.role === 'assistant') {
              displayAIMessage(message.content);
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('从本地存储加载对话失败:', error);
    // 如果加载失败，使用默认对话
    chatContext = [
      { role: 'system', content: '你是一个代码专家，熟悉各种编程语言和算法，可以提供代码分析、改进建议和问题解决方案。' },
      { role: 'assistant', content: '您好！我是您的AI助手，有什么可以帮您的？' }
    ];
  }
}

// 清除对话历史
function clearConversation() {
  // 保留系统提示，重置对话
  chatContext = [
    { role: 'system', content: '你是一个代码专家，熟悉各种编程语言和算法，可以提供代码分析、改进建议和问题解决方案。' },
    { role: 'assistant', content: '对话已清除。有什么可以帮您的？' }
  ];
  
  // 更新UI
  const messagesContainer = document.getElementById('ai-chat-messages');
  if (messagesContainer) {
    messagesContainer.innerHTML = '';
    displayAIMessage('对话已清除。有什么可以帮您的？');
  }
  
  // 保存到本地存储
  saveConversationToLocalStorage();
}

// 模拟AI响应 (在实际项目中会被后端API替代)
function simulateAiResponse(message) {
  if (message.toLowerCase().includes('你好') || message.toLowerCase().includes('hello')) {
    return '您好！有什么可以帮您的？';
  } else if (message.toLowerCase().includes('什么') && message.toLowerCase().includes('功能')) {
    return '我可以回答您关于算法可视化代码编辑器的问题，帮助您使用各种功能，并为您提供编程支持。';
  } else if (message.toLowerCase().includes('算法') && message.toLowerCase().includes('推荐')) {
    return '对于排序算法，我推荐您尝试快速排序和归并排序；对于搜索算法，二分查找是一个很好的选择；对于图算法，您可以尝试深度优先搜索(DFS)和广度优先搜索(BFS)。';
  } else if (message.toLowerCase().includes('如何') && message.toLowerCase().includes('运行')) {
    return '要运行您的代码，请点击编辑器顶部工具栏中的"运行代码"按钮（▶）。您的代码将被执行，输出结果将显示在下方的终端或输出面板中。如果您想要可视化算法执行过程，请在右侧算法列表中选择相应的算法，然后点击"开始可视化"。';
  } else if (message.toLowerCase().includes('支持') && message.toLowerCase().includes('语言')) {
    return '本编辑器当前支持以下编程语言：\n- C\n- C++\n- JavaScript\n- Python\n- Java\n您可以在编辑器顶部的语言选择器中切换不同的编程语言。';
  } else if (message.toLowerCase().includes('api') || message.toLowerCase().includes('后端')) {
    return '目前AI功能是通过DeepSeek API实现的。请注意，我目前处于' + (isApiAvailable ? '在线模式，通过后端API获取响应' : '离线模式，使用本地模拟响应') + '。';
  } else if (message.toLowerCase().includes('代码') && (message.toLowerCase().includes('示例') || message.toLowerCase().includes('例子'))) {
    return '这是一个快速排序的JavaScript示例：\n\n```\nfunction quickSort(arr) {\n  if (arr.length <= 1) return arr;\n  \n  const pivot = arr[Math.floor(arr.length / 2)];\n  const left = arr.filter(x => x < pivot);\n  const middle = arr.filter(x => x === pivot);\n  const right = arr.filter(x => x > pivot);\n  \n  return [...quickSort(left), ...middle, ...quickSort(right)];\n}\n```';
  } else {
    return '我理解您的问题是关于 "' + message + '"。目前我' + (isApiAvailable ? '正在通过DeepSeek API响应您的问题。' : '处于离线模式，使用预设的回复规则。如需完整功能，请确保后端API已正确配置。');
  }
}

// 启用拖拽功能
function enableDragging() {
  const chatWindow = document.getElementById('ai-chat-window');
  const header = document.getElementById('ai-chat-header');
  let isDragging = false;
  let offsetX, offsetY;

  header.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - chatWindow.getBoundingClientRect().left;
    offsetY = e.clientY - chatWindow.getBoundingClientRect().top;
    chatWindow.style.transition = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const x = e.clientX - offsetX;
      const y = e.clientY - offsetY;
      
      // 确保窗口不会被拖出视口
      const maxX = window.innerWidth - chatWindow.offsetWidth - 5; // 留出5px边距
      const maxY = window.innerHeight - chatWindow.offsetHeight - 5; // 留出5px边距
      
      chatWindow.style.left = Math.max(5, Math.min(x, maxX)) + 'px'; // 至少留5px的边距
      chatWindow.style.right = 'auto';
      chatWindow.style.top = Math.max(5, Math.min(y, maxY)) + 'px'; // 至少留5px的边距
      chatWindow.style.bottom = 'auto';
    }
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      chatWindow.style.transition = 'all 0.3s ease';
    }
  });
} 
