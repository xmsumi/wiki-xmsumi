import { ContentService } from '@/services/ContentService';
import { DocumentContentType } from '@/types/document';

describe('ContentService', () => {
  let contentService: ContentService;

  beforeEach(() => {
    contentService = new ContentService();
  });

  describe('processContent', () => {
    it('应该处理Markdown内容', async () => {
      const content = `# 测试标题
这是测试内容。

## 子标题
更多内容。`;

      const result = await contentService.processContent(content, DocumentContentType.MARKDOWN);

      expect(result.contentType).toBe(DocumentContentType.MARKDOWN);
      expect(result.processedContent).toContain('<h1');
      expect(result.processedContent).toContain('<h2');
      expect(result.summary).toContain('测试标题');
      expect(result.tableOfContents).toHaveLength(1);
      expect(result.wordCount).toBeGreaterThan(0);
      expect(result.readingTime).toBeGreaterThan(0);
    });

    it('应该处理HTML内容', async () => {
      const content = `<h1>测试标题</h1>
<p>这是<strong>HTML</strong>内容。</p>
<script>alert('恶意脚本');</script>`;

      const result = await contentService.processContent(content, DocumentContentType.HTML);

      expect(result.contentType).toBe(DocumentContentType.HTML);
      expect(result.processedContent).toContain('<h1>测试标题</h1>');
      expect(result.processedContent).toContain('<strong>HTML</strong>');
      expect(result.processedContent).not.toContain('<script>'); // 应该被清理
      expect(result.summary).toContain('测试标题');
      expect(result.wordCount).toBeGreaterThan(0);
    });

    it('应该处理纯文本内容', async () => {
      const content = `测试标题
这是纯文本内容。
包含<特殊>字符&符号。`;

      const result = await contentService.processContent(content, DocumentContentType.PLAIN_TEXT);

      expect(result.contentType).toBe(DocumentContentType.PLAIN_TEXT);
      expect(result.processedContent).toContain('&lt;特殊&gt;');
      expect(result.processedContent).toContain('&amp;');
      expect(result.processedContent).toContain('<br>');
      expect(result.summary).toContain('测试标题');
      expect(result.wordCount).toBeGreaterThan(0);
    });

    it('应该处理不支持的内容类型', async () => {
      const content = '测试内容';

      await expect(
        contentService.processContent(content, 'unsupported' as DocumentContentType)
      ).rejects.toThrow('不支持的内容类型');
    });
  });

  describe('checkContentSecurity', () => {
    it('应该检测恶意脚本', async () => {
      const maliciousContent = `
        <script>alert('XSS');</script>
        <img src="x" onerror="alert('XSS')">
        <a href="javascript:alert('XSS')">链接</a>
      `;

      const result = await contentService.checkContentSecurity(maliciousContent, DocumentContentType.HTML);

      expect(result.isSafe).toBe(false);
      expect(result.issues).toContain('检测到潜在的恶意脚本');
      expect(result.sanitizedContent).toBeDefined();
      expect(result.sanitizedContent).not.toContain('<script>');
    });

    it('应该检测过多外部链接', async () => {
      const content = Array(12).fill('https://example.com/link').join(' ');

      const result = await contentService.checkContentSecurity(content, DocumentContentType.MARKDOWN);

      expect(result.issues.some(issue => issue.includes('过多外部链接'))).toBe(true);
    });

    it('应该检测内容大小限制', async () => {
      const largeContent = 'a'.repeat(1024 * 1024 + 1); // 超过1MB

      const result = await contentService.checkContentSecurity(largeContent, DocumentContentType.PLAIN_TEXT);

      expect(result.isSafe).toBe(false);
      expect(result.issues).toContain('内容大小超过限制');
    });

    it('应该检测可疑字符模式', async () => {
      const suspiciousContent = `
        SELECT * FROM users;
        eval('malicious code');
        \x00null字符
      `;

      const result = await contentService.checkContentSecurity(suspiciousContent, DocumentContentType.PLAIN_TEXT);

      expect(result.issues.some(issue => issue.includes('可疑的字符模式'))).toBe(true);
    });

    it('应该通过安全内容检查', async () => {
      const safeContent = `# 安全标题
这是安全的内容，包含正常的文本和链接。
[内部链接](/internal-page)`;

      const result = await contentService.checkContentSecurity(safeContent, DocumentContentType.MARKDOWN);

      expect(result.isSafe).toBe(true);
      expect(result.issues).toHaveLength(0);
    });
  });

  describe('validateContentFormat', () => {
    it('应该验证有效的Markdown格式', () => {
      const validMarkdown = `# 标题
正常的Markdown内容
\`\`\`javascript
console.log('代码块');
\`\`\``;

      const result = contentService.validateContentFormat(validMarkdown, DocumentContentType.MARKDOWN);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该检测无效的Markdown格式', () => {
      const invalidMarkdown = `# 标题
\`\`\`javascript
未闭合的代码块`;

      const result = contentService.validateContentFormat(invalidMarkdown, DocumentContentType.MARKDOWN);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Markdown语法格式错误');
    });

    it('应该检测未闭合的行内代码', () => {
      const invalidMarkdown = '这是`未闭合的行内代码';

      const result = contentService.validateContentFormat(invalidMarkdown, DocumentContentType.MARKDOWN);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Markdown语法格式错误');
    });

    it('应该验证有效的HTML格式', () => {
      const validHtml = '<h1>标题</h1><p>段落</p>';

      const result = contentService.validateContentFormat(validHtml, DocumentContentType.HTML);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该验证纯文本格式', () => {
      const plainText = '这是纯文本内容，没有格式要求。';

      const result = contentService.validateContentFormat(plainText, DocumentContentType.PLAIN_TEXT);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该拒绝空内容', () => {
      const emptyContent = '';

      const result = contentService.validateContentFormat(emptyContent, DocumentContentType.MARKDOWN);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('内容不能为空');
    });

    it('应该拒绝仅包含空白字符的内容', () => {
      const whitespaceContent = '   \n\t  ';

      const result = contentService.validateContentFormat(whitespaceContent, DocumentContentType.MARKDOWN);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('内容不能为空');
    });
  });

  describe('字数统计', () => {
    it('应该正确统计中英文混合内容', async () => {
      const content = 'Hello 世界 this is 测试 content 内容';

      const result = await contentService.processContent(content, DocumentContentType.PLAIN_TEXT);

      expect(result.wordCount).toBeGreaterThan(0);
      // 应该包含英文单词和中文字符
      expect(result.wordCount).toBeGreaterThan(6); // 至少6个英文单词 + 中文字符
    });

    it('应该正确计算阅读时间', async () => {
      const shortContent = '短内容';
      const longContent = '这是一段很长的内容。'.repeat(100);

      const shortResult = await contentService.processContent(shortContent, DocumentContentType.PLAIN_TEXT);
      const longResult = await contentService.processContent(longContent, DocumentContentType.PLAIN_TEXT);

      expect(shortResult.readingTime).toBe(1); // 最少1分钟
      expect(longResult.readingTime).toBeGreaterThan(shortResult.readingTime);
    });
  });

  describe('摘要生成', () => {
    it('应该生成适当长度的摘要', async () => {
      const longContent = `这是第一句话。这是第二句话。这是第三句话。${'这是很长的内容。'.repeat(50)}`;

      const result = await contentService.processContent(longContent, DocumentContentType.PLAIN_TEXT);

      expect(result.summary.length).toBeLessThanOrEqual(203); // 200 + '...'
      expect(result.summary).toContain('这是第一句话');
    });

    it('应该处理短内容的摘要', async () => {
      const shortContent = '这是短内容。';

      const result = await contentService.processContent(shortContent, DocumentContentType.PLAIN_TEXT);

      expect(result.summary).toBe('这是短内容。');
    });
  });

  describe('错误处理', () => {
    it('应该处理内容处理过程中的错误', async () => {
      // 模拟一个会导致错误的情况
      const problematicContent = null as any;

      await expect(
        contentService.processContent(problematicContent, DocumentContentType.MARKDOWN)
      ).rejects.toThrow();
    });

    it('应该处理安全检查过程中的错误', async () => {
      // 安全检查应该有错误处理机制
      const result = await contentService.checkContentSecurity('正常内容', DocumentContentType.MARKDOWN);

      expect(result).toBeDefined();
      expect(typeof result.isSafe).toBe('boolean');
      expect(Array.isArray(result.issues)).toBe(true);
    });
  });
});