import { MarkdownService } from '@/services/MarkdownService';

describe('MarkdownService', () => {
  let markdownService: MarkdownService;

  beforeEach(() => {
    markdownService = new MarkdownService();
  });

  describe('renderMarkdown', () => {
    it('应该正确渲染基本Markdown', async () => {
      const content = `# 标题1
## 标题2
这是一段**粗体**文本和*斜体*文本。

- 列表项1
- 列表项2

\`\`\`javascript
console.log('Hello World');
\`\`\``;

      const result = await markdownService.renderMarkdown(content);

      expect(result.html).toContain('<h1 id="标题1"');
      expect(result.html).toContain('<h2 id="标题2"');
      expect(result.html).toContain('<strong>粗体</strong>');
      expect(result.html).toContain('<em>斜体</em>');
      expect(result.html).toContain('<ul>');
      expect(result.html).toContain('<li>列表项1</li>');
      expect(result.html).toContain('console.log');
      expect(result.tableOfContents).toHaveLength(2);
      expect(result.wordCount).toBeGreaterThan(0);
      expect(result.readingTime).toBeGreaterThan(0);
    });

    it('应该生成正确的目录结构', async () => {
      const content = `# 一级标题
## 二级标题1
### 三级标题1
### 三级标题2
## 二级标题2`;

      const result = await markdownService.renderMarkdown(content);

      expect(result.tableOfContents).toHaveLength(1);
      expect(result.tableOfContents[0].text).toBe('一级标题');
      expect(result.tableOfContents[0].children).toHaveLength(2);
      expect(result.tableOfContents[0].children![0].children).toHaveLength(2);
    });

    it('应该正确处理代码高亮', async () => {
      const content = `\`\`\`javascript
function hello() {
  console.log('Hello World');
}
\`\`\``;

      const result = await markdownService.renderMarkdown(content);

      expect(result.html).toContain('class="hljs language-javascript"');
      expect(result.html).toContain('function');
      expect(result.html).toContain('console.log');
    });

    it('应该处理任务列表', async () => {
      const content = `- [x] 已完成任务
- [ ] 未完成任务`;

      const result = await markdownService.renderMarkdown(content);

      expect(result.html).toContain('type="checkbox"');
      expect(result.html).toContain('checked');
      expect(result.html).toContain('disabled');
    });

    it('应该处理表格', async () => {
      const content = `| 列1 | 列2 |
|-----|-----|
| 值1 | 值2 |`;

      const result = await markdownService.renderMarkdown(content);

      expect(result.html).toContain('<table');
      expect(result.html).toContain('<thead>');
      expect(result.html).toContain('<tbody>');
      expect(result.html).toContain('table-responsive');
    });

    it('应该处理链接安全属性', async () => {
      const content = `[内部链接](/internal)
[外部链接](https://example.com)`;

      const result = await markdownService.renderMarkdown(content);

      expect(result.html).toContain('target="_blank"');
      expect(result.html).toContain('rel="noopener noreferrer"');
    });

    it('应该处理图片懒加载', async () => {
      const content = `![测试图片](https://example.com/image.jpg "图片标题")`;

      const result = await markdownService.renderMarkdown(content);

      expect(result.html).toContain('loading="lazy"');
      expect(result.html).toContain('onerror=');
      expect(result.html).toContain('alt="测试图片"');
      expect(result.html).toContain('title="图片标题"');
    });
  });

  describe('extractPlainText', () => {
    it('应该提取纯文本内容', () => {
      const content = `# 标题
这是**粗体**和*斜体*文本。
\`\`\`
代码块
\`\`\`
[链接](http://example.com)
![图片](image.jpg)`;

      const plainText = markdownService.extractPlainText(content);

      expect(plainText).not.toContain('#');
      expect(plainText).not.toContain('**');
      expect(plainText).not.toContain('*');
      expect(plainText).not.toContain('```');
      expect(plainText).not.toContain('[');
      expect(plainText).not.toContain('!');
      expect(plainText).toContain('标题');
      expect(plainText).toContain('粗体');
      expect(plainText).toContain('斜体');
      expect(plainText).toContain('链接');
    });
  });

  describe('generateSummary', () => {
    it('应该生成正确长度的摘要', () => {
      const content = '这是一段很长的文本内容。'.repeat(20);
      const summary = markdownService.generateSummary(content, 50);

      expect(summary.length).toBeLessThanOrEqual(53); // 50 + '...'
      expect(summary).toContain('这是一段很长的文本内容');
    });

    it('应该在句号处截断', () => {
      const content = '第一句话。第二句话。第三句话。';
      const summary = markdownService.generateSummary(content, 15);

      expect(summary).toBe('第一句话。');
    });

    it('应该处理短文本', () => {
      const content = '短文本';
      const summary = markdownService.generateSummary(content, 100);

      expect(summary).toBe('短文本');
    });
  });

  describe('字数统计和阅读时间', () => {
    it('应该正确计算中英文混合内容的字数', async () => {
      const content = `# Title 标题
This is English text. 这是中文文本。
- List item 列表项
- Another item 另一项`;

      const result = await markdownService.renderMarkdown(content);

      expect(result.wordCount).toBeGreaterThan(0);
      expect(result.readingTime).toBeGreaterThan(0);
    });

    it('应该排除代码块的字数统计', async () => {
      const contentWithCode = `文本内容
\`\`\`javascript
// 这是很长的代码注释
function veryLongFunctionName() {
  console.log('这不应该被计入字数统计');
}
\`\`\`
更多文本内容`;

      const contentWithoutCode = `文本内容
更多文本内容`;

      const resultWithCode = await markdownService.renderMarkdown(contentWithCode);
      const resultWithoutCode = await markdownService.renderMarkdown(contentWithoutCode);

      // 有代码的版本字数应该接近无代码版本
      expect(Math.abs(resultWithCode.wordCount - resultWithoutCode.wordCount)).toBeLessThan(5);
    });
  });

  describe('错误处理', () => {
    it('应该处理空内容', async () => {
      const result = await markdownService.renderMarkdown('');

      expect(result.html).toBe('');
      expect(result.tableOfContents).toEqual([]);
      expect(result.wordCount).toBe(0);
      expect(result.readingTime).toBe(1); // 最少1分钟
    });

    it('应该处理无效的Markdown语法', async () => {
      const content = '# 标题\n```\n未闭合的代码块';

      // 应该不抛出错误
      const result = await markdownService.renderMarkdown(content);
      expect(result).toBeDefined();
      expect(result.html).toBeDefined();
    });
  });
});