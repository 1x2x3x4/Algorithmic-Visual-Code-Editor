/**
 * 二叉树动画与可视化模块
 * 负责处理二叉树的绘制、动画及各种操作的可视化
 */
class BinaryTreeAnimator {
    constructor(ctx, config) {
        this.ctx = ctx;
        this.config = config;
        this.nodeRadius = 20;
        this.levelHeight = 60;
        this.positions = new Map();
    }

    // 计算树的信息（深度和每层节点数）
    calculateTreeInfo(root) {
        const levelWidths = new Map();
        
        const traverse = (node, level) => {
            if (!node) return;
            
            levelWidths.set(level, (levelWidths.get(level) || 0) + 1);
            traverse(node.left, level + 1);
            traverse(node.right, level + 1);
        };
        
        traverse(root, 0);
        return levelWidths;
    }

    // 计算节点位置
    calculateNodePositions(root) {
        this.positions.clear();
        const levelWidths = this.calculateTreeInfo(root);
        const maxLevel = Math.max(...levelWidths.keys());
        
        const calculateTargetPosition = (level, index, totalNodesInLevel) => {
            const canvasWidth = this.ctx.canvas.width;
            const horizontalSpacing = canvasWidth / (totalNodesInLevel + 1);
            return {
                x: horizontalSpacing * (index + 1),
                y: this.levelHeight + level * this.levelHeight
            };
        };

        const traverse = (node, level, index, levelCounts = new Map()) => {
            if (!node) return;

            levelCounts.set(level, (levelCounts.get(level) || 0) + 1);
            const position = calculateTargetPosition(
                level,
                levelCounts.get(level) - 1,
                levelWidths.get(level)
            );

            this.positions.set(node.id, position);
            traverse(node.left, level + 1, index * 2, levelCounts);
            traverse(node.right, level + 1, index * 2 + 1, levelCounts);
        };

        traverse(root, 0, 0);
    }

    // 绘制连接线
    drawConnections(root) {
        const drawConnection = (fromNode, toNode) => {
            if (!fromNode || !toNode) return;
            
            const fromPos = this.positions.get(fromNode.id);
            const toPos = this.positions.get(toNode.id);
            
            if (!fromPos || !toPos) return;
            
            this.ctx.beginPath();
            this.ctx.moveTo(fromPos.x, fromPos.y);
            this.ctx.lineTo(toPos.x, toPos.y);
            this.ctx.strokeStyle = '#333333';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        };

        const traverse = (node) => {
            if (!node) return;
            if (node.left) drawConnection(node, node.left);
            if (node.right) drawConnection(node, node.right);
            traverse(node.left);
            traverse(node.right);
        };

        traverse(root);
    }

    // 绘制节点
    drawNodes(root, currentNode = null, highlightNodes = [], path = []) {
        const traverse = (node) => {
            if (!node) return;
            
            const pos = this.positions.get(node.id);
            if (!pos) return;

            // 确定节点的样式
            let fillColor = '#FFFFFF';
            let strokeColor = '#000000';
            let textColor = '#000000';

            if (currentNode && node.id === currentNode) {
                fillColor = '#FFD700';  // 当前节点为金色
                strokeColor = '#FFA500';
            } else if (highlightNodes.includes(node.id)) {
                fillColor = '#90EE90';  // 高亮节点为浅绿色
                strokeColor = '#228B22';
            } else if (path.includes(node.id)) {
                fillColor = '#FFB6C1';  // 路径节点为浅红色
                strokeColor = '#DC143C';
            }

            // 绘制节点
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, this.nodeRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = fillColor;
            this.ctx.fill();
            this.ctx.strokeStyle = strokeColor;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // 绘制节点值
            this.ctx.fillStyle = textColor;
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(node.value, pos.x, pos.y);

            // 绘制节点编号
            this.ctx.fillStyle = '#FF0000';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(node.id, pos.x, pos.y + this.nodeRadius + 15);

            traverse(node.left);
            traverse(node.right);
        };

        traverse(root);
    }

    // 主绘制方法
    draw(state) {
        const { tree, current, highlight, path } = state;
        if (!tree) return;

        this.calculateNodePositions(tree);
        this.drawConnections(tree);
        this.drawNodes(tree, current, highlight, path);
    }

    // 生成前序遍历步骤
    generatePreorderSteps(node, steps = [], path = []) {
        if (!node) return steps;
        
        steps.push({
            type: 'visit',
            nodeId: node.id,
            path: [...path],
            description: `访问节点 ${node.value}`
        });
        
        path.push(node.id);
        
        if (node.left) {
            steps.push({
                type: 'move',
                nodeId: node.left.id,
                path: [...path],
                description: `移动到左子节点 ${node.left.value}`
            });
            this.generatePreorderSteps(node.left, steps, path);
        }
        
        if (node.right) {
            steps.push({
                type: 'move',
                nodeId: node.right.id,
                path: [...path],
                description: `移动到右子节点 ${node.right.value}`
            });
            this.generatePreorderSteps(node.right, steps, path);
        }
        
        path.pop();
        return steps;
    }

    // 生成中序遍历步骤
    generateInorderSteps(node, steps = [], path = []) {
        if (!node) return steps;
        
        if (node.left) {
            steps.push({
                type: 'move',
                nodeId: node.left.id,
                path: [...path],
                description: `移动到左子节点 ${node.left.value}`
            });
            this.generateInorderSteps(node.left, steps, path);
        }
        
        steps.push({
            type: 'visit',
            nodeId: node.id,
            path: [...path],
            description: `访问节点 ${node.value}`
        });
        
        path.push(node.id);
        
        if (node.right) {
            steps.push({
                type: 'move',
                nodeId: node.right.id,
                path: [...path],
                description: `移动到右子节点 ${node.right.value}`
            });
            this.generateInorderSteps(node.right, steps, path);
        }
        
        path.pop();
        return steps;
    }

    // 生成后序遍历步骤
    generatePostorderSteps(node, steps = [], path = []) {
        if (!node) return steps;
        
        if (node.left) {
            steps.push({
                type: 'move',
                nodeId: node.left.id,
                path: [...path],
                description: `移动到左子节点 ${node.left.value}`
            });
            this.generatePostorderSteps(node.left, steps, path);
        }
        
        if (node.right) {
            steps.push({
                type: 'move',
                nodeId: node.right.id,
                path: [...path],
                description: `移动到右子节点 ${node.right.value}`
            });
            this.generatePostorderSteps(node.right, steps, path);
        }
        
        steps.push({
            type: 'visit',
            nodeId: node.id,
            path: [...path],
            description: `访问节点 ${node.value}`
        });
        
        path.push(node.id);
        path.pop();
        return steps;
    }

    // 查找节点
    findNodeById(root, id) {
        if (!root) return null;
        if (root.id === id) return root;
        
        const leftResult = this.findNodeById(root.left, id);
        if (leftResult) return leftResult;
        
        return this.findNodeById(root.right, id);
    }

    // 创建二叉树
    createBinaryTree(values) {
        if (!values || values.length === 0) {
            values = [50, 30, 20, 40, 70, 60, 80]; // 默认值
        }
        
        let root = null;
        let nodeId = 0;
        
        // 创建节点的辅助函数
        const createNode = (value) => {
            return {
                id: nodeId++,
                value: value,
                left: null,
                right: null
            };
        };
        
        // BST插入函数
        const insert = (node, value) => {
            if (node === null) {
                return createNode(value);
            }
            
            if (value < node.value) {
                node.left = insert(node.left, value);
                if (node.left) node.left.parent = node;
            } else if (value > node.value) {
                node.right = insert(node.right, value);
                if (node.right) node.right.parent = node;
            }
            
            return node;
        };
        
        // 构建树
        values.forEach(value => {
            root = insert(root, value);
        });
        
        return root;
    }

    // 从binaryTree.js集成的功能: 生成二叉树可视化步骤
    generateBinaryTreeSteps(data) {
        const steps = [];
        const pathHistory = {
            preOrder: [],
            inOrder: [],
            postOrder: []
        };

        // 获取节点值数组
        let values = data?.values;
        
        // 如果传入的 values 不是数组或者为空数组，使用默认数据
        if (!Array.isArray(values) || values.length === 0) {
            values = [50, 30, 20, 40, 70, 60, 80];
            steps.push({
                type: 'binaryTree',
                description: '使用默认二叉树数据',
                current: null,
                highlight: [],
                path: []
            });
        }

        // 创建树
        let tree = this.createBinaryTree(values);
        for (let i = 0; i < values.length; i++) {
            steps.push({
                type: 'binaryTree',
                tree: JSON.parse(JSON.stringify(tree)),
                description: `插入节点 ${i}，值为 ${values[i]}`,
                current: i,
                highlight: [i],
                path: []
            });
        }

        // 初始状态
        steps.push({
            type: 'binaryTree',
            tree: JSON.parse(JSON.stringify(tree)),
            description: '初始化二叉树完成，根节点值为 ' + tree.value,
            current: null,
            highlight: [],
            path: []
        });

        // 前序遍历
        const preOrder = (node) => {
            if (!node) return;

            const stack = [node];
            const path = [];

            while (stack.length > 0) {
                const current = stack.pop();
                path.push(current.id);
                pathHistory.preOrder.push(current.id);

                steps.push({
                    type: 'binaryTree',
                    tree: JSON.parse(JSON.stringify(tree)),
                    description: `前序遍历访问节点 ${current.id}，值为 ${current.value}`,
                    current: current.id,
                    highlight: [...path],
                    path: [...pathHistory.preOrder],
                    traversalType: 'preorder'
                });

                if (current.right) {
                    stack.push(current.right);
                }
                if (current.left) {
                    stack.push(current.left);
                }
            }
        };

        // 中序遍历
        const inOrder = (node) => {
            if (!node) return;

            const stack = [];
            const path = [];
            let current = node;

            while (current || stack.length > 0) {
                while (current) {
                    stack.push(current);
                    current = current.left;
                }

                current = stack.pop();
                path.push(current.id);
                pathHistory.inOrder.push(current.id);

                steps.push({
                    type: 'binaryTree',
                    tree: JSON.parse(JSON.stringify(tree)),
                    description: `中序遍历访问节点 ${current.id}，值为 ${current.value}`,
                    current: current.id,
                    highlight: [...path],
                    path: [...pathHistory.inOrder],
                    traversalType: 'inorder'
                });

                current = current.right;
            }
        };

        // 后序遍历
        const postOrder = (node) => {
            if (!node) return;

            const stack1 = [node];
            const stack2 = [];
            const path = [];

            while (stack1.length > 0) {
                const current = stack1.pop();
                stack2.push(current);

                if (current.left) {
                    stack1.push(current.left);
                }
                if (current.right) {
                    stack1.push(current.right);
                }
            }

            while (stack2.length > 0) {
                const current = stack2.pop();
                path.push(current.id);
                pathHistory.postOrder.push(current.id);

                steps.push({
                    type: 'binaryTree',
                    tree: JSON.parse(JSON.stringify(tree)),
                    description: `后序遍历访问节点 ${current.id}，值为 ${current.value}`,
                    current: current.id,
                    highlight: [...path],
                    path: [...pathHistory.postOrder],
                    traversalType: 'postorder'
                });
            }
        };

        // 执行遍历
        steps.push({
            type: 'binaryTree',
            tree: JSON.parse(JSON.stringify(tree)),
            description: '开始前序遍历',
            current: null,
            highlight: [],
            path: []
        });
        preOrder(tree);

        steps.push({
            type: 'binaryTree',
            tree: JSON.parse(JSON.stringify(tree)),
            description: '开始中序遍历',
            current: null,
            highlight: [],
            path: []
        });
        inOrder(tree);

        steps.push({
            type: 'binaryTree',
            tree: JSON.parse(JSON.stringify(tree)),
            description: '开始后序遍历',
            current: null,
            highlight: [],
            path: []
        });
        postOrder(tree);

        steps.push({
            type: 'binaryTree',
            tree: JSON.parse(JSON.stringify(tree)),
            description: '所有遍历完成',
            current: null,
            highlight: [],
            path: []
        });

        return steps;
    }
}

// 创建VisualizationSteps对象用于保持与原代码兼容
const VisualizationSteps = {
    generateBinaryTreeSteps: function(data) {
        // 这是一个适配器，实例化BinaryTreeAnimator并调用其方法
        // 在浏览器环境中，这将创建一个临时画布上下文
        let ctx;
        if (typeof document !== 'undefined') {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 800;
            tempCanvas.height = 600;
            ctx = tempCanvas.getContext('2d');
        } else {
            // 在Node环境中创建一个模拟上下文
            ctx = {
                canvas: { width: 800, height: 600 },
                beginPath: () => {},
                moveTo: () => {},
                lineTo: () => {},
                stroke: () => {},
                arc: () => {},
                fill: () => {},
                fillText: () => {}
            };
        }
        
        const animator = new BinaryTreeAnimator(ctx, {});
        return animator.generateBinaryTreeSteps(data);
    }
};

// 为浏览器环境提供全局访问
if (typeof window !== 'undefined') {
    // 直接将BinaryTreeAnimator暴露在全局作用域中
    BinaryTreeAnimator = BinaryTreeAnimator;
    
    // 保持与其他算法一致的挂载方式
    window.VisualizationSteps = window.VisualizationSteps || {};
    window.VisualizationSteps.generateBinaryTreeSteps = VisualizationSteps.generateBinaryTreeSteps;
}

// ES6 模块导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        BinaryTreeAnimator,
        VisualizationSteps
    };
} 