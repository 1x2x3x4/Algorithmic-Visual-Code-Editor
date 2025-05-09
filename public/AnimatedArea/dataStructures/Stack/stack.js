// 栈的可视化实现
class StackVisualizer {
    constructor(p5instance) {
        this.p5 = p5instance;
        this.stack = [];
        this.maxSize = 8;
        this.elementWidth = 60;
        this.elementHeight = 40;
        this.spacing = 2;
        this.animationSpeed = 0.02;
        
        // 动画状态
        this.currentAnimation = null;
        this.floatingElement = null;
        
        // 栈的位置和大小
        this.stackX = this.p5.width / 2;  // 栈的中心位置
        this.stackBottom = this.p5.height - 100;  // 栈底部位置
        this.stackWidth = this.elementWidth;
        
        // 颜色方案
        this.colors = {
            background: '#ffffff',
            stackBorder: '#666666',
            element: '#4a4a4a',
            elementBorder: '#333333',
            text: '#ffffff',
            arrow: '#666666'
        };
    }

    reset() {
        this.stack = [];
        this.currentAnimation = null;
        this.floatingElement = null;
    }

    // 获取元素在栈中的目标位置
    getElementPosition(index) {
        return {
            x: this.stackX - this.elementWidth / 2,
            y: this.stackBottom - (index + 1) * (this.elementHeight + this.spacing)
        };
    }

    push(value) {
        if (this.stack.length >= this.maxSize) return false;
        
        const targetPos = this.getElementPosition(this.stack.length);
        // 创建新元素，初始位置在栈的右侧
        this.floatingElement = {
            value: value,
            x: this.stackX + 150,
            y: targetPos.y,
            targetX: targetPos.x,
            targetY: targetPos.y,
            progress: 0,
            operation: 'push'
        };
        
        this.currentAnimation = {
            type: 'push',
            element: this.floatingElement,
            startTime: this.p5.millis()
        };
        
        this.stack.push(value);
        return true;
    }

    pop() {
        if (this.stack.length === 0) return null;
        
        const value = this.stack.pop();
        const startPos = this.getElementPosition(this.stack.length);
        
        this.floatingElement = {
            value: value,
            x: startPos.x,
            y: startPos.y,
            targetX: this.stackX - 150,
            targetY: startPos.y,
            progress: 0,
            operation: 'pop'
        };
        
        this.currentAnimation = {
            type: 'pop',
            element: this.floatingElement,
            startTime: this.p5.millis()
        };
        
        return value;
    }

    update() {
        if (this.currentAnimation && this.floatingElement) {
            const elapsed = this.p5.millis() - this.currentAnimation.startTime;
            this.floatingElement.progress = Math.min(1, elapsed / 1000); // 1秒动画
            
            if (this.floatingElement.progress >= 1) {
                this.currentAnimation = null;
                this.floatingElement = null;
            }
        }
    }

    draw() {
        this.p5.background(this.colors.background);
        
        // 绘制栈框架
        this.drawStackFrame();
        
        // 绘制栈内元素
        this.drawStackElements();
        
        // 绘制动画中的元素
        if (this.floatingElement) {
            this.drawFloatingElement();
        }
        
        // 绘制标签
        this.drawLabels();
    }

    drawStackFrame() {
        // 绘制栈的边框
        const frameHeight = (this.maxSize * (this.elementHeight + this.spacing));
        this.p5.stroke(this.colors.stackBorder);
        this.p5.strokeWeight(2);
        this.p5.noFill();
        this.p5.rect(
            this.stackX - this.elementWidth/2 - 5,
            this.stackBottom - frameHeight - 5,
            this.elementWidth + 10,
            frameHeight + 10
        );
    }

    drawStackElements() {
        for (let i = 0; i < this.stack.length; i++) {
            if (this.currentAnimation?.type === 'pop' && i === this.stack.length - 1) continue;
            const pos = this.getElementPosition(i);
            this.drawElement(this.stack[i], pos.x, pos.y);
        }
    }

    drawElement(value, x, y) {
        // 绘制元素背景
        this.p5.fill(this.colors.element);
        this.p5.stroke(this.colors.elementBorder);
        this.p5.strokeWeight(1);
        this.p5.rect(x, y, this.elementWidth, this.elementHeight);
        
        // 绘制文本
        this.p5.fill(this.colors.text);
        this.p5.noStroke();
        this.p5.textAlign(this.p5.CENTER, this.p5.CENTER);
        this.p5.textSize(16);
        this.p5.text(value, x + this.elementWidth/2, y + this.elementHeight/2);
    }

    drawFloatingElement() {
        const p = this.floatingElement.progress;
        let x, y;
        
        if (this.floatingElement.operation === 'push') {
            x = this.p5.lerp(this.floatingElement.x, this.floatingElement.targetX, p);
            y = this.floatingElement.targetY;
        } else {
            x = this.p5.lerp(this.floatingElement.x, this.floatingElement.targetX, p);
            y = this.floatingElement.targetY;
        }
        
        // 绘制移动轨迹
        this.p5.stroke(this.colors.arrow);
        this.p5.strokeWeight(1);
        this.p5.noFill();
        if (this.floatingElement.operation === 'push') {
            this.drawArrow(
                this.floatingElement.x,
                this.floatingElement.y,
                this.floatingElement.targetX,
                this.floatingElement.y
            );
        } else {
            this.drawArrow(
                this.floatingElement.x,
                this.floatingElement.y,
                this.floatingElement.targetX,
                this.floatingElement.y
            );
        }
        
        // 绘制移动中的元素
        this.drawElement(this.floatingElement.value, x, y);
    }

    drawArrow(x1, y1, x2, y2) {
        const headSize = 8;
        const angle = Math.atan2(y2 - y1, x2 - x1);
        
        // 绘制线
        this.p5.line(x1, y1, x2, y2);
        
        // 绘制箭头头部
        const headX = x2;
        const headY = y2;
        this.p5.push();
        this.p5.translate(headX, headY);
        this.p5.rotate(angle);
        this.p5.triangle(
            0, 0,
            -headSize, -headSize/2,
            -headSize, headSize/2
        );
        this.p5.pop();
    }

    drawLabels() {
        this.p5.fill(this.colors.stackBorder);
        this.p5.noStroke();
        this.p5.textAlign(this.p5.RIGHT, this.p5.CENTER);
        this.p5.textSize(14);
        
        // 绘制索引标签
        for (let i = 0; i < this.maxSize; i++) {
            const pos = this.getElementPosition(i);
            this.p5.text(
                `[${i}]`,
                pos.x - 10,
                pos.y + this.elementHeight/2
            );
        }
        
        // 绘制栈大小信息
        this.p5.textAlign(this.p5.LEFT, this.p5.TOP);
        this.p5.text(`栈大小: ${this.stack.length}/${this.maxSize}`, 10, 10);
    }
}

// 添加生成可视化步骤的函数
window.VisualizationSteps = window.VisualizationSteps || {};

window.VisualizationSteps.generateStackSteps = function(data) {
    const steps = [];
    const stack = [];
    const maxSize = 8;

    // 生成初始状态的步骤
    steps.push({
        type: 'init',
        description: '初始化空栈',
        stack: [...stack],
        highlight: null,
        animation: null
    });

    // 生成一些示例操作步骤
    // 入栈操作
    const pushValues = [10, 20, 30, 40];
    for (let value of pushValues) {
        if (stack.length < maxSize) {
            stack.push(value);
            steps.push({
                type: 'push',
                description: `将 ${value} 入栈`,
                stack: [...stack],
                highlight: stack.length - 1,
                animation: {
                    type: 'push',
                    value: value,
                    targetIndex: stack.length - 1
                }
            });
        }
    }

    // 出栈操作
    for (let i = 0; i < 2; i++) {
        if (stack.length > 0) {
            const value = stack.pop();
            steps.push({
                type: 'pop',
                description: `将 ${value} 出栈`,
                stack: [...stack],
                highlight: stack.length,
                animation: {
                    type: 'pop',
                    value: value,
                    sourceIndex: stack.length
                }
            });
        }
    }

    // 查看栈顶元素
    if (stack.length > 0) {
        steps.push({
            type: 'peek',
            description: `查看栈顶元素: ${stack[stack.length - 1]}`,
            stack: [...stack],
            highlight: stack.length - 1,
            animation: {
                type: 'highlight',
                index: stack.length - 1
            }
        });
    }

    return steps;
}; 