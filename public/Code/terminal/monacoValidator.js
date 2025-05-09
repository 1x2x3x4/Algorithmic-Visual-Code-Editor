/**
 * Monaco编辑器代码验证器
 * 负责从Monaco编辑器获取问题标记并更新到问题面板
 */
(function() {
  // 创建验证器对象
  const MonacoValidator = {
    /**
     * 尝试自动查找并连接编辑器实例
     */
    connect: function() {
      console.log('尝试自动查找并连接编辑器实例...');
      
      // 尝试不同的方式查找编辑器实例
      if (window.editor) {
        console.log('找到全局editor对象，正在初始化验证器');
        this.initialize(window.editor);
        return true;
      } else if (window.editorManager && window.editorManager.editor) {
        console.log('找到editorManager.editor对象，正在初始化验证器');
        this.initialize(window.editorManager.editor);
        return true;
      } else if (window.monacoEditorAPI && window.monacoEditorAPI.getEditor) {
        const editor = window.monacoEditorAPI.getEditor();
        if (editor) {
          console.log('通过monacoEditorAPI获取到editor对象，正在初始化验证器');
          this.initialize(editor);
          return true;
        }
      }
      
      console.warn('无法找到编辑器实例，将延迟尝试连接');
      
      // 延迟尝试连接
      setTimeout(() => {
        if (!this.editor) {
          this.connect();
        }
      }, 1000);
      
      return false;
    },
    
    /**
     * 初始化验证器
     * @param {Object} editor - Monaco编辑器实例
     */
    initialize: function(editor) {
      if (!editor) {
        console.error('Monaco编辑器实例未提供，无法初始化验证器');
        return;
      }
      
      console.log('验证器初始化中，编辑器实例:', editor ? '已提供' : '未提供');
      
      this.editor = editor;
      this.currentModel = null;
      this.currentFile = "当前文件";
      
      // 清除所有可能存在的计时器
      if (this._updateProblemsTimer) {
        clearTimeout(this._updateProblemsTimer);
        this._updateProblemsTimer = null;
      }
      
      if (this._panelUpdateTimer) {
        clearTimeout(this._panelUpdateTimer);
        this._panelUpdateTimer = null;
      }
      
      // 初始化状态标记
      this._lastPanelUpdateTime = 0;
      this._isFirstValidation = true;
      
      // 设置监听器
      this.setupListeners();
      
      // 检查编辑器是否有model
      const model = this.editor.getModel();
      if (model) {
        console.log('编辑器模型已获取，URI:', model.uri.toString());
        this.updateCurrentModel();
        
        // 立即触发一次验证
        this.forceValidate();
      } else {
        console.warn('编辑器模型未获取，将监听模型变化事件');
      }
      
      console.info('Monaco验证器初始化完成');
      
      // 确保问题面板已准备好
      if (window.ProblemsPanelManager && typeof window.ProblemsPanelManager.addProblemTabStyles === 'function') {
        window.ProblemsPanelManager.addProblemTabStyles();
      }
    },
    
    /**
     * 设置编辑器和模型变化的监听器
     */
    setupListeners: function() {
      if (!this.editor) return;
      
      // 监听当前模型变化
      this.editor.onDidChangeModel(() => {
        console.debug('编辑器模型已变更，更新当前模型');
        this.updateCurrentModel();
        
        // 模型变化后立即触发验证
        setTimeout(() => this.forceValidate(), 500);
      });
      
      // 初始获取当前模型
      this.updateCurrentModel();
      
      // 每隔一段时间检查一次（兜底措施）
      setInterval(() => {
        if (this.editor && this.currentModel) {
          console.debug('定期检查触发验证');
          this.updateProblems();
        }
      }, 10000); // 10秒检查一次
      
      console.info('Monaco验证器已设置监听器');
    },
    
    /**
     * 更新当前编辑器模型引用
     */
    updateCurrentModel: function() {
      const model = this.editor.getModel();
      if (model) {
        this.currentModel = model;
        
        // 获取文件名（如果可能）
        const uri = model.uri.toString();
        const fileParts = uri.split('/');
        this.currentFile = fileParts[fileParts.length - 1];
        
        // 获取当前语言
        const languageId = model.getLanguageId();
        console.debug(`当前编辑器语言: ${languageId}`);
        
        // 根据不同语言配置验证选项
        switch(languageId) {
          case 'javascript':
          case 'typescript':
            // JavaScript/TypeScript验证设置
            if (window.monaco && monaco.languages.typescript) {
              monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
                noSemanticValidation: false,
                noSyntaxValidation: false
              });
              
              monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
                target: monaco.languages.typescript.ScriptTarget.ES2015,
                allowNonTsExtensions: true
              });
            }
            break;
            
          case 'c':
          case 'cpp':
            // C/C++语言验证配置（如果支持）
            console.debug('启用C/C++语法验证');
            break;
            
          case 'python':
            // Python语言验证配置
            console.debug('启用Python语法验证');
            break;
            
          case 'java':
            // Java语言验证配置
            console.debug('启用Java语法验证');
            break;
            
          default:
            console.debug(`语言 ${languageId} 的验证配置使用默认设置`);
        }
        
        // 初始更新问题
        this.debouncedUpdateProblems();
        
        // 设置模型变化监听器，使用去抖动技术减少频繁触发
        if (model.onDidChangeContent) {
          // 移除旧的监听器（如果存在）
          if (this._contentChangeDisposable) {
            this._contentChangeDisposable.dispose();
            this._contentChangeDisposable = null;
          }
          
          // 添加新的监听器，使用去抖动减少触发频率
          this._contentChangeDisposable = model.onDidChangeContent(() => {
            // 使用去抖动函数延迟更新，避免频繁刷新
            this.debouncedUpdateProblems();
          });
        }
      } else {
        this.currentModel = null;
      }
    },
    
    /**
     * 去抖动更新问题函数，减少频繁调用
     */
    debouncedUpdateProblems: function() {
      // 清除现有的定时器（如果存在）
      if (this._updateProblemsTimer) {
        clearTimeout(this._updateProblemsTimer);
        this._updateProblemsTimer = null;
      }
      
      // 设置新的定时器，延迟1秒后更新
      this._updateProblemsTimer = setTimeout(() => {
        this.updateProblems();
      }, 1000); // 1秒延迟，减少频繁更新
    },
    
    /**
     * 更新问题列表
     */
    updateProblems: function() {
      if (!this.currentModel || !window.monaco) {
        console.warn('无法更新问题：编辑器模型或Monaco未初始化');
        return;
      }
      
      try {
        // 获取当前语言
        const languageId = this.currentModel.getLanguageId();
        console.debug(`检查 ${languageId} 语言的问题...`);
        
        // 从Monaco获取当前的标记（markers）
        // 不指定模型ID获取所有标记，然后过滤当前模型的标记
        const allMarkers = monaco.editor.getModelMarkers();
        console.debug(`获取到总共 ${allMarkers.length} 个标记`);
        
        // 过滤出当前模型的标记
        const markers = allMarkers.filter(marker => 
          marker.resource && marker.resource.toString() === this.currentModel.uri.toString()
        );
        
        console.debug(`获取到 ${markers.length} 个 ${languageId} 语言的标记`);
        
        // 特殊处理不同语言，Monaco可能不会为这些语言生成标记
        // 如果是这些语言且没有标记，则手动生成基本语法错误标记
        if (markers.length === 0) {
          console.info(`为${languageId}代码生成自定义语法检查...`);
          
          let customMarkers = [];
          
          // 根据不同语言调用不同的检查函数
          if (languageId === 'c' || languageId === 'cpp') {
            customMarkers = this.generateCStyleMarkers(this.currentModel);
          } else if (languageId === 'python') {
            customMarkers = this.generatePythonMarkers(this.currentModel);
          } else if (languageId === 'java') {
            customMarkers = this.generateJavaMarkers(this.currentModel);
          }
          
          if (customMarkers.length > 0) {
            console.info(`自定义检查生成了 ${customMarkers.length} 个标记`);
            // 将自定义标记转换为应用的问题格式
            const problems = this.convertMarkerToProblems(customMarkers);
            
            // 更新Vue应用的问题状态
            this.updateAppProblems(problems);
            return;
          }
        }
        
        // 将标记转换为应用的问题格式
        const problems = this.convertMarkerToProblems(markers);
        
        // 输出详细的问题信息用于调试
        if (problems.length > 0) {
          console.debug('检测到以下问题:');
          problems.forEach((problem, index) => {
            console.debug(`[${index+1}] ${problem.message} (${problem.file}:${problem.line})`);
          });
        } else {
          console.debug('没有检测到任何问题');
        }
        
        // 更新Vue应用的问题状态
        this.updateAppProblems(problems);
        
        // 即使没有问题也更新面板，确保清空旧问题
        if (problems.length === 0) {
          console.debug('没有发现问题，清空问题面板');
          if (window.ProblemsPanelManager && typeof window.ProblemsPanelManager.updateProblemsList === 'function') {
            window.ProblemsPanelManager.updateProblemsList();
          }
        }
      } catch (error) {
        console.error('获取或处理Monaco标记时出错:', error);
      }
    },
    
    /**
     * 为C/C++代码生成基本的语法错误标记
     * @param {Object} model - Monaco编辑器模型
     * @returns {Array} - 标记数组
     */
    generateCStyleMarkers: function(model) {
      if (!model) return [];
      
      const markers = [];
      const code = model.getValue();
      const lines = code.split('\n');
      
      console.debug('开始自定义C/C++语法检查');
      
      // 跟踪括号配对
      let openParentheses = 0; // 圆括号 ()
      let openBraces = 0;      // 大括号 {}
      let openBrackets = 0;    // 方括号 []
      
      // 收集所有函数定义和变量声明
      const definedFunctions = new Set();
      const declaredVariables = new Set(['NULL', 'stdin', 'stdout', 'stderr']); // 常见预定义标识符
      
      // 第一遍：收集所有变量声明和函数定义
      lines.forEach((line, lineIndex) => {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('/*')) return;
        
        // 匹配变量声明 - 例如 "int x = 10;" 或 "char str[100];"
        const varDeclRegex = /\b(int|char|float|double|long|short|unsigned|signed|bool|void|size_t|FILE)\s+([a-zA-Z_][a-zA-Z0-9_,\s\[\]]*)\s*([;=]|$)/;
        const varMatch = trimmedLine.match(varDeclRegex);
        if (varMatch && varMatch[2]) {
          // 分割多个变量声明（如 int a, b, c;）
          const varNames = varMatch[2].split(',').map(v => v.trim().replace(/\[[^\]]*\]/g, ''));
          varNames.forEach(name => {
            // 去除任何尾随空格或额外的指针符号
            const cleanName = name.trim().replace(/\s*\*+$/, '');
            if (cleanName && !cleanName.includes(' ')) {
              declaredVariables.add(cleanName);
            }
          });
        }
        
        // 匹配函数参数声明 - 例如 "void func(int param1, char param2)"
        const funcParamRegex = /\b(\w+)\s+(\w+)\s*\(([^)]*)\)/;
        const funcMatch = trimmedLine.match(funcParamRegex);
        if (funcMatch && funcMatch[2] && funcMatch[3]) {
          // 添加函数名
          definedFunctions.add(funcMatch[2]);
          
          // 处理参数
          const params = funcMatch[3].split(',');
          params.forEach(param => {
            const paramParts = param.trim().split(/\s+/);
            if (paramParts.length >= 2) {
              const paramName = paramParts[paramParts.length - 1].replace(/\*/g, '').trim();
              if (paramName && !paramName.includes(' ')) {
                declaredVariables.add(paramName);
              }
            }
          });
        }
        
        // 匹配for循环变量声明 - 例如 "for(int i=0; i<10; i++)"
        const forLoopRegex = /for\s*\(\s*(int|char|float|double)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=/;
        const forMatch = trimmedLine.match(forLoopRegex);
        if (forMatch && forMatch[2]) {
          declaredVariables.add(forMatch[2]);
        }
      });
      
      console.debug('已声明的变量:', Array.from(declaredVariables));
      console.debug('已定义的函数:', Array.from(definedFunctions));
      
      // 第二遍：扫描检查基础语法错误
      lines.forEach((line, lineIndex) => {
        const trimmedLine = line.trim();
        
        // 跳过空行、预处理器指令和注释
        if (!trimmedLine || 
            trimmedLine.startsWith('#') || 
            trimmedLine.startsWith('//') || 
            trimmedLine.startsWith('/*') || 
            trimmedLine.includes('*/') ||
            trimmedLine.endsWith('\\')) {
          return;
        }
        
        // 检查1：缺少分号的行（更宽松的检测，捕获更多情况）
        if (!trimmedLine.endsWith(';') && 
            !trimmedLine.endsWith('{') && 
            !trimmedLine.endsWith('}') && 
            !trimmedLine.match(/^\s*(if|for|while|switch|else|#|\/\/|\/\*)\b/) &&
            !trimmedLine.endsWith("\\") && 
            (trimmedLine.includes('=') || 
             trimmedLine.match(/^\s*int\s+\w+/) ||
             trimmedLine.match(/^\s*char\s+\w+/) ||
             trimmedLine.match(/^\s*float\s+\w+/) ||
             trimmedLine.match(/^\s*double\s+\w+/) ||
             trimmedLine.match(/^\s*void\s+\w+/) ||
             trimmedLine.includes('.') || // 属性访问
             trimmedLine.includes('++') || // 递增
             trimmedLine.includes('--'))) {
          
          markers.push({
            severity: monaco.MarkerSeverity.Error,
            message: '缺少分号',
            startLineNumber: lineIndex + 1,
            startColumn: 1,
            endLineNumber: lineIndex + 1,
            endColumn: line.length + 1,
            source: 'c-linter'
          });
        }
        
        // 检查2：括号配对跟踪
        // 圆括号
        const leftParenCount = (trimmedLine.match(/\(/g) || []).length;
        const rightParenCount = (trimmedLine.match(/\)/g) || []).length;
        openParentheses += leftParenCount - rightParenCount;
        
        // 大括号
        const leftBraceCount = (trimmedLine.match(/\{/g) || []).length;
        const rightBraceCount = (trimmedLine.match(/\}/g) || []).length;
        openBraces += leftBraceCount - rightBraceCount;
        
        // 方括号
        const leftBracketCount = (trimmedLine.match(/\[/g) || []).length;
        const rightBracketCount = (trimmedLine.match(/\]/g) || []).length;
        openBrackets += leftBracketCount - rightBracketCount;
        
        // 检查控制语句的括号问题
        if (trimmedLine.match(/^\s*(if|for|while|switch)\s*\(/) && 
            !trimmedLine.includes(')')) {
          markers.push({
            severity: monaco.MarkerSeverity.Error,
            message: '控制语句缺少右括号',
            startLineNumber: lineIndex + 1,
            startColumn: 1,
            endLineNumber: lineIndex + 1,
            endColumn: line.length + 1,
            source: 'c-linter'
          });
        }
        
        // 检查控制语句缺少左括号
        if (trimmedLine.match(/^\s*(if|for|while|switch)\s*[^(]/) && 
            !trimmedLine.includes('(')) {
          markers.push({
            severity: monaco.MarkerSeverity.Error,
            message: '控制语句缺少左括号',
            startLineNumber: lineIndex + 1,
            startColumn: 1,
            endLineNumber: lineIndex + 1,
            endColumn: line.length + 1,
            source: 'c-linter'
          });
        }
        
        // 检查 if/for/while 后跟左花括号但缺少右圆括号
        if ((trimmedLine.includes('if') || 
             trimmedLine.includes('for') || 
             trimmedLine.includes('while')) && 
            trimmedLine.includes('{') && 
            trimmedLine.includes('(') && 
            !trimmedLine.includes(')')) {
          
          markers.push({
            severity: monaco.MarkerSeverity.Error,
            message: '控制语句括号不匹配',
            startLineNumber: lineIndex + 1,
            startColumn: 1,
            endLineNumber: lineIndex + 1,
            endColumn: line.length + 1,
            source: 'c-linter'
          });
        }
        
        // 检查一行内括号不匹配的情况
        if (leftParenCount !== rightParenCount && 
            (trimmedLine.match(/^\s*(if|for|while|switch)\b/) || 
             trimmedLine.includes('printf') || 
             trimmedLine.includes('scanf'))) {
          
          markers.push({
            severity: monaco.MarkerSeverity.Error,
            message: '圆括号不匹配',
            startLineNumber: lineIndex + 1,
            startColumn: 1,
            endLineNumber: lineIndex + 1,
            endColumn: line.length + 1,
            source: 'c-linter'
          });
        }
        
        // 检查方括号匹配
        if (leftBracketCount !== rightBracketCount && trimmedLine.includes('[')) {
          markers.push({
            severity: monaco.MarkerSeverity.Error,
            message: '方括号不匹配',
            startLineNumber: lineIndex + 1,
            startColumn: 1,
            endLineNumber: lineIndex + 1,
            endColumn: line.length + 1,
            source: 'c-linter'
          });
        }
        
        // 检查3：未定义变量使用
        // 这部分我们将检测printf中使用的变量是否已声明
        if (trimmedLine.includes('printf')) {
          // 识别printf中的格式化字符串
          const printfMatch = trimmedLine.match(/printf\s*\(\s*["']([^"']*)["']\s*(,\s*(.+)\s*)?\)/);
          if (printfMatch && printfMatch[3]) { // 有参数的printf
            const formatStr = printfMatch[1];
            const formatSpecifiers = formatStr.match(/%[diufFeEgGxXoscpaA]/g) || [];
            const args = printfMatch[3].split(',').map(arg => arg.trim());
            
            if (formatSpecifiers.length > 0) {
              // 检查格式符数量与参数数量是否匹配
              if (formatSpecifiers.length !== args.length) {
                markers.push({
                  severity: monaco.MarkerSeverity.Warning,
                  message: '格式化字符串与参数数量不匹配',
                  startLineNumber: lineIndex + 1,
                  startColumn: line.indexOf('printf'),
                  endLineNumber: lineIndex + 1,
                  endColumn: line.indexOf('printf') + 'printf'.length,
                  source: 'c-linter'
                });
              }
              
              // 检查每个参数是否是已声明的变量
              args.forEach((arg, index) => {
                // 过滤掉字面量、表达式等
                if (!/^(\d+|["'][^"']*["']|\w+\(.*\)|&|\*|[+\-]|sizeof)/.test(arg) && 
                    !arg.includes('+') && !arg.includes('-') && !arg.includes('*') && !arg.includes('/')) {
                  
                  // 去除数组访问语法等，只保留变量名
                  const varName = arg.replace(/\[[^\]]*\]/g, '').replace(/\.\w+/g, '').trim();
                  
                  // 检查是否是已声明的变量
                  if (varName && !declaredVariables.has(varName) && 
                      !declaredVariables.has(varName.replace(/^\*+/, ''))) { // 处理指针
                    markers.push({
                      severity: monaco.MarkerSeverity.Error,
                      message: `未声明的变量: ${varName}`,
                      startLineNumber: lineIndex + 1,
                      startColumn: line.indexOf(arg),
                      endLineNumber: lineIndex + 1,
                      endColumn: line.indexOf(arg) + arg.length,
                      source: 'c-linter'
                    });
                  }
                }
              });
            }
          }
        }
      });
      
      // 检查代码结尾的括号是否全部闭合
      if (openParentheses > 0) {
        markers.push({
          severity: monaco.MarkerSeverity.Error,
          message: `代码中有 ${openParentheses} 个未闭合的圆括号`,
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 2,
          source: 'c-linter'
        });
      }
      
      if (openBraces > 0) {
        markers.push({
          severity: monaco.MarkerSeverity.Error,
          message: `代码中有 ${openBraces} 个未闭合的大括号`,
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 2,
          source: 'c-linter'
        });
      }
      
      if (openBrackets > 0) {
        markers.push({
          severity: monaco.MarkerSeverity.Error,
          message: `代码中有 ${openBrackets} 个未闭合的方括号`,
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 2,
          source: 'c-linter'
        });
      }
      
      console.debug(`C/C++语法检查完成，检测到 ${markers.length} 个问题`);
      return markers;
    },
    
    /**
     * 为Python代码生成基本的语法错误标记
     * @param {Object} model - Monaco编辑器模型
     * @returns {Array} - 标记数组
     */
    generatePythonMarkers: function(model) {
      if (!model) return [];
      
      const markers = [];
      const code = model.getValue();
      const lines = code.split('\n');
      
      console.debug('开始自定义Python语法检查');
      
      // 收集所有变量和函数定义
      const declaredVariables = new Set(['self', 'True', 'False', 'None', '__name__']); // 内置标识符
      const importedModules = new Set();
      const definedFunctions = new Set(['print', 'len', 'range', 'str', 'int', 'float', 'list', 'dict', 'set', 'tuple', 'sum', 'min', 'max', 'open', 'input']); // 内置函数
      
      // 跟踪缩进和括号
      let indentationLevel = 0;
      let previousIndent = 0;
      let openParentheses = 0;
      let openBrackets = 0;
      let openBraces = 0;
      
      // 第一遍扫描：收集变量声明和函数定义
      lines.forEach((line, lineIndex) => {
        const trimmedLine = line.trim();
        
        // 跳过空行和注释
        if (!trimmedLine || trimmedLine.startsWith('#')) {
          return;
        }
        
        // 收集导入的模块
        if (trimmedLine.startsWith('import ')) {
          const importMatch = trimmedLine.match(/import\s+([a-zA-Z0-9_,\s]+)/);
          if (importMatch && importMatch[1]) {
            const modules = importMatch[1].split(',').map(m => m.trim());
            modules.forEach(module => {
              const simpleName = module.split('.')[0].trim();
              if (simpleName) {
                importedModules.add(simpleName);
              }
            });
          }
        }
        
        // 收集from导入的模块
        if (trimmedLine.startsWith('from ')) {
          const fromImportMatch = trimmedLine.match(/from\s+([a-zA-Z0-9_.]+)\s+import\s+([a-zA-Z0-9_*,\s]+)/);
          if (fromImportMatch && fromImportMatch[2]) {
            const imports = fromImportMatch[2].split(',').map(i => i.trim());
            imports.forEach(imp => {
              if (imp === '*') {
                // 无法跟踪星号导入，记录模块名
                const moduleName = fromImportMatch[1].trim();
                importedModules.add(moduleName);
              } else {
                declaredVariables.add(imp); // 直接添加导入的变量/函数
              }
            });
          }
        }
        
        // 收集变量赋值
        const assignmentMatch = trimmedLine.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=/);
        if (assignmentMatch && assignmentMatch[1]) {
          declaredVariables.add(assignmentMatch[1]);
        }
        
        // 收集多变量赋值，如 a, b = 1, 2
        const multiAssignMatch = trimmedLine.match(/^([a-zA-Z_][a-zA-Z0-9_]*(?:\s*,\s*[a-zA-Z_][a-zA-Z0-9_]*)+)\s*=/);
        if (multiAssignMatch && multiAssignMatch[1]) {
          const variables = multiAssignMatch[1].split(',').map(v => v.trim());
          variables.forEach(variable => {
            if (variable) declaredVariables.add(variable);
          });
        }
        
        // 收集函数定义
        const funcDefMatch = trimmedLine.match(/^def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
        if (funcDefMatch && funcDefMatch[1]) {
          definedFunctions.add(funcDefMatch[1]);
          
          // 收集函数参数
          const paramsMatch = trimmedLine.match(/def\s+[a-zA-Z0-9_]+\s*\(([^)]*)\)/);
          if (paramsMatch && paramsMatch[1]) {
            const params = paramsMatch[1].split(',').map(p => p.trim());
            params.forEach(param => {
              // 处理带默认值的参数
              const paramName = param.split('=')[0].trim();
              if (paramName && paramName !== 'self') {
                declaredVariables.add(paramName);
              }
            });
          }
        }
        
        // 收集类定义
        const classDefMatch = trimmedLine.match(/^class\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
        if (classDefMatch && classDefMatch[1]) {
          declaredVariables.add(classDefMatch[1]); // 类名也可作为变量使用
        }
        
        // 收集for循环中的变量
        const forLoopMatch = trimmedLine.match(/^for\s+([a-zA-Z_][a-zA-Z0-9_,\s]*)\s+in/);
        if (forLoopMatch && forLoopMatch[1]) {
          const loopVars = forLoopMatch[1].split(',').map(v => v.trim());
          loopVars.forEach(variable => {
            if (variable) declaredVariables.add(variable);
          });
        }
        
        // 收集with语句中的变量
        const withMatch = trimmedLine.match(/^with.+as\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
        if (withMatch && withMatch[1]) {
          declaredVariables.add(withMatch[1]);
        }
      });
      
      console.debug('Python已声明的变量:', Array.from(declaredVariables));
      console.debug('Python已导入的模块:', Array.from(importedModules));
      console.debug('Python已定义的函数:', Array.from(definedFunctions));
      
      // 第二遍扫描：检查语法错误和未定义变量
      lines.forEach((line, lineIndex) => {
        const trimmedLine = line.trim();
        
        // 跳过空行和注释
        if (!trimmedLine || trimmedLine.startsWith('#')) {
          return;
        }
        
        // 检查缩进问题
        const currentIndent = line.length - line.trimLeft().length;
        
        // 检查代码块开始（如if、循环、函数定义等）
        if (trimmedLine.endsWith(':')) {
          previousIndent = currentIndent;
          indentationLevel++;
        } 
        // 检查非空行的缩进是否一致
        else if (indentationLevel > 0 && currentIndent <= previousIndent && trimmedLine) {
          indentationLevel--;
        }
        
        // 缩进不是4的倍数（严重的Python PEP-8风格问题）
        if (currentIndent > 0 && currentIndent % 4 !== 0) {
          markers.push({
            severity: monaco.MarkerSeverity.Warning,
            message: '缩进应为4个空格的倍数',
            startLineNumber: lineIndex + 1,
            startColumn: 1,
            endLineNumber: lineIndex + 1,
            endColumn: currentIndent + 1,
            source: 'python-linter'
          });
        }
        
        // 检查语法错误：缺少冒号
        if ((trimmedLine.startsWith('if ') || 
             trimmedLine.startsWith('elif ') || 
             trimmedLine.startsWith('else') || 
             trimmedLine.startsWith('for ') || 
             trimmedLine.startsWith('while ') || 
             trimmedLine.startsWith('def ') || 
             trimmedLine.startsWith('class ')) && 
            !trimmedLine.endsWith(':')) {
          markers.push({
            severity: monaco.MarkerSeverity.Error,
            message: '缺少冒号',
            startLineNumber: lineIndex + 1,
            startColumn: 1,
            endLineNumber: lineIndex + 1,
            endColumn: line.length + 1,
            source: 'python-linter'
          });
        }
        
        // 检查各种括号匹配
        // 圆括号
        const leftParenCount = (trimmedLine.match(/\(/g) || []).length;
        const rightParenCount = (trimmedLine.match(/\)/g) || []).length;
        openParentheses += leftParenCount - rightParenCount;
        
        // 方括号
        const leftBracketCount = (trimmedLine.match(/\[/g) || []).length;
        const rightBracketCount = (trimmedLine.match(/\]/g) || []).length;
        openBrackets += leftBracketCount - rightBracketCount;
        
        // 大括号
        const leftBraceCount = (trimmedLine.match(/\{/g) || []).length;
        const rightBraceCount = (trimmedLine.match(/\}/g) || []).length;
        openBraces += leftBraceCount - rightBraceCount;
        
        // 检查一行内括号是否匹配（适用于简单情况）
        if (leftParenCount !== rightParenCount && 
            !trimmedLine.includes('"""') && 
            !trimmedLine.includes("'''")) {
          markers.push({
            severity: monaco.MarkerSeverity.Error,
            message: '圆括号不匹配',
            startLineNumber: lineIndex + 1,
            startColumn: 1,
            endLineNumber: lineIndex + 1,
            endColumn: line.length + 1,
            source: 'python-linter'
          });
        }
        
        if (leftBracketCount !== rightBracketCount && 
            !trimmedLine.includes('"""') && 
            !trimmedLine.includes("'''")) {
          markers.push({
            severity: monaco.MarkerSeverity.Error,
            message: '方括号不匹配',
            startLineNumber: lineIndex + 1,
            startColumn: 1,
            endLineNumber: lineIndex + 1,
            endColumn: line.length + 1,
            source: 'python-linter'
          });
        }
        
        if (leftBraceCount !== rightBraceCount && 
            !trimmedLine.includes('"""') && 
            !trimmedLine.includes("'''")) {
          markers.push({
            severity: monaco.MarkerSeverity.Error,
            message: '大括号不匹配',
            startLineNumber: lineIndex + 1,
            startColumn: 1,
            endLineNumber: lineIndex + 1,
            endColumn: line.length + 1,
            source: 'python-linter'
          });
        }
        
        // 检查未定义变量的使用
        // 避免对特定的语句（如导入、函数定义等）进行变量检查
        if (!trimmedLine.startsWith('import ') && 
            !trimmedLine.startsWith('from ') && 
            !trimmedLine.startsWith('def ') && 
            !trimmedLine.startsWith('class ')) {
          
          // 提取变量名（不包括字符串和数字等字面量）
          // 先通过空格和操作符分割行
          const words = trimmedLine.split(/[\s\+\-\*\/\%\=\(\)\[\]\{\}\,\:]+/);
          
          words.forEach(word => {
            word = word.trim();
            
            // 跳过空字符串、数字、字符串字面量
            if (!word || 
                /^\d/.test(word) || 
                word.startsWith("'") || 
                word.startsWith('"') ||
                word === 'True' || 
                word === 'False' || 
                word === 'None') {
              return;
            }
            
            // 跳过Python关键字
            if (/^(and|as|assert|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield)$/.test(word)) {
              return;
            }
            
            // 跳过对象属性访问
            if (word.includes('.')) {
              const baseName = word.split('.')[0];
              // 只检查对象名是否存在
              if (!declaredVariables.has(baseName) && !importedModules.has(baseName)) {
                markers.push({
                  severity: monaco.MarkerSeverity.Error,
                  message: `未定义的变量: ${baseName}`,
                  startLineNumber: lineIndex + 1,
                  startColumn: line.indexOf(baseName),
                  endLineNumber: lineIndex + 1,
                  endColumn: line.indexOf(baseName) + baseName.length,
                  source: 'python-linter'
                });
              }
              return;
            }
            
            // 跳过函数调用
            if (definedFunctions.has(word)) {
              return;
            }
            
            // 检查变量是否已声明
            if (!declaredVariables.has(word) && 
                !importedModules.has(word) && 
                !definedFunctions.has(word) &&
                // 额外检查确保它不是函数调用
                !line.includes(`${word}(`)) {
              
              markers.push({
                severity: monaco.MarkerSeverity.Error,
                message: `未定义的变量: ${word}`,
                startLineNumber: lineIndex + 1,
                startColumn: line.indexOf(word),
                endLineNumber: lineIndex + 1,
                endColumn: line.indexOf(word) + word.length,
                source: 'python-linter'
              });
            }
          });
        }
      });
      
      // 检查整个文件中的括号是否全部闭合
      if (openParentheses > 0) {
        markers.push({
          severity: monaco.MarkerSeverity.Error,
          message: `代码中有 ${openParentheses} 个未闭合的圆括号`,
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 2,
          source: 'python-linter'
        });
      }
      
      if (openBrackets > 0) {
        markers.push({
          severity: monaco.MarkerSeverity.Error,
          message: `代码中有 ${openBrackets} 个未闭合的方括号`,
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 2,
          source: 'python-linter'
        });
      }
      
      if (openBraces > 0) {
        markers.push({
          severity: monaco.MarkerSeverity.Error,
          message: `代码中有 ${openBraces} 个未闭合的大括号`,
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 2,
          source: 'python-linter'
        });
      }
      
      console.debug(`Python语法检查完成，检测到 ${markers.length} 个问题`);
      return markers;
    },
    
    /**
     * 为Java代码生成基本的语法错误标记
     * @param {Object} model - Monaco编辑器模型
     * @returns {Array} - 标记数组
     */
    generateJavaMarkers: function(model) {
      if (!model) return [];
      
      const markers = [];
      const code = model.getValue();
      const lines = code.split('\n');
      
      console.debug('开始自定义Java语法检查');
      
      // 收集变量和类型定义
      const declaredVariables = new Set(['System', 'String', 'Object', 'Exception', 'RuntimeException', 'Throwable', 'Integer', 'Boolean', 'Double', 'Float', 'Long', 'Short', 'Byte', 'Character']); // 常见内置类型
      const declaredClasses = new Set(['System', 'String', 'Object', 'Exception', 'RuntimeException', 'Throwable', 'Integer', 'Boolean', 'Double', 'Float']); // 内置类
      const declaredMethods = new Set(); // 用户定义的方法
      const importedClasses = new Set(); // 导入的类
      
      // 当前类/方法上下文状态
      let currentPackage = '';
      let inClass = false;
      let inMethod = false;
      let currentClassName = '';
      
      // 括号跟踪
      let openParentheses = 0;
      let openBraces = 0;
      let openBrackets = 0;
      
      // 第一遍：收集所有变量声明和类型定义
      lines.forEach((line, lineIndex) => {
        const trimmedLine = line.trim();
        
        // 跳过空行和注释
        if (!trimmedLine || 
            trimmedLine.startsWith('//') || 
            trimmedLine.startsWith('/*') || 
            trimmedLine.endsWith('*/')) {
          return;
        }
        
        // 收集包声明
        if (trimmedLine.startsWith('package ')) {
          const packageMatch = trimmedLine.match(/package\s+([a-zA-Z0-9_.]+)/);
          if (packageMatch && packageMatch[1]) {
            currentPackage = packageMatch[1];
          }
        }
        
        // 收集导入声明
        if (trimmedLine.startsWith('import ')) {
          const importMatch = trimmedLine.match(/import\s+([a-zA-Z0-9_.]+)(?:\.\*)?/);
          if (importMatch && importMatch[1]) {
            // 提取类名（最后一个点后的部分）或整个包名
            const importParts = importMatch[1].split('.');
            if (importMatch[1].endsWith('.*')) {
              // 包导入，不能直接使用
            } else {
              // 类导入，可以直接使用
              const className = importParts[importParts.length - 1];
              importedClasses.add(className);
            }
          }
        }
        
        // 收集类定义
        const classMatch = trimmedLine.match(/\bclass\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
        if (classMatch && classMatch[1]) {
          declaredClasses.add(classMatch[1]);
          currentClassName = classMatch[1];
          inClass = true;
        }
        
        // 收集方法定义
        const methodMatch = trimmedLine.match(/(?:public|private|protected|static|final)?\s+(?:[a-zA-Z_][a-zA-Z0-9_<>[\],\s]*)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
        if (methodMatch && methodMatch[1]) {
          declaredMethods.add(methodMatch[1]);
          
          // 收集方法参数
          const paramsMatch = trimmedLine.match(/\(([^)]*)\)/);
          if (paramsMatch && paramsMatch[1]) {
            // 按逗号分割参数列表
            const params = paramsMatch[1].split(',');
            params.forEach(param => {
              param = param.trim();
              if (param) {
                // 提取参数名（最后一个空格后的标识符）
                const paramParts = param.split(/\s+/);
                if (paramParts.length >= 2) {
                  const paramName = paramParts[paramParts.length - 1]
                    .replace(/\[\]/g, '') // 移除数组符号
                    .trim();
                  if (paramName && !paramName.includes('<')) {
                    declaredVariables.add(paramName);
                  }
                }
              }
            });
          }
          
          inMethod = true;
        }
        
        // 收集变量声明（包括成员变量和局部变量）
        const varDeclRegex = /(?:private|public|protected|static|final)?\s+([a-zA-Z_][a-zA-Z0-9_<>\[\],\s]*)\s+([a-zA-Z_][a-zA-Z0-9_,\s=]+)(?:;|=)/;
        const varMatch = trimmedLine.match(varDeclRegex);
        if (varMatch && varMatch[2]) {
          // 可能有多个变量声明，如 int a, b, c;
          const varNames = varMatch[2].split(',').map(v => {
            // 处理带初始化的变量，如 int a = 5
            const nameWithInit = v.trim().split('=')[0].trim();
            // 移除数组声明的方括号
            return nameWithInit.replace(/\[\]/g, '');
          });
          
          varNames.forEach(name => {
            if (name && !name.includes(' ')) {
              declaredVariables.add(name);
            }
          });
        }
        
        // 收集for循环变量声明
        const forLoopVarRegex = /for\s*\(\s*(?:int|long|float|double|short|byte|char|boolean)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=/;
        const forLoopMatch = trimmedLine.match(forLoopVarRegex);
        if (forLoopMatch && forLoopMatch[1]) {
          declaredVariables.add(forLoopMatch[1]);
        }
        
        // 检查大括号变化以跟踪块作用域
        const leftBraces = (trimmedLine.match(/\{/g) || []).length;
        const rightBraces = (trimmedLine.match(/\}/g) || []).length;
        const netBraces = leftBraces - rightBraces;
        
        // TODO: 这里可以进一步优化作用域跟踪
      });
      
      console.debug('Java已声明的变量:', Array.from(declaredVariables));
      console.debug('Java已定义的类:', Array.from(declaredClasses));
      console.debug('Java已定义的方法:', Array.from(declaredMethods));
      console.debug('Java已导入的类:', Array.from(importedClasses));
      
      // 第二遍：扫描所有行，检查基本语法错误和未定义变量
      lines.forEach((line, lineIndex) => {
        const trimmedLine = line.trim();
        
        // 跳过空行和注释
        if (!trimmedLine || 
            trimmedLine.startsWith('//') || 
            trimmedLine.startsWith('/*') || 
            trimmedLine.endsWith('*/')) {
          return;
        }
        
        // 检查1：语句缺少分号（仅检查明显应该有分号的情况）
        if (trimmedLine.length > 0 && 
            !trimmedLine.endsWith(';') && 
            !trimmedLine.endsWith('{') && 
            !trimmedLine.endsWith('}') && 
            !trimmedLine.match(/^\s*(if|for|while|switch|else|class|interface|enum)\b/) &&
            !trimmedLine.startsWith('package') &&
            !trimmedLine.startsWith('import') &&
            !trimmedLine.endsWith("*/") &&
            !trimmedLine.includes('/*') &&
            !trimmedLine.includes('//')) {
          
          // 额外检测是否是确实需要分号的语句（排除方法声明等）
          if (trimmedLine.includes('=') || 
              trimmedLine.match(/^\s*\w+\.\w+/) || // 方法调用
              trimmedLine.match(/^\s*return\b/) ||  // return语句
              trimmedLine.match(/^\s*throw\b/) ||   // throw语句
              trimmedLine.match(/^\s*break\b/) ||   // break语句
              trimmedLine.match(/^\s*continue\b/)) {  // continue语句
          
            markers.push({
              severity: monaco.MarkerSeverity.Error,
              message: '缺少分号',
              startLineNumber: lineIndex + 1,
              startColumn: 1,
              endLineNumber: lineIndex + 1,
              endColumn: line.length + 1,
              source: 'java-linter'
            });
          }
        }
        
        // 检查2：括号匹配
        // 圆括号
        const leftParenCount = (trimmedLine.match(/\(/g) || []).length;
        const rightParenCount = (trimmedLine.match(/\)/g) || []).length;
        openParentheses += leftParenCount - rightParenCount;
        
        // 大括号
        const leftBraceCount = (trimmedLine.match(/\{/g) || []).length;
        const rightBraceCount = (trimmedLine.match(/\}/g) || []).length;
        openBraces += leftBraceCount - rightBraceCount;
        
        // 方括号
        const leftBracketCount = (trimmedLine.match(/\[/g) || []).length;
        const rightBracketCount = (trimmedLine.match(/\]/g) || []).length;
        openBrackets += leftBracketCount - rightBracketCount;
        
        // 检查一行内括号是否匹配
        if (leftParenCount !== rightParenCount && 
            (trimmedLine.startsWith('if') || 
             trimmedLine.startsWith('for') || 
             trimmedLine.startsWith('while') ||
             trimmedLine.startsWith('switch'))) {
          
          markers.push({
            severity: monaco.MarkerSeverity.Error,
            message: '圆括号不匹配',
            startLineNumber: lineIndex + 1,
            startColumn: 1,
            endLineNumber: lineIndex + 1,
            endColumn: line.length + 1,
            source: 'java-linter'
          });
        }
        
        if (leftBracketCount !== rightBracketCount && trimmedLine.includes('[')) {
          markers.push({
            severity: monaco.MarkerSeverity.Error,
            message: '方括号不匹配',
            startLineNumber: lineIndex + 1,
            startColumn: 1,
            endLineNumber: lineIndex + 1,
            endColumn: line.length + 1,
            source: 'java-linter'
          });
        }
        
        // 检查3：未定义变量使用
        // 跳过特定场景的检查，如包声明、类定义、方法定义
        if (!trimmedLine.startsWith('package') &&
            !trimmedLine.startsWith('import') &&
            !trimmedLine.startsWith('class') &&
            !trimmedLine.match(/^\s*(public|private|protected|static|final|abstract|synchronized)/)) {
          
          // 这里我们只检查可能是变量使用的情况，避免误报
          // 例如，针对赋值表达式右侧、条件语句中的变量等
          if (trimmedLine.includes('=') || 
              trimmedLine.includes('if') || 
              trimmedLine.includes('while') || 
              trimmedLine.includes('return') ||
              trimmedLine.includes('System.out.println') ||
              trimmedLine.includes('print')) {
              
            // 将行拆分为单词
            const parts = trimmedLine.split(/[\s\(\)\[\]\{\}<>;:,=\+\-\*\/\%\!\&\|\^\~\?\."']+/);
            
            parts.forEach(part => {
              part = part.trim();
              
              // 忽略Java关键字、空字符串、数字等
              if (!part || /^\d/.test(part) || 
                  /^(abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|native|new|package|private|protected|public|return|short|static|strictfp|super|switch|synchronized|this|throw|throws|transient|try|void|volatile|while|true|false|null)$/.test(part)) {
                return;
              }
              
              // 忽略已声明的变量、类型、方法等
              if (declaredVariables.has(part) || 
                  declaredClasses.has(part) || 
                  declaredMethods.has(part) || 
                  importedClasses.has(part)) {
                return;
              }
              
              // 忽略一些明显非变量的情况
              if (part.includes('.') || 
                  part.length < 2 || 
                  part === 'main' || 
                  /^[A-Z]/.test(part)) { // 可能是未导入的类名
                return;
              }
              
              // 检测可能的未定义变量
              if (line.includes(part) && 
                  !line.includes(`${part}(`) && // 不是方法调用
                  !line.match(new RegExp(`\\b(int|float|double|long|short|byte|char|boolean|String|void)\\s+${part}\\b`))) { // 不是变量声明
                
                // 这是可能的未定义变量
                markers.push({
                  severity: monaco.MarkerSeverity.Error,
                  message: `可能未声明的变量: ${part}`,
                  startLineNumber: lineIndex + 1,
                  startColumn: line.indexOf(part),
                  endLineNumber: lineIndex + 1,
                  endColumn: line.indexOf(part) + part.length,
                  source: 'java-linter'
                });
              }
            });
          }
        }
      });
      
      // 检查代码结尾的括号是否全部闭合
      if (openParentheses > 0) {
        markers.push({
          severity: monaco.MarkerSeverity.Error,
          message: `代码中有 ${openParentheses} 个未闭合的圆括号`,
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 2,
          source: 'java-linter'
        });
      }
      
      if (openBraces > 0) {
        markers.push({
          severity: monaco.MarkerSeverity.Error,
          message: `代码中有 ${openBraces} 个未闭合的大括号`,
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 2,
          source: 'java-linter'
        });
      }
      
      if (openBrackets > 0) {
        markers.push({
          severity: monaco.MarkerSeverity.Error,
          message: `代码中有 ${openBrackets} 个未闭合的方括号`,
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 2,
          source: 'java-linter'
        });
      }
      
      console.debug(`Java语法检查完成，检测到 ${markers.length} 个问题`);
      return markers;
    },
    
    /**
     * 将Monaco标记转换为应用的问题格式
     * @param {Array} markers - Monaco标记数组
     * @returns {Array} - 应用格式的问题数组
     */
    convertMarkerToProblems: function(markers) {
      if (!markers || !Array.isArray(markers)) {
        return [];
      }
      
      // 获取当前语言
      const languageId = this.currentModel ? this.currentModel.getLanguageId() : 'unknown';
      
      return markers.map(marker => {
        // 确定问题严重程度
        let severity;
        switch(marker.severity) {
          case monaco.MarkerSeverity.Error:
            severity = 'error';
            break;
          case monaco.MarkerSeverity.Warning:
            severity = 'warning';
            break;
          case monaco.MarkerSeverity.Info:
            severity = 'info';
            break;
          case monaco.MarkerSeverity.Hint:
            severity = 'hint';
            break;
          default:
            severity = 'info';
        }
        
        // 根据语言类型优化错误消息
        let message = marker.message || '未知错误';
        switch(languageId) {
          case 'c':
          case 'cpp':
            // 优化C/C++错误消息，去除冗余前缀
            message = message.replace(/^error: /i, '');
            break;
          case 'python':
            // 优化Python错误消息
            message = message.replace(/^SyntaxError: /i, '');
            break;
          case 'java':
            // 优化Java错误消息
            message = message.replace(/^error: /i, '');
            break;
        }
        
        // 返回应用格式的问题对象
        return {
          severity: severity,
          message: message,
          file: this.currentFile,
          line: marker.startLineNumber,
          column: marker.startColumn,
          endLine: marker.endLineNumber,
          endColumn: marker.endColumn,
          code: marker.code,
          source: marker.source || languageId, // 添加问题来源，用于区分不同语言
          languageId: languageId // 添加语言标识
        };
      });
    },
    
    /**
     * 更新Vue应用的问题状态
     * @param {Array} problems - 问题数组
     */
    updateAppProblems: function(problems) {
      console.debug(`尝试更新应用中的问题，问题数量: ${problems.length}`);
      
      // 确保problems是一个有效数组
      if (!Array.isArray(problems)) {
        console.error('problems不是有效的数组');
        problems = [];
      }
      
      // 检查Vue应用实例是否存在
      if (window.app && window.app.$data) {
        // 检查是否与当前问题相同（避免不必要的更新）
        const currentProblems = window.app.$data.problems || [];
        
        // 比较问题是否相同
        if (this._areProblemsEqual(currentProblems, problems)) {
          console.debug('问题未变化，跳过更新');
          return;
        }
        
        console.debug('Vue应用实例存在，更新problems数组');
        
        // 更新问题列表
        try {
          // 直接设置problems属性
          window.app.$data.problems = problems;
          
          console.debug(`更新了 ${problems.length} 个问题到Vue应用`);
          
          // 确保问题标签显示
          const problemsTab = document.querySelector('.panel-tabs .tab[data-tab="problems"]');
          if (problemsTab && problems.length > 0) {
            problemsTab.classList.add('has-problems');
            console.debug('已添加has-problems类到问题标签');
          }
        } catch (error) {
          console.error('更新Vue应用problems时出错:', error);
        }
        
        // 使用节流控制更新问题面板频率
        this.throttledUpdateProblemPanel(problems);
      } else {
        console.warn('Vue应用实例不存在，无法更新problems');
        
        // 虽然Vue应用不存在，但仍然尝试更新问题面板
        this.throttledUpdateProblemPanel(problems);
      }
    },
    
    /**
     * 比较两个问题数组是否相同
     * @param {Array} problems1 - 第一个问题数组
     * @param {Array} problems2 - 第二个问题数组
     * @returns {boolean} - 是否相同
     */
    _areProblemsEqual: function(problems1, problems2) {
      // 快速检查数量是否相同
      if (problems1.length !== problems2.length) {
        return false;
      }
      
      // 简单检查主要字段是否相同
      for (let i = 0; i < problems1.length; i++) {
        const p1 = problems1[i];
        const p2 = problems2[i];
        
        if (p1.message !== p2.message || 
            p1.severity !== p2.severity || 
            p1.line !== p2.line || 
            p1.file !== p2.file) {
          return false;
        }
      }
      
      return true;
    },
    
    /**
     * 节流控制更新问题面板的频率
     * @param {Array} problems - 问题数组
     */
    throttledUpdateProblemPanel: function(problems) {
      // 记录上次更新时间
      const now = Date.now();
      
      // 如果距离上次更新不足1秒，则延迟更新
      if (this._lastPanelUpdateTime && now - this._lastPanelUpdateTime < 1000) {
        // 清除现有的更新定时器
        if (this._panelUpdateTimer) {
          clearTimeout(this._panelUpdateTimer);
          this._panelUpdateTimer = null;
        }
        
        // 设置新的定时器，延迟更新
        this._panelUpdateTimer = setTimeout(() => {
          this.forceUpdateProblemPanel(problems);
          this._lastPanelUpdateTime = Date.now();
        }, 1000 - (now - this._lastPanelUpdateTime));
        
        return;
      }
      
      // 直接更新并记录时间
      this.forceUpdateProblemPanel(problems);
      this._lastPanelUpdateTime = now;
    },
    
    /**
     * 强制更新问题面板，不依赖Vue应用
     * @param {Array} problems - 问题数组
     */
    forceUpdateProblemPanel: function(problems) {
      console.debug('尝试强制更新问题面板...');
      
      // 检查ProblemsPanelManager是否存在
      if (window.ProblemsPanelManager) {
        if (typeof window.ProblemsPanelManager.updateProblemsList === 'function') {
          try {
            // 确保问题面板能够访问到问题数据
            // 如果Vue实例不存在，则临时创建一个全局变量
            if (!window.app || !window.app.$data) {
              console.debug('Vue实例不存在，创建临时app对象');
              window._tempAppData = { problems: problems };
              
              // 临时代理原始的checkVueApp方法
              const originalCheckVueApp = window.ProblemsPanelManager.checkVueApp;
              window.ProblemsPanelManager.checkVueApp = function() {
                return true; // 临时返回true
              };
              
              // 临时代理原始的getVueApp方法（如果存在）
              if (window.ProblemsPanelManager.getVueApp) {
                const originalGetVueApp = window.ProblemsPanelManager.getVueApp;
                window.ProblemsPanelManager.getVueApp = function() {
                  return { $data: window._tempAppData };
                };
              }
              
              // 在面板上显示问题
              console.debug('使用临时app对象调用updateProblemsList');
              window.ProblemsPanelManager.updateProblemsList();
              
              // 恢复原始方法
              window.ProblemsPanelManager.checkVueApp = originalCheckVueApp;
              if (window.ProblemsPanelManager.getVueApp) {
                window.ProblemsPanelManager.getVueApp = originalGetVueApp;
              }
              
              // 清理临时变量
              delete window._tempAppData;
            } else {
              // 正常调用问题面板更新方法
              console.debug('使用正常Vue实例调用updateProblemsList');
              window.ProblemsPanelManager.updateProblemsList();
            }
            
            console.debug('问题面板更新完成');
          } catch (error) {
            console.error('强制更新问题面板时出错:', error);
          }
        } else {
          console.warn('ProblemsPanelManager存在，但没有updateProblemsList方法');
        }
      } else {
        console.warn('ProblemsPanelManager不存在，无法更新问题面板');
      }
    },
    
    /**
     * 手动强制触发验证
     * 可以从浏览器控制台调用: window.MonacoValidator.forceValidate()
     */
    forceValidate: function() {
      console.log('手动触发代码验证...');
      
      if (!this.editor || !this.currentModel) {
        console.log('编辑器或模型未初始化，尝试自动连接...');
        // 尝试自动连接编辑器
        if (this.connect()) {
          console.log('自动连接成功，继续验证');
          // 延迟一点时间，让编辑器完全初始化
          setTimeout(() => this.forceValidate(), 500);
        } else {
          console.error('无法自动连接编辑器，验证失败');
        }
        return false;
      }
      
      // 清除所有计时器，确保不会重复验证
      if (this._updateProblemsTimer) {
        clearTimeout(this._updateProblemsTimer);
        this._updateProblemsTimer = null;
      }
      
      if (this._panelUpdateTimer) {
        clearTimeout(this._panelUpdateTimer);
        this._panelUpdateTimer = null;
      }
      
      try {
        // 获取当前语言
        const languageId = this.currentModel.getLanguageId();
        console.log(`当前语言: ${languageId}`);
        
        // 直接根据语言调用相应的验证函数
        let markers = [];
        
        if (languageId === 'c' || languageId === 'cpp') {
          console.info('强制验证C/C++代码...');
          markers = this.generateCStyleMarkers(this.currentModel);
        } else if (languageId === 'python') {
          console.info('强制验证Python代码...');
          markers = this.generatePythonMarkers(this.currentModel);
        } else if (languageId === 'java') {
          console.info('强制验证Java代码...');
          markers = this.generateJavaMarkers(this.currentModel);
        } else {
          // 尝试从Monaco获取标记
          console.info(`尝试获取Monaco内置验证器的标记...`);
          const allMarkers = monaco.editor.getModelMarkers();
          markers = allMarkers.filter(marker => 
            marker.resource && marker.resource.toString() === this.currentModel.uri.toString()
          );
        }
        
        console.log(`验证生成了 ${markers.length} 个标记`);
        
        // 将标记转换为问题并更新应用
        if (markers.length > 0) {
          const problems = this.convertMarkerToProblems(markers);
          console.debug(`转换生成了 ${problems.length} 个问题`);
          this.updateAppProblems(problems);
        } else {
          console.log('没有检测到问题');
          // 清空问题面板
          if (window.app && window.app.$data) {
            window.app.$data.problems = [];
          }
          if (window.ProblemsPanelManager && typeof window.ProblemsPanelManager.updateProblemsList === 'function') {
            window.ProblemsPanelManager.updateProblemsList();
          }
        }
        
        console.log('验证完成');
        return true;
      } catch (error) {
        console.error('强制验证时出错:', error);
        return false;
      }
    },
    
    // 测试函数，用于手动生成和显示问题
    testProblemDetection: function() {
      console.log('测试问题检测功能...');
      
      // 创建测试问题
      const testProblems = [
        {
          severity: 'error',
          message: '测试错误: 缺少分号',
          file: '当前文件',
          line: 5,
          column: 10,
          endLine: 5,
          endColumn: 15,
          source: 'test-linter',
          languageId: 'c'
        },
        {
          severity: 'warning',
          message: '测试警告: 未使用的变量',
          file: '当前文件',
          line: 8,
          column: 5,
          endLine: 8,
          endColumn: 10,
          source: 'test-linter',
          languageId: 'c'
        },
        {
          severity: 'error',
          message: '测试错误: 未闭合的括号',
          file: '当前文件',
          line: 12,
          column: 15,
          endLine: 12,
          endColumn: 20,
          source: 'test-linter',
          languageId: 'c'
        }
      ];
      
      console.log(`创建了 ${testProblems.length} 个测试问题`);
      
      // 清除任何现有的计时器
      if (this._updateProblemsTimer) {
        clearTimeout(this._updateProblemsTimer);
        this._updateProblemsTimer = null;
      }
      
      if (this._panelUpdateTimer) {
        clearTimeout(this._panelUpdateTimer);
        this._panelUpdateTimer = null;
      }
      
      // 直接更新应用中的problems
      if (window.app && window.app.$data) {
        console.log('直接更新Vue应用中的问题...');
        window.app.$data.problems = testProblems;
      }
      
      // 使用问题面板管理器更新UI
      if (window.ProblemsPanelManager && typeof window.ProblemsPanelManager.updateProblemsList === 'function') {
        console.log('调用ProblemsPanelManager更新问题列表...');
        window.ProblemsPanelManager.updateProblemsList();
        
        // 确保"问题"标签显示
        try {
          const problemsTab = document.querySelector('.panel-tabs .tab[data-tab="problems"]');
          if (problemsTab) {
            console.log('添加has-problems类到问题标签');
            problemsTab.classList.add('has-problems');
            
            // 如果有点击事件，模拟点击切换到问题面板
            console.log('切换到问题面板');
            if (window.app && typeof window.app.switchTab === 'function') {
              window.app.switchTab('problems');
            }
          }
        } catch (error) {
          console.error('切换到问题面板时出错:', error);
        }
      }
      
      return '测试问题已创建，请查看问题面板';
    }
  };
  
  // 导出到全局作用域
  window.MonacoValidator = MonacoValidator;
  
  // 添加手动初始化函数，方便调试
  window.initializeMonacoValidator = function() {
    console.log('手动初始化Monaco验证器...');
    MonacoValidator.connect();
  };
  
  // 添加问题测试的快捷函数
  window.testProblemDetection = function() {
    return MonacoValidator.testProblemDetection();
  };
  
  // 监听编辑器就绪事件来初始化
  document.addEventListener('editor-ready', () => {
    console.info('编辑器就绪事件触发，尝试连接验证器...');
    MonacoValidator.connect();
    
    // 确保问题面板样式已初始化
    if (window.ProblemsPanelManager && typeof window.ProblemsPanelManager.addProblemTabStyles === 'function') {
      window.ProblemsPanelManager.addProblemTabStyles();
      console.info('问题面板样式已初始化');
    }
    
    // 添加控制台提示，告诉用户如何手动触发验证
    console.info('提示: 可以在控制台使用 window.MonacoValidator.forceValidate() 手动触发代码验证');
    console.info('也可以使用 window.initializeMonacoValidator() 手动初始化验证器');
    console.info('如需测试问题面板功能，可以使用 window.MonacoValidator.testProblemDetection()');
  });
  
  // 在DOM加载完成后尝试自动初始化，但不会自动验证
  document.addEventListener('DOMContentLoaded', () => {
    // 延迟执行，确保编辑器有足够时间初始化
    setTimeout(() => {
      if (!MonacoValidator.editor) {
        console.log('DOMContentLoaded后，尝试自动连接验证器');
        MonacoValidator.connect();
      }
    }, 1000);
  });
  
  // 测试函数，用于手动测试问题面板
  window.testProblemPanel = function() {
    console.log('手动测试问题面板...');
    
    // 创建测试问题
    const testProblems = [
      {
        severity: 'error',
        message: '测试错误: 缺少分号',
        file: '当前文件',
        line: 5,
        column: 10,
        endLine: 5,
        endColumn: 15,
        source: 'test-linter',
        languageId: 'c'
      },
      {
        severity: 'warning',
        message: '测试警告: 未使用的变量',
        file: '当前文件',
        line: 8,
        column: 5,
        endLine: 8,
        endColumn: 10,
        source: 'test-linter',
        languageId: 'c'
      },
      {
        severity: 'error',
        message: '测试错误: 未闭合的括号',
        file: '当前文件',
        line: 12,
        column: 15,
        endLine: 12,
        endColumn: 20,
        source: 'test-linter',
        languageId: 'c'
      }
    ];
    
    console.log(`创建了 ${testProblems.length} 个测试问题`);
    
    // 直接尝试更新Vue应用中的problems
    if (window.app && window.app.$data) {
      console.log('直接更新Vue应用中的问题...');
      window.app.$data.problems = testProblems;
    }
    
    // 使用问题面板管理器更新UI
    if (window.ProblemsPanelManager && typeof window.ProblemsPanelManager.updateProblemsList === 'function') {
      console.log('调用ProblemsPanelManager更新问题列表...');
      window.ProblemsPanelManager.updateProblemsList();
      
      // 确保"问题"标签显示
      try {
        const problemsTab = document.querySelector('.panel-tabs .tab[data-tab="problems"]');
        if (problemsTab) {
          console.log('添加has-problems类到问题标签');
          problemsTab.classList.add('has-problems');
          
          // 如果有点击事件，模拟点击切换到问题面板
          console.log('切换到问题面板');
          if (window.app && typeof window.app.switchTab === 'function') {
            window.app.switchTab('problems');
          }
        }
      } catch (error) {
        console.error('切换到问题面板时出错:', error);
      }
    }
    
    return '测试问题已创建，请查看问题面板';
  };
  
  // 页面加载后立即尝试初始化验证器和按钮
  document.addEventListener('DOMContentLoaded', () => {
    console.info('页面已加载，5秒后自动初始化验证器...');
    
    // 延迟5秒后初始化，确保编辑器和其他组件都已加载完成
    setTimeout(() => {
      if (!window.MonacoValidator.editor) {
        console.info('自动初始化Monaco验证器');
        window.MonacoValidator.connect();
        
        // 再等待2秒进行一次强制验证
        setTimeout(() => {
          console.info('自动执行首次验证');
          window.MonacoValidator.forceValidate();
        }, 2000);
      }
    }, 5000);
  });
  
  // 添加测试C/C++错误检测的工具函数
  window.testCErrorDetection = function() {
    console.log('测试C/C++错误检测功能...');
    
    // 获取当前编辑器文本
    const model = window.MonacoValidator.currentModel;
    if (!model) {
      console.error('无法获取编辑器模型');
      return '错误：编辑器未初始化';
    }
    
    const languageId = model.getLanguageId();
    if (languageId !== 'c' && languageId !== 'cpp') {
      console.warn(`当前语言不是C/C++，而是${languageId}`);
    }
    
    // 强制执行验证
    const markers = window.MonacoValidator.generateCStyleMarkers(model);
    console.log(`检测到 ${markers.length} 个C/C++问题:`);
    
    markers.forEach((marker, index) => {
      console.log(`[${index+1}] 行 ${marker.startLineNumber}: ${marker.message}`);
    });
    
    // 将标记转换为问题并更新
    if (markers.length > 0) {
      const problems = window.MonacoValidator.convertMarkerToProblems(markers);
      window.MonacoValidator.updateAppProblems(problems);
      return `检测到${markers.length}个问题，已更新到问题面板`;
    } else {
      return '没有检测到任何问题';
    }
  };
  
  // 为window对象添加直接访问验证器的方法
  window.validateCode = function() {
    return window.MonacoValidator.forceValidate();
  };
  
  console.info('Monaco验证器模块已完全加载');
})(); 