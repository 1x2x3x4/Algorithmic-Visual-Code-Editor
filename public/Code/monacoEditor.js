/**
 * Monaco编辑器管理器
 * 
 * 此模块负责初始化、配置和管理Monaco编辑器实例，
 * 处理主题和语言等设置的变更，并提供编辑器API。
 * 
 * 依赖于Monaco编辑器库。
 */

// 确保只有一个全局编辑器实例
if (typeof window.editorManager === 'undefined') {
    window.editorManager = null;
}

class MonacoEditorManager {
    constructor(containerId = 'monaco-editor-container', options = {}) {
        this.containerId = containerId;
        this.containerElement = document.getElementById(containerId);
        this.editor = null;
        this.editorState = {
            ready: false,
            language: options.language || 'c',
            theme: options.theme || 'vs',
            value: options.value || '',
            options: {
                ...options,
                automaticLayout: true // 自动调整布局
            }
        };
        
        // Vue应用实例引用
        this.vueApp = null;
        
        // 添加内联建议相关的状态
        this._currentInlineSuggestionDecorations = [];
        this._currentSuggestion = null;
        this._tabCommandAdded = false;
        this._tabKeyListener = null; // 新增: 存储Tab键监听器
        
        // 添加节流控制
        this._throttleTimeout = null;
        this._lastRequestTime = 0;
        this._MIN_REQUEST_INTERVAL = 500; // 最小请求间隔(毫秒)
        this._MAX_RETRIES = 3; // 最大重试次数
        this._retryDelay = 1000; // 重试延迟(毫秒)
        
        // 新增：添加数组变化节流控制
        this._arrayChangeThrottleTimeout = null;
        
        // 初始化模块
        this._init();
    }
    
    // 私有方法：初始化编辑器
    _init() {
        // 确保Monaco被加载
        this._ensureMonacoIsLoaded(() => {
            this._createEditor();
            this._setupEventListeners();
            this._registerCompletionProvider();
            
            // 设置编辑器就绪标志
            this.editorState.ready = true;
            
            // 触发就绪事件
            this._dispatchReadyEvent();
        });
    }
    
    // 私有方法：确保Monaco已加载
    _ensureMonacoIsLoaded(callback) {
        // 检查Monaco是否已加载
        if (typeof monaco !== 'undefined') {
            callback();
            return;
        }
        
        // 如果未加载，设置一个监听器等待加载完成
        window.addEventListener('monaco-ready', () => {
            if (typeof monaco !== 'undefined') {
                callback();
            } else {
                console.error('Monaco编辑器加载失败');
            }
        });
        
        // 确保Monaco加载脚本已被引入
        if (!document.getElementById('monaco-loader')) {
            console.warn('未检测到Monaco加载器脚本');
        }
    }
    
    // 私有方法：创建编辑器实例
    _createEditor() {
        if (!this.containerElement) {
            console.error(`找不到编辑器容器: #${this.containerId}`);
            return;
        }
        
        // 确保容器为空
        this.containerElement.innerHTML = '';
        
        // 创建Monaco编辑器实例
        this.editor = monaco.editor.create(this.containerElement, {
            value: this.editorState.value,
            language: this.editorState.language,
            theme: this.editorState.theme,
            automaticLayout: true,
            minimap: {
                enabled: true
            },
            scrollBeyondLastLine: false,
            // 添加VSCode风格的样式
            fontFamily: 'Consolas, "Courier New", monospace',
            fontSize: 14,
            lineHeight: 20,
            // 启用其他功能
            folding: true,
            lineNumbersMinChars: 3,
            ...this.editorState.options
        });
        
        // 保存编辑器状态
        this.editorState.value = this.editor.getValue();
        
        // 添加Tab键监听
        this._setupTabKeyHandler();
    }
    
    // 添加Tab键处理程序
    _setupTabKeyHandler() {
        // 如果已经添加过，则移除旧的
        if (this._tabKeyListener) {
            window.removeEventListener('keydown', this._tabKeyListener, true);
            this._tabKeyListener = null;
        }
        
        // 创建新的Tab键监听器
        this._tabKeyListener = (event) => {
            // 只拦截Tab键
            if (event.key === 'Tab') {
                // 检查是否有活跃的建议
                if (this._currentSuggestion && this._currentInlineSuggestionDecorations && this._currentInlineSuggestionDecorations.length > 0) {
                    // 阻止默认行为
                    event.preventDefault();
                    event.stopPropagation();
                    
                    // 获取光标位置
                    const currentPosition = this.editor.getPosition();
                    
                    // 获取当前行内容和当前单词
                    const model = this.editor.getModel();
                    const lineContent = model.getLineContent(currentPosition.lineNumber);
                    
                    // 获取插入文本，确保没有多余空格
                    let insertText = this._currentSuggestion.insertText.trim();
                    
                    // 检查是否已经有相同的文本
                    const lineAfterCursor = lineContent.substring(currentPosition.column - 1);
                    if (lineAfterCursor.includes(insertText)) {
                        // 如果建议已经存在，只移除内联建议，不插入文本
                        this._removeInlineSuggestions();
                        return;
                    }
                    
                    // 检查当前行是否已经包含部分关键字，需要做部分替换
                    const linePrefix = lineContent.substring(0, currentPosition.column - 1);
                    const lastWordMatch = linePrefix.match(/\b(\w+)$/);
                    
                    let replaceRange;
                    if (lastWordMatch) {
                        const lastWord = lastWordMatch[1];
                        
                        // 检查是否是return语句的部分
                        if (insertText.startsWith('return') && lastWord === 'return') {
                            // 直接替换整行以避免重复
                            replaceRange = {
                                startLineNumber: currentPosition.lineNumber,
                                startColumn: lineContent.indexOf(lastWord) + 1,
                                endLineNumber: currentPosition.lineNumber,
                                endColumn: lineContent.length + 1
                            };
                        } else {
                            // 普通替换模式
                            const startColumn = currentPosition.column - lastWord.length;
                            replaceRange = {
                                startLineNumber: currentPosition.lineNumber,
                                startColumn: startColumn,
                                endLineNumber: currentPosition.lineNumber,
                                endColumn: currentPosition.column
                            };
                        }
                    } else {
                        // 无匹配单词，仅在光标位置插入
                        replaceRange = {
                            startLineNumber: currentPosition.lineNumber,
                            startColumn: currentPosition.column,
                            endLineNumber: currentPosition.lineNumber,
                            endColumn: currentPosition.column
                        };
                    }
                    
                    // 插入建议的内容
                    this.editor.executeEdits('inline-suggestion', [{
                        range: replaceRange,
                        text: insertText
                    }]);
                    
                    // 移除内联建议
                    this._removeInlineSuggestions();
                }
            }
        };
        
        // 将监听器添加到window以确保捕获所有Tab事件
        window.addEventListener('keydown', this._tabKeyListener, true);
    }
    
    // 私有方法：设置事件监听器
    _setupEventListeners() {
        if (!this.editor) return;
        
        // 添加内容变更监听器
        this.editor.onDidChangeModelContent(() => {
            this._handleContentChange();
        });

        // 添加光标位置变更监听器
        this.editor.onDidChangeCursorPosition(() => {
            this._handleCursorChange();
        });
        
        // 监听焦点变更
        this.editor.onDidFocusEditorText(() => {
            // 编辑器获得焦点
        });
        
        this.editor.onDidBlurEditorText(() => {
            // 编辑器失去焦点
        });
        
        // 添加鼠标滚轮事件监听器，实现按住ctrl键滚动鼠标滚轮调整字体大小
        this._setupFontSizeAdjustment();
    }
    
    // 新增：字体大小调整功能
    _setupFontSizeAdjustment() {
        console.log('设置字体大小调整功能...');
        
        // 从本地存储中获取保存的字体大小，如果有的话
        const savedFontSize = localStorage.getItem('monacoEditorFontSize');
        const savedLineHeight = localStorage.getItem('monacoEditorLineHeight');
        
        if (savedFontSize) {
            const fontSize = parseInt(savedFontSize);
            const lineHeight = savedLineHeight ? parseInt(savedLineHeight) : Math.round(fontSize * 1.4);
            
            if (!isNaN(fontSize) && fontSize >= 8 && fontSize <= 36) {
                this.editor.updateOptions({ 
                    fontSize: fontSize,
                    lineHeight: lineHeight
                });
                this._currentFontSize = fontSize;
                console.log(`从本地存储恢复字体大小: ${fontSize}, 行高: ${lineHeight}`);
            }
        }
        
        // 默认字体大小
        this._baseFontSize = this.editor.getOption(monaco.editor.EditorOption.fontSize) || 14;
        
        // 当前字体大小
        this._currentFontSize = this._currentFontSize || this._baseFontSize;
        console.log(`初始字体大小: ${this._currentFontSize}`);
        
        // 确保容器元素存在
        if (!this.containerElement) {
            console.error('编辑器容器元素不存在，无法添加滚轮事件监听器');
            return;
        }
        
        console.log('在编辑器容器上添加wheel事件监听器');
        
        // 监听编辑器容器的滚轮事件 - 首先尝试直接绑定到编辑器DOM元素
        const editorDomNode = this.editor.getDomNode();
        if (editorDomNode) {
            console.log('找到编辑器DOM节点，绑定wheel事件');
            
            // 主要监听器添加到编辑器DOM节点
            editorDomNode.addEventListener('wheel', this._handleWheelEvent.bind(this), { passive: false });
            
            // 备用监听器添加到容器
            this.containerElement.addEventListener('wheel', this._handleWheelEvent.bind(this), { passive: false });
        } else {
            // 如果找不到编辑器DOM节点，则只绑定到容器
            console.log('未找到编辑器DOM节点，仅绑定到容器');
            this.containerElement.addEventListener('wheel', this._handleWheelEvent.bind(this), { passive: false });
        }
        
        // 额外添加一个全局监听器，确保捕获所有相关事件
        document.addEventListener('wheel', (event) => {
            // 检查事件目标是否在编辑器区域内
            let target = event.target;
            let isInEditor = false;
            
            while (target && !isInEditor) {
                if (target === this.containerElement || (editorDomNode && target === editorDomNode)) {
                    isInEditor = true;
                }
                target = target.parentElement;
            }
            
            if (isInEditor && event.ctrlKey) {
                console.log('全局wheel事件：在编辑器区域内且按下Ctrl键');
                this._handleWheelEvent(event);
            }
        }, { passive: false, capture: true });
    }
    
    // 新增：wheel事件处理函数（抽取为单独方法以便复用）
    _handleWheelEvent(event) {
        // 仅当按下Ctrl键时才调整字体大小
        if (event.ctrlKey) {
            console.log('捕获到Ctrl+wheel事件', {
                deltaY: event.deltaY,
                deltaMode: event.deltaMode,
                target: event.target.tagName
            });
            
            // 阻止默认行为（网页缩放）
            event.preventDefault();
            event.stopPropagation();
            
            // 根据滚轮方向调整字体大小
            const delta = event.deltaY > 0 ? -1 : 1; // 向下滚动为负，向上滚动为正
            this._adjustFontSize(delta);
            
            console.log(`字体大小调整: ${this._currentFontSize}`);
            
            return false;
        }
    }
    
    // 新增：调整字体大小的方法
    _adjustFontSize(delta) {
        // 计算新的字体大小，每次增减 1 个点的大小
        let newFontSize = this._currentFontSize + delta;
        
        // 限制字体大小范围，防止过大或过小
        newFontSize = Math.max(8, Math.min(36, newFontSize));
        
        // 如果大小没有变化，则不需要更新
        if (newFontSize === this._currentFontSize) {
            console.log('字体大小未变化');
            return;
        }
        
        console.log(`字体大小从 ${this._currentFontSize} 变更为 ${newFontSize}`);
        
        // 更新当前字体大小
        this._currentFontSize = newFontSize;
        
        // 计算按比例的行高 - 通常行高为字体大小的1.4-1.5倍
        const lineHeight = Math.round(newFontSize * 1.4);
        
        // 应用新的字体大小和行高，确保按比例缩放
        this.editor.updateOptions({ 
            fontSize: newFontSize,
            lineHeight: lineHeight
        });
        
        console.log(`行高调整为: ${lineHeight}`);
        
        // 将字体大小保存到本地存储
        localStorage.setItem('monacoEditorFontSize', newFontSize.toString());
        localStorage.setItem('monacoEditorLineHeight', lineHeight.toString());
        
        // 显示字体大小提示
        this._showFontSizeHint(newFontSize);
    }
    
    // 新增：显示字体大小调整提示
    _showFontSizeHint(fontSize) {
        // 移除旧的提示（如果有）
        this._removeFontSizeHint();
        
        // 创建提示元素
        this._fontSizeHint = document.createElement('div');
        this._fontSizeHint.className = 'monaco-font-size-hint';
        this._fontSizeHint.style.cssText = `
            position: absolute;
            z-index: 1000;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            padding: 8px 12px;
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            border-radius: 4px;
            font-size: 14px;
            opacity: 0.9;
            animation: fadeIn 0.2s ease-in-out;
            pointer-events: none;
        `;
        
        this._fontSizeHint.textContent = `字体大小: ${fontSize}`;
        
        // 添加到编辑器容器
        this.containerElement.appendChild(this._fontSizeHint);
        
        // 1.5秒后自动消失
        this._fontSizeHintTimeout = setTimeout(() => this._removeFontSizeHint(), 1500);
    }
    
    // 新增：移除字体大小提示
    _removeFontSizeHint() {
        if (this._fontSizeHintTimeout) {
            clearTimeout(this._fontSizeHintTimeout);
            this._fontSizeHintTimeout = null;
        }
        
        if (this._fontSizeHint && this._fontSizeHint.parentNode) {
            this._fontSizeHint.parentNode.removeChild(this._fontSizeHint);
            this._fontSizeHint = null;
        }
    }
    
    // 注册代码补全提供程序
    _registerCompletionProvider() {
        monaco.languages.registerCompletionItemProvider('c', {
            // 更新触发字符，包含更多常用的编程符号
            triggerCharacters: [
                '.', '>', '(', '{', '[', '=', // 符号
                ' ', '\n', // 空格和换行
                'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
                'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
                'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
                'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
            ],
            provideCompletionItems: async (model, position) => {
                // 获取当前行内容
                const lineContent = model.getLineContent(position.lineNumber);
                const wordUntilPosition = model.getWordUntilPosition(position);
                
                // 智能触发判断
                const shouldTrigger = this._shouldTriggerCompletion(model, position, wordUntilPosition);
                if (!shouldTrigger) {
                    return { suggestions: [] };
                }

                try {
                    // 构建上下文
                    const context = this._buildCompletionContext(model, position);
                    
                    // 使用本地预测代替API调用
                    // 注意: 在线代码补全API暂时禁用，使用本地预测替代
                    if (window.AICodePredictor) {
                        const predictor = new window.AICodePredictor();
                        predictor.updateContext(context.prefix, position);
                        const predictions = await predictor.predict();
                        
                        return {
                            suggestions: this._processSuggestions(predictions, position, wordUntilPosition)
                        };
                    }
                    
                    // 暂时禁用在线API调用
                    /*
                    const response = await fetch('http://localhost:3001/api/predict', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(context)
                    });

                    if (!response.ok) {
                        console.warn(`API请求失败: ${response.status} ${response.statusText}`);
                        switch (response.status) {
                            case 429:
                                console.warn('API请求过于频繁');
                                break;
                            case 500:
                                console.warn('服务器内部错误，可能是API密钥问题');
                                break;
                            default:
                                console.warn('API请求失败');
                        }
                        return { suggestions: [] };
                    }

                    const data = await response.json();
                    
                    if (data.status === 'success' && data.suggestions) {
                        return {
                            suggestions: this._processSuggestions(data.suggestions, position, wordUntilPosition)
                        };
                    }
                    */
                    
                    // 默认返回空数组
                    return { suggestions: [] };
                } catch (error) {
                    // 优雅处理异常
                    console.error('获取代码补全建议失败:', error);
                    // 不向外层传递异常，返回空数组
                    return { suggestions: [] };
                }
            }
        });
    }
    
    // 判断是否应该触发补全
    _shouldTriggerCompletion(model, position, wordUntilPosition) {
        const lineContent = model.getLineContent(position.lineNumber);
        const currentLine = lineContent.substring(0, position.column - 1);
        
        // 如果是注释，不触发
        if (currentLine.trim().startsWith('//')) {
            return false;
        }
        
        // 如果在字符串内，不触发
        const isInString = this._isInString(lineContent, position.column);
        if (isInString) {
            return false;
        }
        
        // 智能触发条件
        return (
            wordUntilPosition.word.length >= 2 || // 至少输入2个字符
            /^(pr|ma|sc|in|fo|wh|if|re|vo)/.test(wordUntilPosition.word) || // 常见函数开头
            /[=({[]$/.test(currentLine.trim()) || // 输入了开始符号
            this._isNewStatement(model, position) // 新语句开始
        );
    }
    
    // 检查是否在字符串内
    _isInString(lineContent, column) {
        let inString = false;
        let stringChar = '';
        
        for (let i = 0; i < column - 1; i++) {
            const char = lineContent[i];
            if ((char === '"' || char === "'") && (i === 0 || lineContent[i-1] !== '\\')) {
                if (!inString) {
                    inString = true;
                    stringChar = char;
                } else if (char === stringChar) {
                    inString = false;
                }
            }
        }
        
        return inString;
    }
    
    // 检查是否是新语句开始
    _isNewStatement(model, position) {
        if (position.lineNumber === 1) return true;
        
        const prevLine = model.getLineContent(position.lineNumber - 1).trim();
        const currentLine = model.getLineContent(position.lineNumber).trim();
        
        return (
            prevLine.endsWith(';') || 
            prevLine.endsWith('{') || 
            prevLine.endsWith('}') ||
            currentLine === ''
        );
    }
    
    // 构建补全请求上下文
    _buildCompletionContext(model, position) {
        // 获取前缀（当前位置之前的所有内容）
        let prefix = '';
        for (let i = 1; i < position.lineNumber; i++) {
            prefix += model.getLineContent(i) + '\n';
        }
        prefix += model.getLineContent(position.lineNumber).substring(0, position.column - 1);

        // 获取后缀（当前位置之后的所有内容）
        let suffix = model.getLineContent(position.lineNumber).substring(position.column - 1);
        const lineCount = model.getLineCount();
        for (let i = position.lineNumber + 1; i <= lineCount; i++) {
            suffix += '\n' + model.getLineContent(i);
        }

        return {
            prefix,
            suffix,
            cursor: {
                line: position.lineNumber,
                column: position.column
            }
        };
    }
    
    // 处理补全建议
    _processSuggestions(suggestions, position, wordUntilPosition) {
        // 移除旧的内联建议
        this._removeInlineSuggestions();
        
        if (!suggestions || suggestions.length === 0) {
            return [];
        }
        
        // 获取第一个建议
        const suggestion = suggestions[0];
        
        // 净化建议文本，移除多余空格
        const cleanText = suggestion.insertText.trim();
        suggestion.insertText = cleanText;
        
        // 创建内联建议装饰器
        const inlineSuggestionDecoration = {
            range: new monaco.Range(
                position.lineNumber,
                position.column,
                position.lineNumber,
                position.column
            ),
            options: {
                after: {
                    content: cleanText,
                    inlineClassName: 'inline-suggestion'
                },
                stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
            }
        };
        
        // 应用装饰器
        this._currentInlineSuggestionDecorations = this.editor.deltaDecorations(
            this._currentInlineSuggestionDecorations || [],
            [inlineSuggestionDecoration]
        );
        
        // 添加CSS样式
        if (!document.getElementById('inline-suggestion-style')) {
            const style = document.createElement('style');
            style.id = 'inline-suggestion-style';
            style.textContent = `
                .inline-suggestion {
                    color: #808080;
                    font-style: italic;
                    opacity: 0.8;
                    user-select: none;
                    pointer-events: none;
                }
            `;
            document.head.appendChild(style);
        }
        
        // 保存当前建议以供Tab键使用
        this._currentSuggestion = suggestion;
        
        return [];
    }
    
    // 移除内联建议
    _removeInlineSuggestions() {
        if (this._currentInlineSuggestionDecorations) {
            this._currentInlineSuggestionDecorations = this.editor.deltaDecorations(
                this._currentInlineSuggestionDecorations,
                []
            );
        }
        // 清除当前建议引用
        this._currentSuggestion = null;
    }
    
    // 更新处理内容变更的方法
    async _handleContentChange() {
        // 清除之前的定时器
        if (this._throttleTimeout) {
            clearTimeout(this._throttleTimeout);
        }

        // 检查是否有Vue应用实例和可视化器
        if (this.vueApp && this.vueApp.visualizer) {
            // 处理实时数组变化，用于可视化
            this._handleArrayChanges();
        }

        // 检查是否需要节流
        const now = Date.now();
        if (now - this._lastRequestTime < this._MIN_REQUEST_INTERVAL) {
            // 设置新的定时器
            this._throttleTimeout = setTimeout(() => {
                this._handleContentChange();
            }, this._MIN_REQUEST_INTERVAL);
            return;
        }

        const currentPosition = this.editor.getPosition();
        if (!currentPosition) return;
        
        const currentLine = currentPosition.lineNumber;
        const currentColumn = currentPosition.column;
        
        // 获取当前行的内容
        const currentLineContent = this.editor.getModel().getLineContent(currentLine);
        
        // 如果当前行是空行或者正在输入注释，移除建议并返回
        if (!currentLineContent.trim() || currentLineContent.trim().startsWith('//')) {
            this._removeInlineSuggestions();
            return;
        }
        
        // 检查触发条件
        const wordUntilPosition = this.editor.getModel().getWordUntilPosition(currentPosition);
        const shouldTrigger = this._shouldTriggerCompletion(this.editor.getModel(), currentPosition, wordUntilPosition);
        
        if (!shouldTrigger) {
            this._removeInlineSuggestions();
            return;
        }

        // 构建请求内容
        const requestBody = this._buildRequestBody(currentPosition);
        
        // 检查输入的值是否在合理范围内
        this._checkInputValueLimits();
        
        // 发送请求并处理响应
        await this._sendPredictionRequest(requestBody.prefix, requestBody.suffix, requestBody.cursor);
    }
    
    // 新增：处理数组变化并更新可视化
    _handleArrayChanges() {
        if (!this.vueApp || !this.vueApp.selectedAlgorithm) return;
        
        // 使用更短的节流时间来处理数组变化
        if (this._arrayChangeThrottleTimeout) {
            clearTimeout(this._arrayChangeThrottleTimeout);
        }
        
        // 使用较短的延迟处理数组更新，保证响应速度
        this._arrayChangeThrottleTimeout = setTimeout(() => {
            // 获取当前编辑器内容
            const code = this.getValue();
            // 使用Vue实例中的extractArrayFromCode方法提取数组
            const newArray = this.vueApp.extractArrayFromCode(code);
            
            // 修改这里：允许单元素数组
            if (newArray && newArray.length >= 1) { // 原来是 >= 2
                // 比较是否有变化
                if (!this._arrayEquals(newArray, this.vueApp.sortArray)) {
                    console.log('检测到数组变化，更新可视化:', newArray);
                    
                    // 更新Vue实例中的数组数据
                    this.vueApp.sortArray = newArray;
                    
                    // 重置可视化器以显示新数组
                    if (this.vueApp.visualizer) {
                        // 使用requestAnimationFrame确保在下一帧渲染前更新
                        requestAnimationFrame(() => {
                            this.vueApp.visualizer.resetAnimationState(newArray);
                            
                            // 更新监听DOM事件，确保图表尺寸正确
                            setTimeout(() => {
                                window.dispatchEvent(new Event('resize'));
                            }, 10);
                        });
                    }
                    
                    // 通知Vue更新UI状态
                    if (typeof this.vueApp.updateButtonStates === 'function') {
                        this.vueApp.updateButtonStates();
                    }
                }
            }
        }, 150);
    }
    
    // 辅助方法：比较两个数组是否相等
    _arrayEquals(a, b) {
        if (!a || !b) return false;
        if (a.length !== b.length) return false;
        
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        
        return true;
    }

    // 构建请求体
    _buildRequestBody(position) {
        const model = this.editor.getModel();
        const lineCount = model.getLineCount();
        const currentLine = position.lineNumber;
        const currentColumn = position.column;

        // 获取前缀
        let prefix = '';
        for (let i = 1; i < currentLine; i++) {
            prefix += model.getLineContent(i) + '\n';
        }
        prefix += model.getLineContent(currentLine).substring(0, currentColumn);

        // 获取后缀
        let suffix = model.getLineContent(currentLine).substring(currentColumn);
        for (let i = currentLine + 1; i <= lineCount; i++) {
            suffix += '\n' + model.getLineContent(i);
        }

        return {
            prefix,
            suffix,
            cursor: {
                line: currentLine,
                column: currentColumn
            }
        };
    }

    // 添加错误提示UI
    _showErrorMessage(message) {
        // 移除旧的错误提示
        this._removeErrorWidget();
        
        // 创建错误提示widget
        this._errorWidget = document.createElement('div');
        this._errorWidget.className = 'monaco-error-widget';
        this._errorWidget.style.cssText = `
            position: absolute;
            z-index: 1000;
            bottom: 30px;
            right: 30px;
            padding: 8px 12px;
            background-color: #f44336;
            color: white;
            border-radius: 4px;
            font-size: 14px;
            max-width: 300px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            animation: fadeIn 0.3s ease-in-out;
        `;
        
        this._errorWidget.textContent = message;
        
        // 添加关闭按钮
        const closeButton = document.createElement('span');
        closeButton.innerHTML = '&times;';
        closeButton.style.cssText = `
            margin-left: 8px;
            cursor: pointer;
            float: right;
        `;
        closeButton.onclick = () => this._removeErrorWidget();
        
        this._errorWidget.appendChild(closeButton);
        
        // 添加到编辑器容器
        this.containerElement.appendChild(this._errorWidget);
        
        // 3秒后自动消失
        setTimeout(() => this._removeErrorWidget(), 3000);
    }

    // 移除错误提示
    _removeErrorWidget() {
        if (this._errorWidget && this._errorWidget.parentNode) {
            this._errorWidget.parentNode.removeChild(this._errorWidget);
            this._errorWidget = null;
        }
    }

    // 发送预测请求
    async _sendPredictionRequest(prefix, suffix, cursor) {
        try {
            // 使用本地预测代替API调用
            // 注意: 在线代码补全API暂时禁用，使用本地预测替代
            if (window.AICodePredictor) {
                const predictor = new window.AICodePredictor();
                predictor.updateContext(prefix, cursor);
                return await predictor.predict();
            }
            
            // 暂时禁用在线API调用
            /*
            const response = await fetch('http://localhost:3001/api/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prefix, suffix, cursor })
            });

            if (!response.ok) {
                console.error('预测API请求失败:', response.status, response.statusText);
                return [];
            }

            const data = await response.json();
            if (data && data.suggestions) {
                return data.suggestions;
            }
            */
            
            return [];
        } catch (error) {
            console.error('发送预测请求时出错:', error);
            return [];
        }
    }

    // 显示预测建议
    _showPredictions(predictions, position) {
        // 使用 Monaco 编辑器的建议 API
        this.editor.trigger('', 'editor.action.triggerSuggest', {
            suggestions: predictions.map(prediction => ({
                label: prediction.label,
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: prediction.insertText,
                range: {
                    startLineNumber: position.lineNumber,
                    startColumn: position.column,
                    endLineNumber: position.lineNumber,
                    endColumn: position.column
                },
                detail: prediction.detail
            }))
        });
    }

    // 处理光标变更
    _handleCursorChange() {
        // 当光标移动时，可以在这里添加额外的逻辑
        // 例如，检查是否需要更新预测建议
    }
    
    // 私有方法：触发编辑器就绪事件
    _dispatchReadyEvent() {
        // 创建并触发自定义事件，通知其他模块编辑器已就绪
        const event = new CustomEvent('editor-ready', {
            detail: { 
                editor: this.editor,
                manager: this
            }
        });
        
        // 触发事件
        window.dispatchEvent(event);
        
        // 确保全局editorManager引用已设置
        window.editorManager = this;
        
        // 如果Vue实例就绪，尝试连接
        if (window.app) {
            this.connectToVueApp(window.app);
        }
        
        console.log('Monaco编辑器已加载');
    }
    
    // 公共方法：设置编辑器语言
    setLanguage(language) {
        if (!this.editor) return;
        
        const model = this.editor.getModel();
        if (model) {
            monaco.editor.setModelLanguage(model, language);
            this.editorState.language = language;
        }
    }
    
    // 公共方法：设置编辑器主题
    setTheme(theme) {
        if (!this.editor) return;
        
        monaco.editor.setTheme(theme);
        this.editorState.theme = theme;
    }
    
    // 公共方法：获取编辑器内容
    getValue() {
        if (!this.editor) {
            return this.editorState.value;
        }
        
        return this.editor.getValue();
    }
    
    // 公共方法：设置编辑器内容
    setValue(value, triggerEvents = true) {
        if (!this.editor) {
            this.editorState.value = value;
            return;
        }
        
        this.editor.setValue(value);
        this.editorState.value = value;
        
        if (triggerEvents && this.vueApp && typeof this.vueApp.code !== 'undefined') {
            this.vueApp.code = value;
        }
    }
    
    // 更新编辑器代码内容
    updateEditorCode(algorithmId) {
        if (!this.editor) {
            console.warn('编辑器未初始化，无法更新代码');
            return false;
        }
        
        // 首先检查全局算法代码示例是否可用
        if (typeof window.algorithmCodeExamples === 'undefined') {
            console.warn('算法代码示例未找到');
            return false;
        }
        
        // 查找所选算法的代码
        let code = '';
        let language = this.editorState.language;
        
        // 遍历所有分类查找算法
        const examples = window.algorithmCodeExamples;
        
        // 查找所有语言版本的代码
        const allLanguages = examples[algorithmId];
        
        if (!allLanguages) {
            console.warn(`算法 "${algorithmId}" 的代码示例未找到`);
            return false;
        }
        
        // 查找当前语言的代码，如果没有则使用默认语言(c)
        code = allLanguages[language] || allLanguages['c'] || '';
        
        if (!code) {
            console.warn(`算法 "${algorithmId}" 没有 ${language} 语言的代码示例`);
            return false;
        }
        
        // 应用视觉效果
        const currentValue = this.getValue();
        const currentPos = this.editor.getPosition();
        
        // 如果内容相同，不需要更新
        if (currentValue === code) {
            return true;
        }
        
        // 设置新的值
        this.setValue(code);
        
        // 保存当前滚动位置
        const scrollPos = this.editor.getScrollTop();
        
        // 恢复滚动位置
        setTimeout(() => {
            this.editor.setScrollTop(scrollPos);
            this.editor.setPosition(currentPos || { lineNumber: 1, column: 1 });
            this.editor.focus();
        }, 0);
        
        return true;
    }
    
    // 公共方法：连接到Vue应用实例
    connectToVueApp(vueInstance) {
        this.vueApp = vueInstance;
        
        // 初始同步
        if (this.vueApp && typeof this.vueApp.code !== 'undefined') {
            const editorValue = this.getValue();
            if (editorValue && editorValue !== this.vueApp.code) {
                this.vueApp.code = editorValue;
            } else if (this.vueApp.code && this.vueApp.code !== editorValue) {
                this.setValue(this.vueApp.code);
            }
        }
        
        console.log('编辑器已连接到Vue应用');
    }
    
    // 公共方法：重新计算编辑器布局
    layout() {
        if (this.editor) {
            this.editor.layout();
        }
    }
    
    // 公共方法：销毁编辑器实例
    destroy() {
        if (this.editor) {
            // 移除Tab键监听器
            if (this._tabKeyListener) {
                window.removeEventListener('keydown', this._tabKeyListener, true);
                this._tabKeyListener = null;
            }
            
            this.editor.dispose();
            this.editor = null;
        }
        
        // 清除Vue应用引用
        this.vueApp = null;
        
        // 清除全局引用
        if (window.editorManager === this) {
            window.editorManager = null;
        }
    }
    
    // 公共方法：获取编辑器就绪状态
    isReady() {
        return this.editorState.ready;
    }

    // 添加新方法：检查输入值的范围
    _checkInputValueLimits() {
        // 获取当前行的内容
        const position = this.editor.getPosition();
        if (!position) return;
        
        const currentLine = this.editor.getModel().getLineContent(position.lineNumber);
        
        // 检查当前行是否包含大于500的数字
        const largeNumberMatch = currentLine.match(/\b(\d{4,}|\d{3,}\.?\d*)\b/);
        if (largeNumberMatch) {
            const value = parseFloat(largeNumberMatch[1]);
            if (value > 500) {
                // 显示内联提示
                this._showInlineValueHint(position.lineNumber);
            }
        }
    }

    // 添加内联提示
    _showInlineValueHint(lineNumber) {
        // 避免多次显示提示
        if (this._inlineHintVisible) return;
        this._inlineHintVisible = true;
        
        // 创建提示装饰
        const decorations = this.editor.deltaDecorations([], [
            {
                range: new monaco.Range(lineNumber, 1, lineNumber, 1),
                options: {
                    isWholeLine: true,
                    className: 'line-warning',
                    glyphMarginClassName: 'warning-glyph',
                    overviewRuler: {
                        color: '#ffcc00',
                        position: monaco.editor.OverviewRulerLane.Right
                    },
                    hoverMessage: {
                        value: '**数值超出建议范围**\n\n建议数组元素的值保持在1-500范围内，以获得最佳可视化效果。'
                    }
                }
            }
        ]);
        
        // 添加CSS样式（如果尚未添加）
        this._ensureWarningStyles();
        
        // 3秒后移除提示
        setTimeout(() => {
            this.editor.deltaDecorations(decorations, []);
            this._inlineHintVisible = false;
        }, 3000);
    }

    // 确保警告样式已添加到文档
    _ensureWarningStyles() {
        if (document.getElementById('monaco-warning-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'monaco-warning-styles';
        style.innerHTML = `
            .line-warning {
                background-color: rgba(255, 204, 0, 0.1);
            }
            .warning-glyph {
                background: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ZmY2MwMCIgd2lkdGg9IjE4cHgiIGhlaWdodD0iMThweCIPgogICAgPHBhdGggZD0iTTExLDE5aDJWMTFoLTJabTAtNmgyVjloLTJaIi8+CiAgICA8cGF0aCBkPSJNMjIuNTYsMTZsLTMuNjEtNS4yNYwtMTEuMSwxNWgxLjM3TDIuMjUsMTYuMDVabS0zLjY5LS41SDE1LjUMOS41LDQuMThsLTgsMTIuNzVMMTAuMjcsMTlsLTQtNS44N0wxOC44OCw1LjU0WiIvPgo8L3N2Zz4=') no-repeat center center;
            }
        `;
        document.head.appendChild(style);
    }

    // 设置编辑器内容
    setContent(content) {
        if (!this.editor) {
            console.error('编辑器尚未初始化，无法设置内容');
            return;
        }
        
        // 确保内容是字符串
        if (typeof content !== 'string') {
            // 如果是对象，尝试获取当前语言对应的内容
            if (typeof content === 'object' && content !== null) {
                const language = this.editor.getModel().getLanguageId();
                if (content[language]) {
                    content = content[language];
                } else {
                    // 如果没有找到当前语言的内容，使用第一个可用内容
                    const firstLanguage = Object.keys(content)[0];
                    if (firstLanguage) {
                        content = content[firstLanguage];
                    } else {
                        content = '';
                    }
                }
            } else {
                content = String(content);
            }
        }
        
        console.log(`设置编辑器内容，长度: ${content.length}`);
        
        // 设置编辑器内容
        this.editor.setValue(content);
        
        // 确保编辑器获得焦点并滚动到顶部
        setTimeout(() => {
            this.editor.focus();
            this.editor.revealLine(1);
        }, 100);
    }
}

// 初始化函数
function initializeEditor() {
    // 确保只有一个实例
    if (!window.editorManager) {
        console.log('创建编辑器管理器实例...');
        window.editorManager = new MonacoEditorManager('monaco-editor-container', {
            automaticLayout: true,
            theme: 'vs'
        });
        
        // 确保实例可用于Vue
        if (window.app) {
            if (window.app.editorManager !== window.editorManager) {
                window.app.editorManager = window.editorManager;
                window.app.isEditorReady = true;
                window.editorManager.connectToVueApp(window.app);
                console.log('编辑器已连接到Vue实例');
            }
        } else {
            console.log('Vue实例尚未就绪，编辑器将等待Vue连接');
        }
    } else {
        console.log('编辑器管理器实例已存在');
    }
}

// 在DOMContentLoaded事件时初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM已加载，准备初始化编辑器...');
    
    let monacoCheckAttempts = 0;
    const MAX_ATTEMPTS = 50; // 最多尝试次数
    
    // 检查Monaco编辑器是否已加载
    function checkMonacoAndInitialize() {
        monacoCheckAttempts++;
        console.log(`检查Monaco是否加载(${monacoCheckAttempts}/${MAX_ATTEMPTS})...`);
        
        if (monacoCheckAttempts > MAX_ATTEMPTS) {
            console.error('Monaco加载检查达到最大尝试次数，放弃加载');
            return;
        }
        
        if (typeof monaco !== 'undefined') {
            // Monaco已经加载，直接初始化
            console.log('Monaco已加载，直接初始化');
            window.dispatchEvent(new CustomEvent('monaco-ready'));
            initializeEditor();
        } else if (typeof require !== 'undefined') {
            try {
                console.log('通过require加载Monaco编辑器...');
                // 避免重复配置require
                if (!window.monacoRequireConfigured && require.config) {
                    window.monacoRequireConfigured = true;
                    require(['vs/editor/editor.main'], () => {
                        console.log('Monaco编辑器核心模块已加载');
                        // 触发Monaco就绪事件
                        window.dispatchEvent(new CustomEvent('monaco-ready'));
                        initializeEditor();
                    });
                } else {
                    // 如果已配置，等待一段时间后再检查
                    setTimeout(checkMonacoAndInitialize, 200);
                }
            } catch (e) {
                console.error('通过require加载Monaco编辑器时出错:', e);
                // 出错后继续尝试
                setTimeout(checkMonacoAndInitialize, 200);
            }
        } else {
            // 继续等待monaco加载
            setTimeout(checkMonacoAndInitialize, 200);
        }
    }
    
    // 开始检查Monaco是否加载
    checkMonacoAndInitialize();
});

// 全局接口
window.monacoEditorAPI = {
    initializeEditor: initializeEditor,
    getManager: () => window.editorManager
};

// 添加CSS样式
if (!document.getElementById('monaco-editor-styles')) {
    const style = document.createElement('style');
    style.id = 'monaco-editor-styles';
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .monaco-error-widget {
            animation: fadeIn 0.3s ease-in-out;
        }
        
        .inline-suggestion {
            color: #808080;
            font-style: italic;
            opacity: 0.8;
            user-select: none;
            pointer-events: none;
        }
    `;
    document.head.appendChild(style);
}