/**
 * 算法可视化器
 * 负责处理动画绘制和控制
 */

// 检查全局作用域中是否已存在AlgorithmVisualizer类
if (!window.AlgorithmVisualizer) {
    
// 立即向控制台报告已开始加载AlgorithmVisualizer类
console.info('正在加载AlgorithmVisualizer类...');

class AlgorithmVisualizer {
    constructor(containerId, config) {
        this.canvas = document.getElementById(containerId);
        this.ctx = this.canvas.getContext('2d');
        this.config = config || this.getDefaultConfig();
        this.animationState = this.getInitialState();
        this._animationFrameId = null;
        this._stepTimer = null;
        this._handleMouseMove = null;
        this._debug = typeof window !== 'undefined' && window._debug === true;
        
        // 添加算法生成器映射
        this.algorithmGenerators = new Map();
        
        // 初始化
        this.resizeCanvas();
        this.setupMouseInteractions();
        
        // 检查Vue实例中是否已选择算法
        if (window.app && window.app.selectedAlgorithm) {
            const selectedAlgo = window.app.selectedAlgorithm;
            if (this._debug) {
                console.debug(`检测到已选择算法: ${selectedAlgo}`);
            }
            
            // 如果选择的是数据结构算法，立即设置正确的类型
            if (selectedAlgo === 'linkedList' || selectedAlgo === 'binaryTree') {
                if (this._debug) {
                    console.debug(`设置${selectedAlgo}类型视图`);
                }
                this.animationState.type = selectedAlgo;
                this.animationState.currentArray = [];
                
                // 设置对应的初始化数据
                if (selectedAlgo === 'linkedList') {
                    this.initLinkedListState();
                } else {
                    this.initBinaryTreeState();
                }
                
                // 延迟绘制确保画布已准备好
                setTimeout(() => this.drawVisualization(), 50);
            }
        }
        
        // 事件监听
        window.addEventListener('resize', this.resizeCanvas.bind(this));
        
        // 添加动画控制相关属性
        this.animationSpeed = 500; // 毫秒
        this.currentStep = 0;
        this.steps = [];
        this.isAnimating = false;
        this.isPaused = false;
        this.animationPromise = null;
    }
    
    // 初始化链表状态
    initLinkedListState() {
        // 生成示例链表数据
        const sampleData = [
            { id: 0, value: 10, next: 1 },
            { id: 1, value: 20, next: 2 },
            { id: 2, value: 30, next: 3 },
            { id: 3, value: 40, next: 4 },
            { id: 4, value: 50, next: null }
        ];

        // 更新动画状态
        this.animationState = {
            ...this.animationState,
            type: 'linkedList',
            nodes: sampleData,
            current: null,
            highlight: [],
            description: '链表初始化完成，使用操作按钮进行交互'
        };

        // 立即绘制链表
        this.drawVisualization();
    }
    
    // 添加链表演示动画
    startLinkedListDemo() {
        let currentIndex = 0;
        const nodes = this.animationState.nodes;
        
        const animate = () => {
            if (currentIndex >= nodes.length) {
                currentIndex = 0;
                this.animationState.highlight = [];
                this.animationState.current = null;
                this.animationState.description = '链表遍历完成';
            } else {
                this.animationState.current = nodes[currentIndex].id;
                this.animationState.highlight = [nodes[currentIndex].id];
                this.animationState.description = `正在访问节点 ${nodes[currentIndex].value}`;
                currentIndex++;
            }
            
            this.drawVisualization();
            
            // 继续动画
            setTimeout(() => {
                requestAnimationFrame(animate);
            }, 1000); // 每秒更新一次
        };
        
        // 开始动画
        animate();
    }
    
    // 初始化二叉树状态
    initBinaryTreeState() {
        this.animationState.tree = null;
        this.animationState.current = null;
        this.animationState.highlight = [];
        this.animationState.path = [];
        this.animationState.description = '选择二叉树算法，点击开始按钮查看演示';
    }
    
    // 获取默认配置
    getDefaultConfig() {
        return {
            animation: {
                duration: 1200,
                flashFrequency: 4
            },
            canvas: {
                padding: 60,
                headerHeight: 100,
                textMargin: 30
            },
            bars: {
                maxWidth: 40,
                minSpacing: 10,
                widthRatio: 0.7,
                spacingRatio: 0.3,
                cornerRadius: 0,
                heightRatio: 0.8
            },
            colors: {
                default: { 
                    base: '#505050', 
                    comparing: '#FFA500', 
                    swapping: '#FFA500', 
                    sorted: '#4CAF50' 
                }
            }
        };
    }
    
    // 获取初始状态
    getInitialState() {
        return {
            currentStep: 0,
            totalSteps: 0,
            comparing: [],
            swapping: [],
            sorted: [],
            currentArray: [],
            previousArray: [],
            animationProgress: 0,
            currentIndex: -1,
            compareIndex: -1,
            description: '',
            highlightRange: [],
            type: '', // 不预设类型，根据选择设置
            nodes: null,    // 链表节点
            current: null,  // 当前节点ID
            highlight: [],  // 高亮节点
            tree: null,      // 二叉树根节点
            countingArray: undefined,  // 计数排序的计数数组
            outputArray: undefined,    // 计数排序的输出数组
            phase: 'initial',          // 计数排序的阶段
            highlightCountingIndex: -1,  // 计数数组中高亮的索引
            highlightOutputIndex: -1,     // 输出数组中高亮的索引
            path: []
        };
    }
    
    // 调整Canvas大小
    resizeCanvas(width, height) {
        const canvas = this.canvas;
        if (!canvas) {
            console.warn('Canvas元素不存在，无法调整大小');
            return;
        }
        
        // 使用传入的尺寸或保持当前尺寸
        const newWidth = width || canvas.width;
        const newHeight = height || canvas.height;
        
        // 只在尺寸发生实际变化时更新
        if (canvas.width !== newWidth || canvas.height !== newHeight) {
            canvas.width = newWidth;
            canvas.height = newHeight;
            
            // 重绘当前状态
            this.redrawCurrentState();
        }
    }
    
    // 重绘当前状态
    redrawCurrentState() {
        if (this.animationState) {
            if (this.animationState.currentArray && this.animationState.currentArray.length > 0) {
                this.drawVisualization({
                    type: this.animationState.comparing.length > 0 ? 'compare' :
                        this.animationState.swapping.length > 0 ? 'swap' : 'normal'
                });
            } else if (this.animationState.type === 'linkedList' && this.animationState.nodes ||
                      this.animationState.type === 'binaryTree' && this.animationState.tree) {
                this.drawVisualization();
            }
        }
    }
    
    // 清除画布
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // 设置动画状态
    setAnimationState(state) {
        this.animationState = {...this.animationState, ...state};
    }
    
    // 绘制可视化
    drawVisualization(options = {}) {
        // 在每次绘制前检查算法类型
        const typeUpdated = this.checkSelectedAlgorithmType();
        
        this.clearCanvas();

        // 根据当前步骤类型选择绘制方法
        if (this.animationState.type === 'linkedList') {
            if (!this.animationState.nodes || this.animationState.nodes.length === 0) {
                this.drawNoDataMessage();
                return;
            }
            this.drawLinkedList();
        } else if (this.animationState.type === 'binaryTree') {
            if (!this.animationState.tree) {
                this.drawNoDataMessage();
                return;
            }
            this.drawBinaryTree();
        } else {
            // 默认绘制排序算法
            if (!this.animationState.currentArray || this.animationState.currentArray.length === 0) {
                this.drawNoDataMessage();
                return;
            }
            
            // 检查是否为计数排序
            if (this.animationState.countingArray !== undefined) {
                this.drawCountingSort();
                return;
            }
            
            // 检查是否有自定义视觉效果
            if (this.animationState.custom) {
                this.drawSortingWithCustomEffects(
                    this.animationState.currentArray,
                    this.animationState.currentIndex,
                    this.animationState.compareIndex
                );
            } else {
                this.drawSortingArray(
                    this.animationState.currentArray,
                    this.animationState.currentIndex,
                    this.animationState.compareIndex
                );
            }
        }
        
        // 绘制描述文本
        this.drawDescription();
    }
    
    // 通用绘制标题和说明
    drawHeader() {
        if (this.animationState.description) {
            this.ctx.font = '14px Arial';
            this.ctx.fillStyle = '#333';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                this.animationState.description,
                this.canvas.width / 2,
                60
            );
        }
    }
    
    // 通用绘制文本的方法
    drawText(text, x, y, options = {}) {
        const ctx = this.ctx;
        ctx.save();
        
        const {
            fontSize = '14px',
            fontFamily = 'Arial',
            fontStyle = '', 
            fillStyle = '#333',
            textAlign = 'center',
            textBaseline = 'middle'
        } = options;
        
        ctx.font = `${fontStyle} ${fontSize} ${fontFamily}`;
        ctx.fillStyle = fillStyle;
        ctx.textAlign = textAlign;
        ctx.textBaseline = textBaseline;
        ctx.fillText(text, x, y);
        
        ctx.restore();
    }
    
    // 通用绘制节点的方法
    drawNode(x, y, radius, options = {}) {
        const {
            fillStyle = '#505050',
            strokeStyle = '#333',
            lineWidth = 1,
            alpha = 1
        } = options;
        
        const ctx = this.ctx;
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // 绘制节点圆形
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        
        // 填充
        if (fillStyle) {
            if (typeof fillStyle === 'string') {
                ctx.fillStyle = fillStyle;
            } else {
                // 支持渐变对象
                ctx.fillStyle = fillStyle;
            }
            ctx.fill();
        }
        
        // 描边
        if (strokeStyle) {
            ctx.strokeStyle = strokeStyle;
            ctx.lineWidth = lineWidth;
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    // 绘制链表
    drawLinkedList() {
        const { nodes, current, highlight } = this.animationState;
        if (!nodes || !nodes.length) return;
        
        // 先绘制描述文字
        this.drawDescription();
        
        const ctx = this.ctx;
        const nodeRadius = 20;
        const startX = 80; // 起始X坐标
        const startY = this.canvas.height / 2; // 垂直居中
        const spacing = 100; // 节点间距
        
        // 计算链表总宽度
        const totalWidth = (nodes.length - 1) * spacing;
        
        // 如果总宽度超过画布宽度，调整间距
        const availableWidth = this.canvas.width - (startX * 2);
        const adjustedSpacing = totalWidth > availableWidth ? 
            availableWidth / (nodes.length - 1) : spacing;
        
        // 绘制所有节点
        nodes.forEach((node, i) => {
            const x = startX + i * adjustedSpacing;
            const y = startY;
            
            // 判断节点状态
            const isHighlighted = highlight.includes(node.id);
            const isActive = current === node.id;
            
            // 设置节点颜色
            let fillColor = '#505050';
            if (isHighlighted || isActive) {
                fillColor = '#FFA500';
            }
            
            // 绘制节点
            this.drawNode(x, y, nodeRadius, {
                fillStyle: fillColor,
                strokeStyle: '#333',
                lineWidth: 2
            });
            
            // 绘制节点值
            this.drawText(node.value.toString(), x, y, {
                fillStyle: '#FFFFFF',
                fontSize: '14px'
            });
            
            // 绘制head/tail标记
            if (i === 0) {
                this.drawText('head/' + i, x, y - nodeRadius - 10, {
                    fillStyle: '#FF0000',
                    fontSize: '12px'
                });
            } else if (i === nodes.length - 1) {
                this.drawText('tail/' + i, x, y - nodeRadius - 10, {
                    fillStyle: '#FF0000',
                    fontSize: '12px'
                });
            }
            
            // 绘制箭头连接
            if (node.next !== null && i < nodes.length - 1) {
                const nextX = startX + (i + 1) * adjustedSpacing;
                const arrowStartX = x + nodeRadius;
                const arrowEndX = nextX - nodeRadius;
                
                this.drawArrow(arrowStartX, y, arrowEndX, y, {
                    strokeStyle: '#333',
                    lineWidth: 2,
                    arrowSize: 8
                });
            }
        });
    }
    
    // 通用绘制箭头方法
    drawArrow(fromX, fromY, toX, toY, options = {}) {
        const {
            strokeStyle = '#333',
            lineWidth = 2,
            arrowSize = 10,
            fillStyle = '#333'
        } = options;
        
        const ctx = this.ctx;
        ctx.save();
        
        // 绘制线条
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
        
        // 计算箭头角度
        const angle = Math.atan2(toY - fromY, toX - fromX);
        
        // 绘制箭头头部
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(
            toX - arrowSize * Math.cos(angle - Math.PI / 6),
            toY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            toX - arrowSize * Math.cos(angle + Math.PI / 6),
            toY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = fillStyle;
        ctx.fill();
        
        ctx.restore();
    }
    
    // 绘制二叉树
    drawBinaryTree() {
        const { tree } = this.animationState;
        if (!tree) {
            return;
        }

        // 替换原来的binaryTreeAnimator.draw调用
        // 创建临时的BinaryTreeAnimator用于绘制
        if (typeof BinaryTreeAnimator === 'function') {
            const tempAnimator = new BinaryTreeAnimator(this.ctx, this.config);
            tempAnimator.draw(this.animationState);
        } else {
            // 如果BinaryTreeAnimator不可用，显示提示信息
            this.drawText('二叉树可视化需要BinaryTreeAnimator支持', this.canvas.width / 2, this.canvas.height / 2, {
                fillStyle: '#FF0000',
                fontSize: '16px',
                textAlign: 'center'
            });
        }
    }
    
    // 添加缓动函数
    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
    
    // 添加计算树信息的辅助方法
    calculateTreeInfo(root) {
        const levelWidths = [];
        let maxDepth = 0;
        
        const traverse = (node, level) => {
            if (!node) return;
            
            maxDepth = Math.max(maxDepth, level);
            levelWidths[level] = (levelWidths[level] || 0) + 1;
            
            traverse(node.left, level + 1);
            traverse(node.right, level + 1);
        };
        
        traverse(root, 0);
        
        return {
            depth: maxDepth,
            levelWidths: levelWidths
        };
    }
    
    // 添加绘制直线的辅助方法
    drawLine(x1, y1, x2, y2, color = '#333333', width = 1) {
        const ctx = this.ctx;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();
        ctx.restore();
    }
    
    // 添加无数据提示绘制方法
    drawNoDataMessage() {
        const ctx = this.ctx;
        ctx.fillStyle = '#f8f8f8';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 根据当前算法类型显示不同的提示信息
        let message = '请选择算法';
        
        if (this.animationState && this.animationState.type) {
            switch (this.animationState.type) {
                case 'linkedList':
                    message = '点击开始按钮查看链表演示';
                    break;
                case 'binaryTree':
                    message = '点击开始按钮查看二叉树演示';
                    break;
                case 'sorting':
                    message = '点击开始按钮查看排序演示';
                    break;
                default:
                    message = '请选择算法';
            }
        }
        
        this.drawText(message, this.canvas.width/2, this.canvas.height/2, {
            fontSize: '16px',
            fillStyle: '#666666'
        });
    }
    
    // 重置动画状态
    resetAnimationState(originalArray) {
        // 取消任何正在进行的动画
        if (this._animationFrameId) {
            cancelAnimationFrame(this._animationFrameId);
            this._animationFrameId = null;
        }
        
        // 完全重置状态
        this.animationState = this.getInitialState();
        
        if (originalArray && originalArray.length > 0) {
            // 添加一个标志，用于检测是否有超大值被调整
            let hasAdjustedValues = false;
            
            // 确保数组元素为数字类型且在合理范围内
            const cleanArray = originalArray.map(item => {
                // 确保是数字
                const num = Number(item);
                // 如果是NaN或者负数，用一个随机的正数替代
                if (isNaN(num) || num < 0) {
                    return Math.floor(Math.random() * 50) + 5;
                }
                // 如果数值太大，则缩放到合理范围并记录调整
                if (num > 500) {
                    hasAdjustedValues = true;
                    return Math.floor(num % 100) + 10;
                }
                return num;
            });
            
            // 如果有值被调整，显示提示
            if (hasAdjustedValues && this.showValueLimitWarning) {
                this.showValueLimitWarning();
            }
            
            // 完全清空当前数组后再添加新元素，避免残留
            this.animationState.currentArray = [...cleanArray];
            this.animationState.previousArray = [...cleanArray];
            
            // 重置动画相关状态
            this.animationState.animationProgress = 0;
            this.animationState.comparing = [];
            this.animationState.swapping = [];
            this.animationState.sorted = [];
            this.animationState.highlightRange = [];
            this.animationState.currentIndex = -1;
            this.animationState.compareIndex = -1;
            
            // 强制完全清除画布
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // 清除画布并立即绘制初始状态
            this.drawVisualization({ type: 'init' });
        } else {
            // 如果没有提供数组或数组为空，显示提示信息
            this.clearCanvas();
            this.drawNoDataMessage();
        }
    }
    
    // 添加新方法：显示数值超出限制的警告
    showValueLimitWarning() {
        // 创建警告元素
        const warningElement = document.createElement('div');
        warningElement.className = 'value-limit-warning';
        warningElement.style.cssText = `
            position: absolute;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(255, 200, 0, 0.9);
            color: #333;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 14px;
            z-index: 1000;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            transition: opacity 0.5s;
        `;
        warningElement.textContent = '提示：数组中有超过500的值已被自动调整。建议使用1-500范围内的值。';
        
        // 添加到canvas容器
        const canvasContainer = this.canvas.parentElement;
        canvasContainer.style.position = 'relative';
        canvasContainer.appendChild(warningElement);
        
        // 3秒后自动消失
        setTimeout(() => {
            warningElement.style.opacity = '0';
            setTimeout(() => {
                if (warningElement.parentElement) {
                    warningElement.parentElement.removeChild(warningElement);
                }
            }, 500);
        }, 3000);
    }
    
    // 处理可视化步骤
    handleVisualizationStep(step) {
        // 保存上一个状态
        this.animationState.previousArray = [...(this.animationState.currentArray || [])];
        
        // 重置动画进度，确保每个步骤都有完整的过渡效果
        this.animationState.animationProgress = 0;
        
        // 更新当前状态
        if (step.array) {
            this.animationState.currentArray = [...step.array];
        }
        
        // 设置步骤类型
        this.animationState.type = step.type || 'sorting';
        
        // 处理链表和二叉树特有属性
        if (step.type === 'linkedList') {
            this.animationState.nodes = step.nodes;
            this.animationState.current = step.current;
            this.animationState.highlight = step.highlight || [];
        } else if (step.type === 'binaryTree') {
            this.animationState.tree = step.tree;
            this.animationState.current = step.current;
            this.animationState.highlight = step.highlight || [];
            this.animationState.path = step.path || [];
        }
        
        this.animationState.currentStep = step.index;
        this.animationState.totalSteps = step.total;
        this.animationState.currentIndex = step.currentIndex;
        this.animationState.compareIndex = step.compareIndex;
        this.animationState.description = step.description;

        // 更新高亮区间（归并排序特有）
        if (step.highlightRange) {
            // 确保highlightRange总是一个数组的数组
            if (Array.isArray(step.highlightRange) && step.highlightRange.length === 2 && 
                typeof step.highlightRange[0] === 'number' && typeof step.highlightRange[1] === 'number') {
                // 如果接收到的是单个区间[start, end]，将其转换为[[start, end]]格式
                this.animationState.highlightRange = [step.highlightRange];
            } else {
                // 否则假设已经是数组的数组格式
                this.animationState.highlightRange = step.highlightRange;
            }
        } else {
            this.animationState.highlightRange = [];
        }

        // 更新比较和交换状态
        if (step.compareIndex !== -1) {
            this.animationState.comparing = [step.currentIndex, step.compareIndex];
            this.animationState.swapping = [];
        } else if (step.description && step.description.includes('交换')) {
            // 如果是交换操作，设置两个交换的元素
            this.animationState.comparing = [];
            if (step.currentIndex !== -1 && step.compareIndex !== -1) {
                this.animationState.swapping = [step.currentIndex, step.compareIndex];
            } else if (step.currentIndex !== -1) {
                this.animationState.swapping = [step.currentIndex];
            }
        } else {
            this.animationState.comparing = [];
            this.animationState.swapping = [];
        }
        
        // 更新排序状态
        if (step.sortedIndices) {
            this.animationState.sorted = [...step.sortedIndices];
        }
        
        // 更新计数排序状态
        if (step.countingArray !== undefined) {
            this.animationState.countingArray = [...step.countingArray];
        }
        if (step.outputArray !== undefined) {
            this.animationState.outputArray = [...step.outputArray];
        }
        if (step.phase) {
            this.animationState.phase = step.phase;
        }
        if (step.highlightCountingIndex !== undefined) {
            this.animationState.highlightCountingIndex = step.highlightCountingIndex;
        }
        if (step.highlightOutputIndex !== undefined) {
            this.animationState.highlightOutputIndex = step.highlightOutputIndex;
        }
        
        // 立即绘制初始状态
        this.drawVisualization();
        
        // 开始步骤动画
        this.startStepAnimation();
    }
    
    // 步骤动画逻辑
    startStepAnimation() {
        // 取消已存在的动画帧
        if (this._animationFrameId) {
            cancelAnimationFrame(this._animationFrameId);
            this._animationFrameId = null;
        }
        
        // 确保动画进度重置
        this.animationState.animationProgress = 0;
        
        let lastTime = performance.now();
        const animationDuration = this.config.animation.duration;
        
        const animate = (currentTime) => {
            const deltaTime = currentTime - lastTime;
            // 使用更精细的进度增量计算
            const progressIncrement = Math.min(deltaTime / animationDuration, 0.05);
            
            this.animationState.animationProgress += progressIncrement;
            
            if (this.animationState.animationProgress >= 1) {
                this.animationState.animationProgress = 1;
                this.drawVisualization();
                return;
            }
            
            this.drawVisualization();
            
            lastTime = currentTime;
            this._animationFrameId = requestAnimationFrame(animate);
        };
        
        this._animationFrameId = requestAnimationFrame(animate);
    }

    // 修改绘制描述文字的方法
    drawDescription() {
        const ctx = this.ctx;
        const padding = 20;
        
        // 设置描述文字样式
        ctx.font = '14px Arial';
        ctx.fillStyle = '#333';
        ctx.textAlign = 'left';
        
        // 计算文字位置
        const x = padding;
        const y = padding + 20;
        
        // 显示遍历类型
        if (this.animationState.traversalType) {
            let traversalText = '';
            switch (this.animationState.traversalType) {
                case 'preorder':
                    traversalText = '前序遍历 (根->左->右)';
                    break;
                case 'inorder':
                    traversalText = '中序遍历 (左->根->右)';
                    break;
                case 'postorder':
                    traversalText = '后序遍历 (左->右->根)';
                    break;
            }
            ctx.fillText(`遍历方式: ${traversalText}`, x, y);
        } else if (this.animationState.type === 'binaryTree') {
            // 如果是二叉树但还未选择遍历方式，显示提示
            ctx.fillText('请选择遍历方式：前序遍历、中序遍历或后序遍历', x, y);
        }
        
        // 显示当前操作描述
        if (this.animationState.description) {
            ctx.fillText(this.animationState.description, x, y + 25);
        }
        
        // 显示遍历路径
        if (this.animationState.path && this.animationState.path.length > 0) {
            const pathValues = this.animationState.path.map(id => {
                const node = this.findNodeById(this.animationState.tree, id);
                return node ? node.value : '';
            }).filter(Boolean);
            
            const pathText = `遍历序列: ${pathValues.join(' -> ')}`;
            ctx.fillText(pathText, x, y + 50);
        }
    }
    
    // 颜色调整
    adjustColor(color, amount) {
        const hex = color.replace('#', '');
        const num = parseInt(hex, 16);
        const r = Math.min(255, Math.max(0, (num >> 16) + amount));
        const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
        const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }
    
    // 线性插值
    lerp(start, end, progress) {
        return start + (end - start) * progress;
    }
    
    // 缓动函数
    easeInOutCubic(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    // 添加更流畅的缓动函数
    easeInOutQuart(t) {
        return t < 0.5
            ? 8 * t * t * t * t
            : 1 - Math.pow(-2 * t + 2, 4) / 2;
    }
    
    // 通用绘制矩形方法
    drawRect(x, y, width, height, options = {}) {
        const {
            fillStyle = null,
            strokeStyle = null,
            lineWidth = 1,
            fill = true,
            stroke = false
        } = options;
        
        const ctx = this.ctx;
        ctx.save();
        
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.closePath();
        
        if (fillStyle && fill) {
            ctx.fillStyle = fillStyle;
            ctx.fill();
        }
        
        if (strokeStyle && stroke) {
            ctx.strokeStyle = strokeStyle;
            ctx.lineWidth = lineWidth;
            ctx.stroke();
        }
        
        ctx.restore();
    }

    // 绘制圆角矩形
    drawRoundedRect(x, y, width, height, radius, fillStyle = null, strokeStyle = null) {
        const ctx = this.ctx;
        ctx.save();
        
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        
        if (fillStyle) {
            ctx.fillStyle = fillStyle;
            ctx.fill();
        }
        
        if (strokeStyle) {
            ctx.strokeStyle = strokeStyle;
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    // 添加网格线绘制
    drawGrid(maxHeight) {
        const ctx = this.ctx;
        ctx.save();
        
        // 设置网格线样式
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
        ctx.lineWidth = 0.5;
        
        // 绘制水平网格线
        const gridStep = maxHeight / 5;
        const startY = this.canvas.height - this.config.canvas.textMargin;
        
        for (let i = 1; i <= 5; i++) {
            const y = startY - (gridStep * i);
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    // 销毁实例，清理资源
    destroy() {
        if (this._animationFrameId) {
            cancelAnimationFrame(this._animationFrameId);
        }
        
        if (this._stepTimer) {
            clearTimeout(this._stepTimer);
        }
        
        if (this._handleMouseMove) {
            this.canvas.removeEventListener('mousemove', this._handleMouseMove);
        }
        
        window.removeEventListener('resize', this.resizeCanvas);
    }
    
    // 改进绘制排序数组方法，添加更好的视觉效果
    drawSortingArray(array, currentIndex, compareIndex) {
        if (!array || !array.length) return;
        
        const maxValue = Math.max(...array);
        const n = array.length;
        
        // 提取布局计算
        const layout = this.calculateArrayLayout(n, maxValue);
        const { barWidth, spacing, startX, maxHeight } = layout;
        
        // 获取颜色方案
        const currentScheme = this.config.colors.default;
        
        // 绘制描述文字
        this.drawDescription();
        
        // 创建元素位置映射
        const positionMap = this.createPositionMap(array, startX, barWidth, spacing);
        
        // 绘制高亮区间（如果有）
        this.drawHighlightRanges(positionMap, layout, barWidth);
        
        // 绘制网格线帮助视觉定位
        this.drawGrid(maxHeight);
        
        // 绘制所有柱子
        this.drawAllBars(array, positionMap, layout, currentScheme);
    }
    
    // 绘制高亮区间范围
    drawHighlightRanges(positionMap, layout, barWidth) {
        if (!this.animationState.highlightRange || this.animationState.highlightRange.length === 0) {
            return;
        }
        
        const ctx = this.ctx;
        
        this.animationState.highlightRange.forEach((range, rangeIndex) => {
            if (!range || range.length !== 2) return;
            
            const [startIdx, endIdx] = range;
            if (startIdx < 0 || endIdx >= this.animationState.currentArray.length) return;
            
            // 确保positionMap中有这些索引
            if (!positionMap.has(startIdx) || !positionMap.has(endIdx)) {
                console.warn('找不到位置信息:', startIdx, endIdx, positionMap);
                return;
            }
            
            // 计算区域的起始和结束位置
            const startX = positionMap.get(startIdx).originalX;
            const endX = positionMap.get(endIdx).originalX + barWidth;
            
            const y = layout.startY || this.config.canvas.headerHeight;
            const height = this.canvas.height - y - this.config.canvas.textMargin;
            
            // 选择颜色，为不同的区间使用略微不同的颜色
            let highlightColor;
            if (rangeIndex === 0) {
                highlightColor = 'rgba(173, 216, 230, 0.3)'; // 浅蓝色
            } else {
                highlightColor = 'rgba(255, 182, 193, 0.3)'; // 浅粉色
            }
            
            // 绘制高亮区域背景
            ctx.fillStyle = highlightColor;
            ctx.fillRect(startX, y, endX - startX, height);
            
            // 绘制区域边框
            ctx.strokeStyle = rangeIndex === 0 ? 'rgba(70, 130, 180, 0.5)' : 'rgba(188, 143, 143, 0.5)';
            ctx.lineWidth = 2;
            ctx.strokeRect(startX, y, endX - startX, height);
            
            // 添加文本标签
            ctx.font = '12px Arial';
            ctx.fillStyle = rangeIndex === 0 ? 'rgba(70, 130, 180, 0.9)' : 'rgba(188, 143, 143, 0.9)';
            ctx.textAlign = 'center';
            ctx.fillText(`[${startIdx}..${endIdx}]`, (startX + endX) / 2, y - 5);
        });
    }
    
    // 计算数组布局
    calculateArrayLayout(n, maxValue) {
        const cfg = this.config.bars;
        const canvasCfg = this.config.canvas;
        
        const availableWidth = this.canvas.width - canvasCfg.padding;
        const barWidth = Math.min((availableWidth / n) * cfg.widthRatio, cfg.maxWidth);
        const spacing = Math.min((availableWidth / n) * cfg.spacingRatio, cfg.minSpacing);
        
        const totalWidth = (barWidth + spacing) * n - spacing;
        const startX = (this.canvas.width - totalWidth) / 2;
        const maxHeight = this.canvas.height - canvasCfg.headerHeight;
        const startY = canvasCfg.headerHeight; // 添加startY值
        
        return { barWidth, spacing, startX, startY, maxHeight };
    }
    
    // 创建位置映射
    createPositionMap(array, startX, barWidth, spacing) {
        const positionMap = new Map();
        array.forEach((value, index) => {
            positionMap.set(index, {
                value,
                originalX: startX + index * (barWidth + spacing)
            });
        });
        return positionMap;
    }
    
    // 绘制所有柱子
    drawAllBars(array, positionMap, layout, colorScheme) {
        const { barWidth, maxHeight } = layout;
        const maxValue = Math.max(...array);
        
        array.forEach((value, index) => {
            // 计算柱子属性
            const props = this.calculateBarProperties(index, value, maxValue, positionMap, layout);
            const { currentHeight, currentX, y } = props;
            
            // 绘制柱子
            this.drawBar(index, value, currentX, y, barWidth, currentHeight, colorScheme);
            
            // 绘制文本
            this.drawBarText(value, index, currentX, y, barWidth);
        });
    }
    
    // 改进柱状图位置插值，使动画更流畅
    calculateBarProperties(index, value, maxValue, positionMap, layout) {
        const { barWidth, maxHeight } = layout;
        const cfg = this.config.bars;
        
        let currentHeight = (value / maxValue) * maxHeight * cfg.heightRatio;
        let currentX = positionMap.get(index).originalX;
        
        // 处理交换动画，改进插值方法
        if (this.animationState.swapping.includes(index)) {
            const otherIndex = this.animationState.swapping[0] === index ? 
                this.animationState.swapping[1] : this.animationState.swapping[0];
            
            const progress = this.animationState.animationProgress;
            // 使用更平滑的缓动函数
            const easeProgress = this.easeInOutQuart(progress);
            
            const targetX = positionMap.get(otherIndex).originalX;
            currentX = this.lerp(currentX, targetX, easeProgress);
        }
        
        const y = this.canvas.height - this.config.canvas.textMargin - currentHeight;
        
        return { currentHeight, currentX, y };
    }
    
    // 绘制柱子
    drawBar(index, value, x, y, width, height, colorScheme) {
        // 获取元素颜色
        const { fillColor, borderColor } = this.getElementColor(index, colorScheme);
        
        // 绘制矩形
        this.drawRect(x, y, width, height, {
            fillStyle: fillColor,
            strokeStyle: borderColor,
            lineWidth: 1,
            stroke: true
        });
    }
    
    // 获取元素颜色
    getElementColor(index, colorScheme) {
        let fillColor = colorScheme.base;
        
        // 检查元素状态
        if (this.animationState.sorted.includes(index)) {
            fillColor = colorScheme.sorted;
        } else if (this.animationState.comparing.includes(index)) {
            fillColor = colorScheme.comparing;
        } else if (this.animationState.swapping.includes(index)) {
            fillColor = colorScheme.swapping;
        }
        
        // 检查当前索引和比较索引
        if (index === this.animationState.currentIndex || index === this.animationState.compareIndex) {
            fillColor = colorScheme.comparing;
        }
        
        // 计算边框颜色为填充颜色的暗色版本
        const borderColor = this.adjustColor(fillColor, -30);
        
        return { fillColor, borderColor };
    }
    
    // 绘制柱子文本
    drawBarText(value, index, x, y, width) {
        const fontSize = Math.min(Math.max(width * 0.4, 12), 16);
        
        // 绘制数值
        this.drawText(value.toString(), x + width / 2, y - 5, {
            fontSize: `${fontSize}px`,
            fillStyle: '#666'
        });
        
        // 绘制索引
        this.drawText(`[${index}]`, x + width / 2, this.canvas.height - 10, {
            fontSize: `${fontSize}px`,
            fillStyle: '#666'
        });
    }
    
    // 设置鼠标交互
    setupMouseInteractions() {
        // 移除可能已存在的事件监听器
        if (this._handleMouseMove) {
            this.canvas.removeEventListener('mousemove', this._handleMouseMove);
        }
        
        // 创建新的事件处理函数
        this._handleMouseMove = (event) => {
            const { offsetX, offsetY } = event;
            const array = this.animationState.currentArray;
            if (!array || !array.length) return;
            
            const layout = this.calculateArrayLayout(array.length, Math.max(...array));
            const { barWidth, spacing, startX, maxHeight } = layout;
            
            let foundMatch = false;
            
            array.forEach((value, index) => {
                const currentHeight = (value / Math.max(...array)) * maxHeight * this.config.bars.heightRatio;
                const x = startX + index * (barWidth + spacing);
                const y = this.canvas.height - this.config.canvas.textMargin - currentHeight;
                
                if (offsetX >= x && offsetX <= x + barWidth && offsetY >= y && offsetY <= y + currentHeight) {
                    this.showTooltip(event, index, value);
                    foundMatch = true;
                }
            });
            
            if (!foundMatch) {
                this.hideTooltip();
            }
        };
        
        this.canvas.addEventListener('mousemove', this._handleMouseMove);
    }
    
    // 显示提示框
    showTooltip(event, index, value) {
        this.hideTooltip(); // 先清除现有提示框
        
        const tooltip = document.createElement('div');
        tooltip.className = 'visualizer-tooltip';
        tooltip.textContent = `值: ${value}, 索引: ${index}`;
        tooltip.style.left = `${event.pageX + 10}px`;
        tooltip.style.top = `${event.pageY - 30}px`;
        document.body.appendChild(tooltip);
    }
    
    // 隐藏提示框
    hideTooltip() {
        const tooltip = document.querySelector('.visualizer-tooltip');
        if (tooltip) {
            document.body.removeChild(tooltip);
        }
    }
    
    // 添加带有增强视觉效果的绘制方法
    drawSortingWithCustomEffects(array, currentIndex, compareIndex) {
        // 绘制标题和描述
        this.drawHeader();
        
        const { padding, headerHeight } = this.config.canvas;
        const { maxWidth, minSpacing, widthRatio, spacingRatio, cornerRadius, heightRatio } = this.config.bars;
        
        // 计算绘图区域
        const drawAreaWidth = this.canvas.width - 2 * padding;
        const drawAreaHeight = (this.canvas.height - headerHeight - padding) * heightRatio;
        
        // 计算条形图尺寸 - 重用布局计算方法
        const { barWidth, spacing, startX } = this.calculateBarLayout(
            array.length, drawAreaWidth, maxWidth, minSpacing, widthRatio, spacingRatio
        );
        
        // 查找数组中的最大值确定比例尺
        const maxValue = Math.max(...array, 1); // 确保至少为1，避免除以0
        
        // 获取排序步骤状态
        const { comparing, swapping, sorted } = this.animationState;
        
        // 绘制基数排序特有的元素
        if (this.animationState.custom) {
            this.drawRadixSortExtras(array, barWidth, spacing, startX, drawAreaHeight, maxValue);
        }
        
        // 绘制每个条形
        for (let i = 0; i < array.length; i++) {
            const x = startX + i * (barWidth + spacing);
            const height = (array[i] / maxValue) * drawAreaHeight;
            const y = this.canvas.height - padding - height;
            
            // 确定条形的颜色
            let color = this.config.colors.default.base;
            
            // 处理各种状态的颜色 - 重用颜色计算方法
            const { fillColor } = this.getElementColor(i, this.config.colors.default);
            color = fillColor;
            
            // 如果有自定义高亮
            if (this.animationState.custom && this.animationState.custom.highlight === i) {
                color = '#FF5722'; // 明亮的橙色作为高亮
            }
            
            // 绘制条形
            this.drawRoundedRect(x, y, barWidth, height, cornerRadius, color);
            
            // 绘制条形上的数值
            this.drawText(array[i].toString(), x + barWidth / 2, y - 8, {
                fillStyle: '#333',
                fontSize: '12px'
            });
            
            // 如果是基数排序且需要突出显示特定位数
            if (this.animationState.custom && this.animationState.custom.highlightDigit) {
                this.drawDigitHighlight(array[i], x, y, barWidth, this.animationState.custom.currentDigit, this.animationState.custom.digitValue, this.animationState.custom.activeElement === array[i]);
            }
        }
    }
    
    // 新增方法：统一计算条形图布局
    calculateBarLayout(count, availableWidth, maxWidth, minSpacing, widthRatio, spacingRatio) {
        const barWidth = Math.min((availableWidth * widthRatio) / count, maxWidth);
        const spacing = Math.max(minSpacing, (availableWidth * spacingRatio) / (count - 1 || 1));
        const totalWidth = barWidth * count + spacing * (count - 1);
        const startX = (this.canvas.width - totalWidth) / 2;
        
        return { barWidth, spacing, startX, totalWidth };
    }
    
    // 为基数排序添加额外的视觉效果
    drawRadixSortExtras(array, barWidth, spacing, startX, drawAreaHeight, maxValue) {
        const { padding } = this.config.canvas;
        const custom = this.animationState.custom;
        
        // 根据步骤类型绘制不同的额外视觉信息
        if (custom.showDigits && custom.maxValue) {
            // 显示最大值的位数
            const maxNum = custom.maxValue;
            const digits = maxNum.toString().length;
            
            this.drawText(`最大值 ${maxNum} 的位数: ${digits}`, this.canvas.width / 2, 40, {
                fontStyle: 'bold',
                fontSize: '14px',
                fillStyle: '#333'
            });
        }
        
        // 显示当前处理的轮次和位数
        if (custom.currentDigit !== undefined) {
            const digitNames = ['个位', '十位', '百位', '千位'];
            const currentDigitName = digitNames[custom.currentDigit] || `10^${custom.currentDigit}位`;
            
            this.drawText(`当前处理: ${currentDigitName}`, this.canvas.width / 2, 70, {
                fontStyle: 'bold',
                fontSize: '16px',
                fillStyle: '#555'
            });
        }
        
        // 显示桶状态
        if (custom.buckets) {
            this.drawBuckets(custom.buckets, custom.digitValue);
        }
        
        // 显示计数数组
        if (custom.countArray) {
            this.drawCountArray(custom.countArray, custom.cumulativeStep, custom.cumulativeIndex);
        }
        
        // 显示输出数组
        if (custom.outputArray) {
            this.drawOutputArray(custom.outputArray, custom.activeElement, custom.activePosition);
        }
        
        // 用连接线显示元素移动
        if (custom.placementStep) {
            this.drawElementPlacement(array, custom.sourceIndex, custom.targetIndex, startX, barWidth, spacing, drawAreaHeight, maxValue);
        }
    }
    
    // 高亮显示特定位数
    drawDigitHighlight(value, x, y, barWidth, digitPosition, digitValue, isActive) {
        const valueStr = value.toString();
        const digitIndex = valueStr.length - 1 - digitPosition;
        
        // 如果位数不在范围内，直接返回
        if (digitIndex < 0 || digitIndex >= valueStr.length) return;
        
        const digit = valueStr[digitIndex];
        
        // 计算显示位置，在条形下方显示
        const digitX = x + barWidth / 2;
        const digitY = y + 20; // 在条形下方
        
        // 绘制背景圆
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(digitX, digitY, 10, 0, Math.PI * 2);
        this.ctx.fillStyle = isActive ? '#FF5722' : '#FFA726';
        this.ctx.fill();
        
        // 绘制数字
        this.drawText(digit, digitX, digitY + 5, {
            fillStyle: '#fff',
            fontStyle: 'bold',
            fontSize: '14px'
        });
        
        this.ctx.restore();
    }
    
    // 绘制桶 - 重用文本绘制方法
    drawBuckets(buckets, activeDigit) {
        const bucketWidth = 40;
        const bucketHeight = 30;
        const bucketSpacing = 10;
        const startX = (this.canvas.width - (bucketWidth + bucketSpacing) * 10 + bucketSpacing) / 2;
        const startY = 100;
        
        // 绘制标题
        this.drawText('数字桶:', startX - 50, startY + bucketHeight / 2, {
            fillStyle: '#333',
            fontStyle: 'bold',
            fontSize: '14px'
        });
        
        // 绘制10个桶（0-9）
        for (let i = 0; i < 10; i++) {
            const x = startX + i * (bucketWidth + bucketSpacing);
            const y = startY;
            
            // 桶的颜色：当前活动桶使用高亮色
            const bucketColor = i === activeDigit ? '#FF9800' : '#E0E0E0';
            
            // 绘制桶 - 使用矩形绘制方法
            this.drawRect(x, y, bucketWidth, bucketHeight, {
                fillStyle: bucketColor
            });
            
            // 桶编号
            this.drawText(i.toString(), x + bucketWidth / 2, y + bucketHeight / 2 + 5, {
                fillStyle: '#333',
                fontStyle: 'bold',
                fontSize: '14px'
            });
            
            // 显示桶中的元素数量
            const bucketElements = buckets[i];
            if (bucketElements && bucketElements.length > 0) {
                this.drawText(`(${bucketElements.length})`, x + bucketWidth / 2, y + bucketHeight + 15, {
                    fillStyle: '#333',
                    fontSize: '12px'
                });
                
                // 如果桶中有元素，显示前几个
                const showCount = Math.min(bucketElements.length, 3);
                let elementsText = bucketElements.slice(0, showCount).join(', ');
                if (bucketElements.length > showCount) {
                    elementsText += '...';
                }
                
                this.drawText(elementsText, x + bucketWidth / 2, y + bucketHeight + 30, {
                    fillStyle: '#555',
                    fontSize: '11px'
                });
            }
        }
    }
    
    // 绘制计数数组 - 重用方法
    drawCountArray(countArray, isCumulative, cumulativeIndex) {
        const cellWidth = 30;
        const cellHeight = 30;
        const startX = (this.canvas.width - cellWidth * 10) / 2;
        const startY = 170;
        
        // 绘制标题
        this.drawText(isCumulative ? '累计计数:' : '计数数组:', startX - 60, startY + cellHeight / 2, {
            fillStyle: '#333',
            fontStyle: 'bold',
            fontSize: '14px'
        });
        
        // 绘制10个计数单元格（0-9）
        for (let i = 0; i < 10; i++) {
            const x = startX + i * cellWidth;
            const y = startY;
            
            // 单元格颜色
            let cellColor = '#F5F5F5';
            if (isCumulative && i === cumulativeIndex) {
                cellColor = '#B3E5FC'; // 高亮当前累加的单元格
            } else if (countArray[i] > 0) {
                cellColor = '#E1F5FE'; // 有计数的单元格
            }
            
            // 绘制单元格 - 使用通用矩形方法
            this.drawRect(x, y, cellWidth, cellHeight, {
                fillStyle: cellColor,
                strokeStyle: '#BDBDBD',
                lineWidth: 1,
                stroke: true
            });
            
            // 索引标签
            this.drawText(i.toString(), x + cellWidth / 2, y - 5, {
                fillStyle: '#757575',
                fontSize: '12px'
            });
            
            // 计数值
            this.drawText(countArray[i].toString(), x + cellWidth / 2, y + cellHeight / 2 + 5, {
                fillStyle: '#333',
                fontStyle: 'bold',
                fontSize: '14px'
            });
        }
    }
    
    // 绘制输出数组 - 重用方法
    drawOutputArray(outputArray, activeElement, activePosition) {
        const cellWidth = Math.min(40, (this.canvas.width - 100) / outputArray.length);
        const cellHeight = 30;
        const startX = (this.canvas.width - cellWidth * outputArray.length) / 2;
        const startY = 240;
        
        // 绘制标题
        this.drawText('输出数组:', startX - 60, startY + cellHeight / 2, {
            fillStyle: '#333',
            fontStyle: 'bold',
            fontSize: '14px'
        });
        
        // 绘制输出数组单元格
        for (let i = 0; i < outputArray.length; i++) {
            const x = startX + i * cellWidth;
            const y = startY;
            const value = outputArray[i];
            
            // 单元格颜色
            let cellColor = '#F5F5F5';
            if (value !== 0) {
                cellColor = i === activePosition ? '#FFD54F' : '#FFF9C4'; // 高亮当前位置
            }
            
            // 绘制单元格 - 使用通用矩形方法
            this.drawRect(x, y, cellWidth, cellHeight, {
                fillStyle: cellColor,
                strokeStyle: '#BDBDBD',
                lineWidth: 1,
                stroke: true
            });
            
            // 索引标签
            this.drawText(i.toString(), x + cellWidth / 2, y - 5, {
                fillStyle: '#757575',
                fontSize: '12px'
            });
            
            // 单元格值
            if (value !== 0) {
                const isActive = value === activeElement;
                this.drawText(value.toString(), x + cellWidth / 2, y + cellHeight / 2 + 5, {
                    fillStyle: isActive ? '#FF5722' : '#333',
                    fontStyle: isActive ? 'bold' : '',
                    fontSize: isActive ? '14px' : '14px'
                });
            }
        }
    }
    
    // 绘制元素放置示意 - 重用箭头绘制方法
    drawElementPlacement(array, sourceIndex, targetIndex, startX, barWidth, spacing, drawAreaHeight, maxValue) {
        if (sourceIndex < 0 || targetIndex < 0 || sourceIndex >= array.length || targetIndex >= array.length) {
            return;
        }
        
        const { padding } = this.config.canvas;
        
        // 源位置和目标位置
        const sourceX = startX + sourceIndex * (barWidth + spacing) + barWidth / 2;
        const targetX = startX + targetIndex * (barWidth + spacing) + barWidth / 2;
        const sourceY = this.canvas.height - padding - (array[sourceIndex] / maxValue) * drawAreaHeight;
        const targetY = this.canvas.height - padding - (array[sourceIndex] / maxValue) * drawAreaHeight;
        
        // 计算控制点，使箭头成弧线
        const controlX = (sourceX + targetX) / 2;
        const controlY = Math.min(sourceY, targetY) - 50;
        
        // 绘制曲线箭头
        this.drawCurvedArrow(sourceX, sourceY - 15, targetX, targetY - 15, controlX, controlY, {
            strokeStyle: '#FF5722',
            fillStyle: '#FF5722'
        });
    }
    
    // 添加绘制曲线箭头的方法
    drawCurvedArrow(fromX, fromY, toX, toY, controlX, controlY, options = {}) {
        const {
            strokeStyle = '#4A90E2',
            lineWidth = 2,
            arrowSize = 10,
            fillStyle = '#4A90E2',
            dashPattern = []
        } = options;
        
        const ctx = this.ctx;
        ctx.save();
        
        // 设置线型
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        if (dashPattern.length > 0) {
            ctx.setLineDash(dashPattern);
        }
        
        // 绘制二次贝塞尔曲线
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.quadraticCurveTo(controlX, controlY, toX, toY);
        ctx.stroke();
        
        // 计算箭头顶点的切线方向
        const t = 0.95; // 靠近终点的位置
        const dx = 2 * (1 - t) * (controlX - fromX) + 2 * t * (toX - controlX);
        const dy = 2 * (1 - t) * (controlY - fromY) + 2 * t * (toY - controlY);
        const angle = Math.atan2(dy, dx);
        
        // 计算箭头末端位置，稍微前移，让箭头更加自然
        const arrowTipX = toX;
        const arrowTipY = toY;
        
        // 绘制箭头
        ctx.beginPath();
        ctx.moveTo(arrowTipX, arrowTipY);
        ctx.lineTo(
            arrowTipX - arrowSize * Math.cos(angle - Math.PI / 6),
            arrowTipY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            arrowTipX - arrowSize * 0.6 * Math.cos(angle),
            arrowTipY - arrowSize * 0.6 * Math.sin(angle)
        );
        ctx.lineTo(
            arrowTipX - arrowSize * Math.cos(angle + Math.PI / 6),
            arrowTipY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = fillStyle;
        ctx.fill();
        
        ctx.restore();
    }
    
    // 添加设置算法生成器方法
    setAlgorithmGenerator(algorithmId, generatorFunction) {
        if (typeof generatorFunction !== 'function') {
            console.warn(`无效的生成器函数，无法注册算法 ${algorithmId}`);
            return;
        }
        
        // 保存到映射中
        this.algorithmGenerators.set(algorithmId, generatorFunction);
    }
    
    // 获取指定算法的生成器函数
    getAlgorithmGenerator(algorithmId) {
        if (typeof window !== 'undefined' && this._debug) {
            console.debug('获取算法生成器:', algorithmId, this.algorithmGenerators.has(algorithmId));
        }
        return this.algorithmGenerators.get(algorithmId);
    }
    
    // 使用指定算法生成可视化步骤
    generateSteps(algorithmId, data) {
        const generator = this.getAlgorithmGenerator(algorithmId);
        
        try {
            // 特殊处理链表数据结构的操作
            if (algorithmId === 'linkedList' && typeof window.VisualizationSteps !== 'undefined') {
                // 如果有指定操作，则使用handleLinkedListOperation处理
                if (data && data.operation) {
                    return window.VisualizationSteps.handleLinkedListOperation(
                        data.operation, 
                        data.value, 
                        data.position
                    );
                }
                // 否则使用默认的链表步骤生成
                else if (typeof window.VisualizationSteps.generateLinkedListSteps === 'function') {
                    return window.VisualizationSteps.generateLinkedListSteps(data);
                }
            }
            
            // 其他情况使用注册的生成器
            if (!generator) {
                return [];
            }
            
            // 判断算法类型并传递适当的数据
            const sortingAlgorithms = ['bubbleSort', 'selectionSort', 'insertionSort', 'quickSort', 'heapSort', 'mergeSort', 'radixSort'];
            if (sortingAlgorithms.includes(algorithmId)) {
                return generator(data.array || []);
            } else {
                return generator(data);
            }
        } catch (error) {
            console.error('生成步骤时出错:', error);
            return []; // 简化错误处理，直接返回空数组
        }
    }
    
    // 绘制计数排序的可视化
    drawCountingSort() {
        const { array, countingArray, outputArray, phase, currentIndex, highlightCountingIndex, highlightOutputIndex } = this.animationState;
        
        if (!array || array.length === 0) {
            this.drawNoDataMessage();
            return;
        }
        
        if (this._debug) {
            console.debug(`绘制计数排序，阶段: ${phase}, 计数数组长度: ${(countingArray || []).length}`);
        }
        
        const ctx = this.ctx;
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        // 绘制背景和网格线
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        this.drawGrid(canvasHeight);
        
        // 绘制描述文字
        this.drawDescription();
        
        // 计算布局
        const padding = 40;
        const headerHeight = 100;
        const sectionSpacing = 30; // 增加间距使布局更清晰
        const arrayHeight = Math.floor((canvasHeight - headerHeight - padding * 2 - sectionSpacing * 2) / 3);
        
        // 绘制阶段标题和进度指示器
        this.drawCountingSortPhaseIndicator(phase || 'init', padding, headerHeight - 50);
        
        // 绘制原始数组区域标题
        this.drawText('原始数组:', padding, headerHeight, {
            fillStyle: '#333',
            fontStyle: 'bold',
            fontSize: '16px',
            textAlign: 'left'
        });
        
        // 绘制原始数组
        this.drawCountingSortArraySection(
            array, 
            padding, 
            headerHeight + 10, 
            canvasWidth - padding * 2, 
            arrayHeight, 
            currentIndex, 
            -1, 
            [], 
            phase || 'init'
        );
        
        // 如果存在计数数组，则绘制计数数组区域
        if (countingArray && Array.isArray(countingArray) && countingArray.length > 0) {
            const countingSectionY = headerHeight + arrayHeight + sectionSpacing + 10;
            
            // 绘制计数数组区域标题
            this.drawText('计数数组:', padding, countingSectionY - 10, {
                fillStyle: '#333',
                fontStyle: 'bold',
                fontSize: '16px',
                textAlign: 'left'
            });
            
            // 绘制计数数组
            this.drawCountingSortCountingArray(
                countingArray,
                padding,
                countingSectionY,
                canvasWidth - padding * 2,
                arrayHeight,
                highlightCountingIndex,
                phase || 'counting'
            );
            
            // 可选：绘制对应线条，连接原数组元素和计数数组
            if ((phase === 'counting' || phase === undefined) && currentIndex >= 0 && highlightCountingIndex >= 0) {
                this.drawConnectionLine(
                    padding + (canvasWidth - padding * 2) / array.length * (currentIndex + 0.5),
                    headerHeight + arrayHeight,
                    padding + (canvasWidth - padding * 2) / countingArray.length * (highlightCountingIndex + 0.5),
                    countingSectionY
                );
            }
        }
        
        // 如果存在输出数组，则绘制输出数组区域
        if (outputArray && Array.isArray(outputArray) && (phase === 'placing' || phase === 'complete')) {
            const outputSectionY = headerHeight + arrayHeight * 2 + sectionSpacing * 2 + 10;
            
            // 绘制输出数组区域标题
            this.drawText('输出数组:', padding, outputSectionY - 10, {
                fillStyle: '#333',
                fontStyle: 'bold',
                fontSize: '16px',
                textAlign: 'left'
            });
            
            // 绘制输出数组
            this.drawCountingSortArraySection(
                outputArray,
                padding,
                outputSectionY,
                canvasWidth - padding * 2,
                arrayHeight,
                -1,
                -1,
                phase === 'complete' ? Array.from({length: outputArray.length}, (_, i) => i) : [],
                phase,
                highlightOutputIndex
            );
            
            // 可选：绘制对应线条，连接计数数组和输出数组位置
            if (phase === 'placing' && currentIndex >= 0 && highlightCountingIndex >= 0 && highlightOutputIndex >= 0) {
                this.drawConnectionLine(
                    padding + (canvasWidth - padding * 2) / countingArray.length * (highlightCountingIndex + 0.5),
                    countingSectionY + arrayHeight,
                    padding + (canvasWidth - padding * 2) / outputArray.length * (highlightOutputIndex + 0.5),
                    outputSectionY
                );
            }
        }
    }
    
    // 绘制计数排序阶段指示器
    drawCountingSortPhaseIndicator(phase, x, y) {
        const phases = ['init', 'counting', 'accumulation', 'placing', 'complete'];
        const phaseLabels = ['初始化', '计数', '累加', '放置', '完成'];
        const phaseColors = ['#ccc', '#FFC107', '#2196F3', '#9C27B0', '#4CAF50'];
        
        const totalWidth = 500;
        const stepWidth = totalWidth / phases.length;
        const stepHeight = 30;
        
        // 计算当前阶段的索引
        const currentPhaseIndex = phases.indexOf(phase);
        
        // 绘制整个进度条背景
        this.drawRect(x, y, totalWidth, stepHeight, {
            fillStyle: '#e9ecef'
        });
        
        // 绘制已完成阶段
        for (let i = 0; i <= currentPhaseIndex; i++) {
            this.drawRect(x + i * stepWidth, y, stepWidth, stepHeight, {
                fillStyle: phaseColors[i]
            });
            
            // 绘制分隔线
            if (i < phases.length - 1) {
                this.drawRect(x + (i + 1) * stepWidth - 1, y, 2, stepHeight, {
                    fillStyle: '#fff'
                });
            }
        }
        
        // 绘制阶段标签
        for (let i = 0; i < phases.length; i++) {
            // 设置标签文字颜色
            this.drawText(phaseLabels[i], x + i * stepWidth + stepWidth / 2, y + stepHeight / 2, {
                fillStyle: i <= currentPhaseIndex ? '#fff' : '#666',
                fontSize: '12px'
            });
        }
    }
    
    // 绘制计数排序数组区域（使用方块元素而非柱状图）
    drawCountingSortArraySection(array, x, y, width, height, currentIndex, compareIndex, sortedIndices, phase, highlightIndex = -1) {
        const arrayLength = array.length;
        
        // 计算元素尺寸
        const cellSize = Math.min(50, Math.min(width / arrayLength, height * 0.6));
        const cellGap = Math.min(10, cellSize * 0.2);
        const totalWidth = (cellSize + cellGap) * arrayLength - cellGap;
        
        // 计算起始位置，使数组居中显示
        const startX = x + (width - totalWidth) / 2;
        const startY = y + (height - cellSize) / 2 - 10;
        
        // 绘制数组元素
        for (let i = 0; i < arrayLength; i++) {
            const value = array[i];
            if (value === 0 && highlightIndex !== i && phase !== 'complete') continue; // 跳过未设置的元素（除非是高亮元素或已完成）
            
            const posX = startX + i * (cellSize + cellGap);
            
            // 确定颜色
            let fillColor, strokeColor;
            
            if (i === currentIndex) {
                fillColor = '#FF4949'; // 当前处理元素
                strokeColor = '#D32F2F';
            } else if (i === compareIndex) {
                fillColor = '#FFA500'; // 比较元素
                strokeColor = '#E65100';
            } else if (i === highlightIndex) {
                fillColor = '#9C27B0'; // 高亮元素
                strokeColor = '#6A1B9A';
            } else if (sortedIndices.includes(i)) {
                fillColor = '#4CAF50'; // 已排序元素
                strokeColor = '#2E7D32';
            } else {
                fillColor = '#607D8B'; // 默认颜色
                strokeColor = '#455A64';
            }
            
            // 绘制圆角矩形
            this.drawRoundedRect(posX, startY, cellSize, cellSize, 5, fillColor, strokeColor);
            
            // 绘制元素值
            this.drawText(value.toString(), posX + cellSize / 2, startY + cellSize / 2, {
                fillStyle: '#FFF',
                fontSize: Math.max(12, Math.min(16, cellSize * 0.4)) + 'px'
            });
        }
        
        // 绘制索引位置
        for (let i = 0; i < arrayLength; i++) {
            const posX = startX + i * (cellSize + cellGap);
            this.drawText(i.toString(), posX + cellSize / 2, startY + cellSize + 5, {
                fillStyle: '#666',
                fontSize: '12px',
                textBaseline: 'top'
            });
        }
    }
    
    // 绘制计数排序的计数数组（特殊处理）
    drawCountingSortCountingArray(countingArray, x, y, width, height, highlightIndex = -1, phase = 'counting') {
        const arrayLength = countingArray.length;
        
        // 计算元素尺寸
        const cellSize = Math.min(50, Math.min(width / arrayLength, height * 0.6));
        const cellGap = Math.min(10, cellSize * 0.2);
        const totalWidth = (cellSize + cellGap) * arrayLength - cellGap;
        
        // 计算起始位置，使数组居中显示
        const startX = x + (width - totalWidth) / 2;
        const startY = y + (height - cellSize) / 2 - 10;
        
        // 绘制计数数组元素和索引位置
        for (let i = 0; i < arrayLength; i++) {
            const posX = startX + i * (cellSize + cellGap);
            const value = countingArray[i];
            
            // 确定颜色
            let fillColor, strokeColor;
            
            if (i === highlightIndex) {
                if (phase === 'counting') {
                    fillColor = '#FFC107'; // 计数阶段高亮
                    strokeColor = '#FFA000';
                } else if (phase === 'accumulation') {
                    fillColor = '#2196F3'; // 累加阶段高亮
                    strokeColor = '#1976D2';
                } else if (phase === 'placing') {
                    fillColor = '#9C27B0'; // 放置阶段高亮
                    strokeColor = '#7B1FA2';
                } else {
                    fillColor = '#FF9800'; // 默认高亮
                    strokeColor = '#F57C00';
                }
            } else {
                fillColor = '#3F51B5'; // 默认计数数组颜色
                strokeColor = '#303F9F';
            }
            
            // 绘制圆角矩形
            this.drawRoundedRect(posX, startY, cellSize, cellSize, 5, fillColor, strokeColor);
            
            // 绘制计数值
            this.drawText(value.toString(), posX + cellSize / 2, startY + cellSize / 2, {
                fillStyle: '#FFF',
                fontSize: Math.max(12, Math.min(16, cellSize * 0.4)) + 'px'
            });
            
            // 绘制索引值（即对应的数组元素值）
            this.drawText(i.toString(), posX + cellSize / 2, startY + cellSize + 5, {
                fillStyle: '#333',
                fontSize: '12px',
                textBaseline: 'top'
            });
        }
        
        // 可选：显示对应的值
        if (arrayLength <= 15) { // 只在元素较少时显示
            for (let i = 0; i < arrayLength; i++) {
                const posX = startX + i * (cellSize + cellGap);
                this.drawText(`值=${i}`, posX + cellSize / 2, startY - 5, {
                    fillStyle: '#555',
                    fontSize: '10px',
                    textBaseline: 'bottom'
                });
            }
        }
    }
    
    // 绘制连接线（从一个数组元素到另一个数组元素）
    drawConnectionLine(x1, y1, x2, y2) {
        const midY = (y1 + y2) / 2;
        
        this.ctx.save();
        
        // 绘制贝塞尔曲线
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.bezierCurveTo(x1, midY, x2, midY, x2, y2);
        
        this.ctx.strokeStyle = 'rgba(255, 87, 34, 0.6)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 3]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // 绘制箭头 - 使用箭头绘制方法
        const arrowSize = 8;
        const angle = Math.atan2(y2 - midY, x2 - midY);
        
        // 绘制箭头头部
        this.ctx.beginPath();
        this.ctx.moveTo(x2, y2);
        this.ctx.lineTo(
            x2 - arrowSize * Math.cos(angle - Math.PI / 6),
            y2 - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.lineTo(
            x2 - arrowSize * Math.cos(angle + Math.PI / 6),
            y2 - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.closePath();
        
        this.ctx.fillStyle = 'rgba(255, 87, 34, 0.8)';
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    // 新增：检查并更新当前算法类型
    checkSelectedAlgorithmType() {
        if (window.app && window.app.selectedAlgorithm) {
            const selectedAlgo = window.app.selectedAlgorithm;
            const currentType = this.animationState.type;
            
            // 检查当前可视化类型与选择的算法是否匹配
            if ((selectedAlgo === 'linkedList' && currentType !== 'linkedList') ||
                (selectedAlgo === 'binaryTree' && currentType !== 'binaryTree') ||
                (selectedAlgo !== 'linkedList' && selectedAlgo !== 'binaryTree' && (currentType === 'linkedList' || currentType === 'binaryTree'))) {
                
                // 更新状态类型
                this.animationState.type = selectedAlgo === 'linkedList' || selectedAlgo === 'binaryTree' 
                                            ? selectedAlgo 
                                            : 'sorting';
                
                if (this._debug) {
                    console.debug(`检测到算法类型不匹配，当前:${this.animationState.type}，选择:${selectedAlgo}`);
                }
                
                // 重新初始化相应的数据结构
                if (selectedAlgo === 'linkedList') {
                    this.initLinkedListState();
                } else if (selectedAlgo === 'binaryTree') {
                    this.initBinaryTreeState();
                } else {
                    // 重置为排序可视化状态
                    this.resetAnimationState([]);
                }
                
                // 重新绘制
                this.drawVisualization();
                
                return true; // 状态已更新
            }
        }
        
        return false; // 无需更新
    }
    
    // 修改生成前序遍历步骤的方法
    generatePreorderSteps(node, steps = [], path = []) {
        if (typeof BinaryTreeAnimator === 'function') {
            // 创建临时动画器
            const tempAnimator = new BinaryTreeAnimator(this.ctx, this.config);
            return tempAnimator.generatePreorderSteps(node, steps, path);
        }
        console.warn('BinaryTreeAnimator不可用，无法生成前序遍历步骤');
            return steps;
    }
    
    // 修改生成中序遍历步骤的方法
    generateInorderSteps(node, steps = [], path = []) {
        if (typeof BinaryTreeAnimator === 'function') {
            // 创建临时动画器
            const tempAnimator = new BinaryTreeAnimator(this.ctx, this.config);
            return tempAnimator.generateInorderSteps(node, steps, path);
        }
        console.warn('BinaryTreeAnimator不可用，无法生成中序遍历步骤');
            return steps;
    }
    
    // 修改生成后序遍历步骤的方法
    generatePostorderSteps(node, steps = [], path = []) {
        if (typeof BinaryTreeAnimator === 'function') {
            // 创建临时动画器
            const tempAnimator = new BinaryTreeAnimator(this.ctx, this.config);
            return tempAnimator.generatePostorderSteps(node, steps, path);
        }
        console.warn('BinaryTreeAnimator不可用，无法生成后序遍历步骤');
            return steps;
    }
    
    // 修改查找节点的方法
    findNodeById(root, id) {
        if (typeof BinaryTreeAnimator === 'function') {
            // 创建临时动画器
            const tempAnimator = new BinaryTreeAnimator(this.ctx, this.config);
            return tempAnimator.findNodeById(root, id);
        }
        console.warn('BinaryTreeAnimator不可用，无法查找节点');
            return null;
    }
    
    // 修改初始化二叉树的方法
    initializeBinaryTree() {
        // 使用window.VisualizationSteps来生成二叉树
        if (typeof window !== 'undefined' && window.VisualizationSteps && 
            typeof window.VisualizationSteps.generateBinaryTreeSteps === 'function') {

            // 创建初始的二叉搜索树数据
            const initialData = { values: [50, 30, 70, 20, 40, 60, 80] };
        
            // 使用VisualizationSteps生成二叉树步骤
            const steps = window.VisualizationSteps.generateBinaryTreeSteps(initialData);
            
            // 从步骤中提取树结构
            let tree = null;
            for (const step of steps) {
                if (step.tree) {
                    tree = step.tree;
                    break;
                }
            }
        
        // 更新动画状态
        this.animationState = {
            ...this.animationState,
            type: 'binaryTree',
            tree: tree,
            current: null,
            highlight: [],
            path: [],
            description: '二叉搜索树初始化完成，可以选择遍历方式或进行其他操作',
            traversalType: null
        };
        
        // 立即绘制树
        this.drawVisualization();
        } else {
            console.warn('VisualizationSteps.generateBinaryTreeSteps不可用，无法初始化二叉树');
        }
    }

    // 设置动画步骤
    setSteps(steps) {
        this.steps = steps;
        this.currentStep = 0;
    }

    // 播放动画
    async playAnimation() {
        if (this.isAnimating) return;
        this.isAnimating = true;
        this.isPaused = false;
        
        while (this.currentStep < this.steps.length) {
            if (this.isPaused) {
                this.animationPromise = new Promise(resolve => {
                    this.animationPromise = { resolve };
                });
                await this.animationPromise;
            }
            
            const step = this.steps[this.currentStep];
            this.animationState = {
                ...this.animationState,
                ...step
            };
            this.drawVisualization();
            
            this.currentStep++;
            await new Promise(resolve => setTimeout(resolve, this.animationSpeed));
        }
        
        this.isAnimating = false;
    }

    // 暂停动画
    pauseAnimation() {
        this.isPaused = true;
    }

    // 继续动画
    resumeAnimation() {
        this.isPaused = false;
        if (this.animationPromise) {
            this.animationPromise.resolve();
        }
    }

    // 重置动画
    resetAnimation() {
        this.currentStep = 0;
        this.isPaused = false;
        this.isAnimating = false;
        if (this.animationPromise) {
            this.animationPromise.resolve();
        }
        this.initBinaryTreeState();
        this.drawVisualization();
    }

    // 设置动画速度
    setAnimationSpeed(speed) {
        this.animationSpeed = speed;
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AlgorithmVisualizer;
} else {
    window.AlgorithmVisualizer = AlgorithmVisualizer;
    console.log('AlgorithmVisualizer类已定义并挂载到window对象');
}

} // 结束检查AlgorithmVisualizer类是否存在的条件块

// 简化初始化部分
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // 只在存在目标画布元素时初始化
        if (!window.algorithmVisualizer && document.getElementById('algorithmCanvas')) {
            try {
                // 初始化可视化器实例
                const visualizer = new AlgorithmVisualizer('algorithmCanvas');
                
                // 获取算法模块
                const modules = window.VisualizationSteps || {};
                
                // 定义算法映射
                const algorithms = {
                    // 排序算法
                    'sorting': [
                        'bubbleSort', 'selectionSort', 'insertionSort', 
                        'quickSort', 'heapSort', 'mergeSort', 
                        'radixSort', 'bucketSort', 'countingSort'
                    ],
                    // 数据结构算法
                    'dataStructure': ['linkedList', 'binaryTree']
                };
                
                // 注册排序算法
                algorithms.sorting.forEach(name => {
                    const generator = modules[`generate${name.charAt(0).toUpperCase() + name.slice(1)}Steps`];
                    if (generator) {
                        visualizer.setAlgorithmGenerator(name, generator);
                    } else if (name === 'countingSort') {
                        // 为计数排序添加延迟加载逻辑
                        document.addEventListener('counting-sort-loaded', () => {
                            if (window.VisualizationSteps?.generateCountingSortSteps) {
                                visualizer.setAlgorithmGenerator(name, window.VisualizationSteps.generateCountingSortSteps);
                            }
                        });
                    }
                });
                
                // 注册数据结构算法
                algorithms.dataStructure.forEach(name => {
                    const generator = modules[`generate${name.charAt(0).toUpperCase() + name.slice(1)}Steps`];
                    if (generator) {
                        visualizer.setAlgorithmGenerator(name, generator);
                    }
                });
                
                // 导出到全局变量
                window.algorithmVisualizer = visualizer;
                
                console.info('可视化器初始化完成');
            } catch (error) {
                console.warn('可视化器初始化出错:', error);
            }
        }
    });
}