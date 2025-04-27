/**
 * Markdown转HTML转换工具
 * 将Markdown格式文本转换为HTML
 */

// 将Markdown转换为HTML的函数
window.markdownToHtml = function(markdown) {
  if (!markdown) return '';

  // 预处理：清理输入
  let html = markdown.trim();

  // 处理代码块 (```code```) - 最先处理以避免冲突
  html = html.replace(/```([\s\S]*?)```/g, function(match, codeContent) {
    // 确保代码内容不被其他转换规则处理
    return `<pre><code>${codeContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
  });

  // 处理内联代码 (`code`)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // 处理标题
  html = html
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
    .replace(/^##### (.*$)/gim, '<h5>$1</h5>')
    .replace(/^###### (.*$)/gim, '<h6>$1</h6>');

  // 处理图片
  html = html.replace(/!\[(.*?)\]\(([^\)]+)\)/g, '<img src="$2" alt="$1" class="markdown-image">');

  // 处理粗体和斜体
  html = html
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>');

  // 改进表格处理 - 表格需要特殊处理
  // 1. 收集所有表格行
  const tableRows = [];
  let insideTable = false;
  let headerRow = null;

  html.split('\n').forEach(line => {
    // 检测表格行 (| 开头的行)
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const cells = line.trim()
        .slice(1, -1)  // 移除首尾的 |
        .split('|')
        .map(cell => cell.trim());

      // 检测是否是分隔行 (如 |---|---|---)
      const isSeparator = cells.every(cell => /^[-:]+$/.test(cell));

      if (!insideTable) {
        insideTable = true;
        // 保存头部行
        headerRow = cells;
      } else if (isSeparator) {
        // 忽略分隔行，但保持表格状态
      } else {
        // 添加数据行
        tableRows.push(cells);
      }
    } else if (insideTable) {
      // 处理表格结束
      insideTable = false;
    }
  });

  // 2. 如果有表格数据，生成HTML表格
  if (headerRow && tableRows.length > 0) {
    let tableHtml = '<table class="md-table"><thead><tr>';

    // 添加表头
    headerRow.forEach(cell => {
      tableHtml += `<th>${cell}</th>`;
    });

    tableHtml += '</tr></thead><tbody>';

    // 添加数据行
    tableRows.forEach(row => {
      tableHtml += '<tr>';
      row.forEach((cell, index) => {
        // 确保单元格数量与表头一致
        if (index < headerRow.length) {
          tableHtml += `<td>${cell}</td>`;
        }
      });
      // 如果行中的单元格少于表头，添加空单元格
      for (let i = row.length; i < headerRow.length; i++) {
        tableHtml += '<td></td>';
      }
      tableHtml += '</tr>';
    });

    tableHtml += '</tbody></table>';

    // 替换原始表格文本为HTML表格
    html = html.replace(/\|.*\|(\s*\|.*\|)+/g, tableHtml);
  }

  // 处理列表 - 改进列表处理
  // 无序列表
  html = html.replace(/^\s*[-*+]\s+(.*)/gm, function(match, content) {
    return `<ul><li>${content}</li></ul>`;
  });

  // 有序列表
  html = html.replace(/^\s*\d+\.\s+(.*)/gm, function(match, content) {
    return `<ol><li>${content}</li></ol>`;
  });

  // 合并相邻列表
  html = html.replace(/<\/ul>\s*<ul>/g, '');
  html = html.replace(/<\/ol>\s*<ol>/g, '');

  // 处理水平线
  html = html.replace(/^(-{3,}|_{3,}|\*{3,})$/gm, '<hr>');

  // 处理段落 (非列表、非标题等行)
  html = html.replace(/^(?!<h|<ul|<ol|<li|<hr|<table|<pre)(.+)$/gm, '<p>$1</p>');

  // 清理空段落
  html = html.replace(/<p>\s*<\/p>/g, '');

  return html;
}; 