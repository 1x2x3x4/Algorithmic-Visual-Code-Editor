/**
 * 二叉树操作的可视化步骤生成
 * 包含二叉树的基本操作和可视化步骤生成函数
 */

// 使用通用模块模式，同时支持浏览器和Node.js环境
(function(global) {
  // 获取或创建VisualizationSteps对象
  var VisualizationSteps = global.VisualizationSteps || {};
  
  /**
   * 生成二叉树操作的可视化步骤
   * @param {Object} data 包含二叉树节点值的数据对象
   * @returns {Array<Object>} 可视化步骤数组
   */
  function generateBinaryTreeSteps(data) {
    const steps = [];
    const pathHistory = {
      preOrder: [],
      inOrder: [],
      postOrder: []
    };

    // 获取节点值数组
    let values = data.values;
    
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

    // 定义二叉树节点结构
    class TreeNode {
        constructor(value) {
            this.value = value;
            this.left = null;
            this.right = null;
            this.id = null;
        }
    }

    // 插入节点到二叉搜索树
    function insert(root, value, id) {
        if (root === null) {
            const newNode = new TreeNode(value);
            newNode.id = id;
            return newNode;
        }
        if (value < root.value) {
            root.left = insert(root.left, value, id);
        } else {
            root.right = insert(root.right, value, id);
        }
        return root;
    }

    // 删除节点
    function deleteNode(root, value) {
        if (root === null) return root;

        if (value < root.value) {
            root.left = deleteNode(root.left, value);
        } else if (value > root.value) {
            root.right = deleteNode(root.right, value);
        } else {
            // 节点只有一个子节点或没有子节点
            if (root.left === null) {
                return root.right;
            } else if (root.right === null) {
                return root.left;
            }

            // 节点有两个子节点，获取右子树的最小节点
            root.value = minValue(root.right);
            root.right = deleteNode(root.right, root.value);
        }
        return root;
    }

    // 获取节点的最小值
    function minValue(root) {
        let minv = root.value;
        while (root.left !== null) {
            minv = root.left.value;
            root = root.left;
        }
        return minv;
    }

    let tree = null;
    for (let i = 0; i < values.length; i++) {
        tree = insert(tree, values[i], i);
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

  // 将函数添加到VisualizationSteps对象
  VisualizationSteps.generateBinaryTreeSteps = generateBinaryTreeSteps;
  
  // 根据环境导出模块
  if (typeof module !== 'undefined' && module.exports) {
    // Node.js环境
    module.exports = {
      generateBinaryTreeSteps: generateBinaryTreeSteps
    };
  } else {
    // 浏览器环境
    global.VisualizationSteps = VisualizationSteps;
  }
  
  // 添加调试信息
  if (typeof console !== 'undefined') {
    console.log('二叉树可视化模块已加载，generateBinaryTreeSteps 函数已注册');
  }

})(typeof window !== 'undefined' ? window : global); 