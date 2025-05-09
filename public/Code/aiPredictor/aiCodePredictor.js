// 本地代码预测功能


class AICodePredictor {
    constructor() {
        this.context = '';
        this.currentPredictions = [];
        this.isProcessing = false;
        this.contextWindow = 100;
        this.maxPredictions = 8;
    }

    // 更新上下文
    updateContext(code, cursorPosition) {
        const beforeCursor = code.substring(Math.max(0, cursorPosition - this.contextWindow), cursorPosition);
        const afterCursor = code.substring(cursorPosition, Math.min(code.length, cursorPosition + this.contextWindow));
        this.context = {
            before: beforeCursor,
            after: afterCursor,
            language: this.detectLanguage(code)
        };
    }

    detectLanguage(code) {
        if (code.includes('#include')) return 'c';
        if (code.includes('import java')) return 'java';
        if (code.includes('import React')) return 'javascript';
        if (code.includes('def ')) return 'python';
        return 'text';
    }

    async predict() {
        if (this.isProcessing) return [];
        try {
            this.isProcessing = true;
            return await this.mockPredictions();
        } catch (error) {
            console.error('生成预测时出错:', error);
            return [];
        } finally {
            this.isProcessing = false;
        }
    }

    async mockPredictions() {
        const { before, language } = this.context;
        const lastLine = before.split('\n').pop() || '';
        const lastWord = lastLine.trim().split(' ').pop() || '';
        let predictions = [];

        if (language === 'c') {
            // 头文件提示
            if (lastWord.includes('#in')) {
                predictions = [
                    { text: '#include <stdio.h>', description: '标准输入输出库' },
                    { text: '#include <stdlib.h>', description: '标准库函数' },
                    { text: '#include <string.h>', description: '字符串处理函数' },
                    { text: '#include <math.h>', description: '数学函数' },
                    { text: '#include <time.h>', description: '时间相关函数' },
                    { text: '#include <ctype.h>', description: '字符类型判断' },
                    { text: '#include <limits.h>', description: '整数限制常量' },
                    { text: '#include <float.h>', description: '浮点数限制常量' },
                    { text: '#include <errno.h>', description: '错误处理' },
                    { text: '#include <locale.h>', description: '本地化设置' }
                ];
            }
            // 主函数
            else if (lastWord.includes('mai')) {
                predictions = [
                    { text: 'int main() {\n    \n    return 0;\n}', description: '基本主函数' },
                    { text: 'int main(int argc, char *argv[]) {\n    \n    return 0;\n}', description: '带命令行参数的主函数' },
                    { text: 'void main() {\n    \n}', description: '无返回值主函数' }
                ];
            }
            // printf相关
            else if (lastWord.includes('pr')) {
                predictions = [
                    { text: 'printf("\\n");', description: '打印换行' },
                    { text: 'printf("%d", num);', description: '打印整数' },
                    { text: 'printf("%s", str);', description: '打印字符串' },
                    { text: 'printf("%f", float_num);', description: '打印浮点数' },
                    { text: 'printf("%c", char_val);', description: '打印字符' },
                    { text: 'printf("%x", hex_num);', description: '打印十六进制' },
                    { text: 'printf("%o", oct_num);', description: '打印八进制' },
                    { text: 'printf("%p", ptr);', description: '打印指针地址' },
                    { text: 'printf("%.2f", float_num);', description: '打印两位小数' },
                    { text: 'printf("%*d", width, num);', description: '指定宽度打印' }
                ];
            }
            // scanf相关
            else if (lastWord.includes('sc')) {
                predictions = [
                    { text: 'scanf("%d", &num);', description: '读取整数' },
                    { text: 'scanf("%s", str);', description: '读取字符串' },
                    { text: 'scanf("%f", &float_num);', description: '读取浮点数' },
                    { text: 'scanf("%c", &char_val);', description: '读取字符' },
                    { text: 'scanf("%[^\\n]s", str);', description: '读取整行' },
                    { text: 'scanf("%d:%d:%d", &h, &m, &s);', description: '读取时间格式' },
                    { text: 'scanf("%d,%d", &x, &y);', description: '读取逗号分隔的数' },
                    { text: 'scanf("%*d %d", &num);', description: '跳过第一个数' }
                ];
            }
            // 文件操作
            else if (lastWord.includes('fil')) {
                predictions = [
                    { text: 'FILE *fp = fopen("file.txt", "r");', description: '打开文件读取' },
                    { text: 'FILE *fp = fopen("file.txt", "w");', description: '打开文件写入' },
                    { text: 'FILE *fp = fopen("file.txt", "a");', description: '打开文件追加' },
                    { text: 'fclose(fp);', description: '关闭文件' },
                    { text: 'fprintf(fp, "text");', description: '写入格式化文本' },
                    { text: 'fscanf(fp, "%d", &num);', description: '从文件读取' },
                    { text: 'fgets(str, size, fp);', description: '读取一行文本' },
                    { text: 'fputs(str, fp);', description: '写入一行文本' }
                ];
            }
            // 内存操作
            else if (lastWord.includes('mem')) {
                predictions = [
                    { text: 'void *ptr = malloc(size);', description: '分配内存' },
                    { text: 'void *ptr = calloc(nmemb, size);', description: '分配并清零内存' },
                    { text: 'void *ptr = realloc(old_ptr, new_size);', description: '重新分配内存' },
                    { text: 'free(ptr);', description: '释放内存' },
                    { text: 'memset(ptr, value, size);', description: '内存设置' },
                    { text: 'memcpy(dest, src, size);', description: '内存复制' },
                    { text: 'memcmp(ptr1, ptr2, size);', description: '内存比较' },
                    { text: 'void *ptr = aligned_alloc(alignment, size);', description: '对齐内存分配' }
                ];
            }
            // 字符串操作
            else if (lastWord.includes('str')) {
                predictions = [
                    { text: 'strcpy(dest, src);', description: '字符串复制' },
                    { text: 'strncpy(dest, src, n);', description: '安全字符串复制' },
                    { text: 'strcat(dest, src);', description: '字符串连接' },
                    { text: 'strncat(dest, src, n);', description: '安全字符串连接' },
                    { text: 'strcmp(str1, str2);', description: '字符串比较' },
                    { text: 'strncmp(str1, str2, n);', description: '安全字符串比较' },
                    { text: 'strlen(str);', description: '字符串长度' },
                    { text: 'strchr(str, c);', description: '查找字符' },
                    { text: 'strstr(haystack, needle);', description: '查找子串' }
                ];
            }
            // 结构体
            else if (lastWord.includes('str')) {
                predictions = [
                    { text: 'struct Name {\n    int member1;\n    char member2;\n};', description: '基本结构体定义' },
                    { text: 'struct {\n    int x;\n    int y;\n} point;', description: '匿名结构体定义' },
                    { text: 'typedef struct {\n    int data;\n    struct Node* next;\n} Node;', description: '链表节点结构体' },
                    { text: 'struct {\n    union {\n        int i;\n        float f;\n    } u;\n};', description: '联合体结构体' },
                    { text: 'struct {\n    enum { RED, GREEN, BLUE } color;\n};', description: '枚举结构体' }
                ];
            }
            // 函数定义
            else if (lastWord.includes('void') || lastWord.includes('int') || lastWord.includes('char')) {
                predictions = [
                    { text: 'void functionName(void) {\n    \n}', description: '无参数无返回值函数' },
                    { text: 'int functionName(int param) {\n    return 0;\n}', description: '带参数整型返回函数' },
                    { text: 'char* functionName(const char* str) {\n    return NULL;\n}', description: '字符串处理函数' },
                    { text: 'void functionName(int* arr, int size) {\n    \n}', description: '数组处理函数' },
                    { text: 'struct Node* functionName(void) {\n    return NULL;\n}', description: '结构体指针返回函数' },
                    { text: 'int functionName(int (*callback)(int)) {\n    return 0;\n}', description: '函数指针参数' }
                ];
            }
            // 指针操作
            else if (lastWord.includes('*')) {
                predictions = [
                    { text: 'int* ptr = &variable;', description: '指针声明和初始化' },
                    { text: 'char* str = (char*)malloc(size);', description: '动态分配字符串' },
                    { text: 'void* ptr = NULL;', description: '空指针声明' },
                    { text: 'const int* ptr;', description: '指向常量的指针' },
                    { text: 'int* const ptr;', description: '常量指针' },
                    { text: 'int** ptr;', description: '二级指针' },
                    { text: 'void (*func_ptr)(int);', description: '函数指针' },
                    { text: 'struct Node* next;', description: '结构体指针成员' }
                ];
            }
            // 数组操作
            else if (lastWord.includes('arr')) {
                predictions = [
                    { text: 'int array[SIZE];', description: '整型数组声明' },
                    { text: 'char str[100];', description: '字符数组声明' },
                    { text: 'int matrix[ROW][COL];', description: '二维数组声明' },
                    { text: 'int* dynamic_array = (int*)malloc(n * sizeof(int));', description: '动态数组' },
                    { text: 'int array[] = {1, 2, 3};', description: '数组初始化' },
                    { text: 'char str[] = "Hello";', description: '字符串数组初始化' },
                    { text: 'int matrix[][3] = {{1,2,3}, {4,5,6}};', description: '二维数组初始化' }
                ];
            }
            // 错误处理
            else if (lastWord.includes('err')) {
                predictions = [
                    { text: 'if (ptr == NULL) {\n    perror("Error");\n    exit(EXIT_FAILURE);\n}', description: '空指针检查' },
                    { text: 'if (fclose(fp) == EOF) {\n    perror("Error");\n    exit(EXIT_FAILURE);\n}', description: '文件关闭检查' },
                    { text: 'if (scanf("%d", &num) != 1) {\n    fprintf(stderr, "Input error\\n");\n    exit(EXIT_FAILURE);\n}', description: '输入错误检查' },
                    { text: 'errno = 0;\nif (error_condition) {\n    perror("Error");\n}', description: '使用errno' }
                ];
            }
        }

        if (predictions.length === 0) {
            predictions = this.getGenericPredictions(language);
        }

        return predictions.slice(0, this.maxPredictions);
    }

    getGenericPredictions(language) {
        const predictions = {
            'c': [
                { text: 'if (condition) {\n    \n}', description: '条件语句' },
                { text: 'while (condition) {\n    \n}', description: '循环语句' },
                { text: 'for(int i = 0; i < n; i++) {\n    \n}', description: 'for循环' },
                { text: 'switch (variable) {\n    case value:\n        break;\n    default:\n        break;\n}', description: '分支语句' },
                { text: '#define MACRO value', description: '宏定义' },
                { text: 'typedef struct {\n    \n} Name;', description: '类型定义' },
                { text: 'do {\n    \n} while(condition);', description: 'do-while循环' },
                { text: 'return value;', description: '返回语句' },
                { text: 'break;', description: '跳出循环' },
                { text: 'continue;', description: '继续下一次循环' },
                { text: 'goto label;', description: '跳转语句' },
                { text: 'label:', description: '标签定义' }
            ],
            'javascript': [
                { text: 'if () {\n    \n}', description: '条件语句' },
                { text: 'try {\n    \n} catch (error) {\n    \n}', description: '异常处理' },
                { text: 'async function name() {\n    \n}', description: '异步函数' }
            ],
            'python': [
                { text: 'def function_name():\n    ', description: '函数定义' },
                { text: 'if condition:\n    ', description: '条件语句' },
                { text: 'for item in items:\n    ', description: '循环语句' }
            ]
        };

        return predictions[language] || [];
    }

    applyPrediction(prediction) {
        return prediction.text;
    }
}

// 导出预测器
window.AICodePredictor = AICodePredictor; 