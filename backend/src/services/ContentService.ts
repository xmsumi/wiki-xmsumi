import { MarkdownService, MarkdownRenderResult } from './MarkdownService';
import { DocumentContentType } from '@/types/document';
import { logger } from '@/utils/logger';

/**
 * 内容处理结果接口
 */
export interface ContentProcessResult {
  processedContent: string;
  summary: string;
  tableOfContents: any[];
  wordCount: number;
  readingTime: number;
  contentType: DocumentContentType;
}

/**
 * 内容安全检查结果接口
 */
export interface ContentSecurityResult {
  isSafe: boolean;
  issues: string[];
  sanitizedContent?: string;
}

/**
 * 内容处理服务
 */
export class ContentService {
  private markdownService: MarkdownService;

  constructor() {
    this.markdownService = new MarkdownService();
  }

  /**
   * 处理文档内容
   */
  async processContent(
    content: string, 
    contentType: DocumentContentType = DocumentContentType.MARKDOWN
  ): Promise<ContentProcessResult> {
    try {
      let processedContent: string;
      let tableOfContents: any[] = [];
      let wordCount: number;
      let readingTime: number;
      let summary: string;

      switch (contentType) {
        case DocumentContentType.MARKDOWN:
          const markdownResult = await this.markdownService.renderMarkdown(content);
          processedContent = markdownResult.html;
          tableOfContents = markdownResult.tableOfContents;
          wordCount = markdownResult.wordCount;
          readingTime = markdownResult.readingTime;
          summary = this.markdownService.generateSummary(content);
          break;

        case DocumentContentType.HTML:
          processedContent = await this.processHtmlContent(content);
          wordCount = this.countHtmlWords(content);
          readingTime = this.calculateReadingTime(wordCount);
          summary = this.extractHtmlSummary(content);
          tableOfContents = this.extractHtmlHeadings(content);
          break;

        case DocumentContentType.PLAIN_TEXT:
          processedContent = this.processPlainTextContent(content);
          wordCount = this.countPlainTextWords(content);
          readingTime = this.calculateReadingTime(wordCount);
          summary = this.extractPlainTextSummary(content);
          break;

        default:
          throw new Error(`不支持的内容类型: ${contentType}`);
      }

      return {
        processedContent,
        summary,
        tableOfContents,
        wordCount,
        readingTime,
        contentType
      };
    } catch (error) {
      logger.error('内容处理失败:', error);
      throw error;
    }
  }

  /**
   * 内容安全检查
   */
  async checkContentSecurity(content: string, contentType: DocumentContentType): Promise<ContentSecurityResult> {
    const issues: string[] = [];
    let isSafe = true;

    try {
      // 检查恶意脚本
      if (this.containsMaliciousScript(content)) {
        issues.push('检测到潜在的恶意脚本');
        isSafe = false;
      }

      // 检查外部链接
      const externalLinks = this.extractExternalLinks(content);
      if (externalLinks.length > 10) {
        issues.push(`包含过多外部链接 (${externalLinks.length}个)`);
      }

      // 检查文件大小
      const contentSize = Buffer.byteLength(content, 'utf8');
      if (contentSize > 1024 * 1024) { // 1MB
        issues.push('内容大小超过限制');
        isSafe = false;
      }

      // 检查特殊字符
      if (this.containsSuspiciousPatterns(content)) {
        issues.push('包含可疑的字符模式');
      }

      // 如果内容不安全，尝试清理
      let sanitizedContent: string | undefined;
      if (!isSafe && contentType === DocumentContentType.HTML) {
        sanitizedContent = await this.sanitizeHtmlContent(content);
      }

      return {
        isSafe,
        issues,
        sanitizedContent
      };
    } catch (error) {
      logger.error('内容安全检查失败:', error);
      return {
        isSafe: false,
        issues: ['安全检查过程中发生错误']
      };
    }
  }

  /**
   * 处理HTML内容
   */
  private async processHtmlContent(content: string): Promise<string> {
    // 使用DOMPurify清理HTML内容
    const { JSDOM } = await import('jsdom');
    const DOMPurify = (await import('dompurify')).default;
    
    const window = new JSDOM('').window;
    const purify = DOMPurify(window as any);
    
    const config = {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'strong', 'em', 'u', 's', 'del', 'ins',
        'a', 'img', 'video', 'audio',
        'ul', 'ol', 'li', 'dl', 'dt', 'dd',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'blockquote', 'pre', 'code',
        'div', 'span', 'hr'
      ],
      ALLOWED_ATTR: [
        'href', 'title', 'alt', 'src', 'width', 'height',
        'class', 'id', 'target', 'rel'
      ]
    };

    return purify.sanitize(content, config);
  }

  /**
   * 处理纯文本内容
   */
  private processPlainTextContent(content: string): string {
    // 转义HTML字符
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\n/g, '<br>'); // 保留换行
  }

  /**
   * 检查恶意脚本
   */
  private containsMaliciousScript(content: string): boolean {
    const maliciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /eval\s*\(/gi,
      /document\.cookie/gi,
      /window\.location/gi,
      /alert\s*\(/gi
    ];

    return maliciousPatterns.some(pattern => pattern.test(content));
  }

  /**
   * 提取外部链接
   */
  private extractExternalLinks(content: string): string[] {
    const linkRegex = /https?:\/\/[^\s<>"']+/gi;
    const matches = content.match(linkRegex) || [];
    
    // 过滤掉本站链接
    return matches.filter(link => {
      try {
        const url = new URL(link);
        return url.hostname !== 'localhost' && !url.hostname.includes('127.0.0.1');
      } catch {
        return false;
      }
    });
  }

  /**
   * 检查可疑模式
   */
  private containsSuspiciousPatterns(content: string): boolean {
    const suspiciousPatterns = [
      /\x00/g, // null字符
      /[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, // 控制字符
      /(?:union|select|insert|update|delete|drop|create|alter)\s+/gi, // SQL注入
      /(?:base64|eval|exec|system|shell_exec)/gi // 代码执行
    ];

    return suspiciousPatterns.some(pattern => pattern.test(content));
  }

  /**
   * 清理HTML内容
   */
  private async sanitizeHtmlContent(content: string): Promise<string> {
    return this.processHtmlContent(content);
  }

  /**
   * 计算HTML内容字数
   */
  private countHtmlWords(content: string): number {
    // 移除HTML标签
    const plainText = content.replace(/<[^>]*>/g, '');
    return this.countPlainTextWords(plainText);
  }

  /**
   * 计算纯文本字数
   */
  private countPlainTextWords(content: string): number {
    const cleanText = content.replace(/\s+/g, ' ').trim();
    
    // 分别计算中文字符和英文单词
    const chineseChars = (cleanText.match(/[\u4e00-\u9fff]/g) || []).length;
    const englishWords = (cleanText.replace(/[\u4e00-\u9fff]/g, '').match(/\b\w+\b/g) || []).length;

    return chineseChars + englishWords;
  }

  /**
   * 计算阅读时间
   */
  private calculateReadingTime(wordCount: number): number {
    const averageReadingSpeed = 250; // 每分钟字数
    const minutes = Math.ceil(wordCount / averageReadingSpeed);
    return Math.max(1, minutes);
  }

  /**
   * 提取HTML摘要
   */
  private extractHtmlSummary(content: string, maxLength: number = 200): string {
    const plainText = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    
    if (plainText.length <= maxLength) {
      return plainText;
    }

    return plainText.substring(0, maxLength) + '...';
  }

  /**
   * 提取纯文本摘要
   */
  private extractPlainTextSummary(content: string, maxLength: number = 200): string {
    const cleanText = content.replace(/\s+/g, ' ').trim();
    
    if (cleanText.length <= maxLength) {
      return cleanText;
    }

    return cleanText.substring(0, maxLength) + '...';
  }

  /**
   * 提取HTML标题
   */
  private extractHtmlHeadings(content: string): any[] {
    const headingRegex = /<h([1-6])[^>]*id="([^"]*)"[^>]*>(.*?)<\/h[1-6]>/gi;
    const headings: any[] = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = parseInt(match[1]);
      const id = match[2];
      const text = match[3].replace(/<[^>]*>/g, ''); // 移除HTML标签

      headings.push({ level, id, text });
    }

    return this.buildHeadingTree(headings);
  }

  /**
   * 构建标题树结构
   */
  private buildHeadingTree(headings: any[]): any[] {
    const tree: any[] = [];
    const stack: any[] = [];

    for (const heading of headings) {
      const item = {
        id: heading.id,
        text: heading.text,
        level: heading.level,
        children: []
      };

      // 找到合适的父级
      while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
        stack.pop();
      }

      if (stack.length === 0) {
        tree.push(item);
      } else {
        const parent = stack[stack.length - 1];
        parent.children.push(item);
      }

      stack.push(item);
    }

    return tree;
  }

  /**
   * 验证内容格式
   */
  validateContentFormat(content: string, contentType: DocumentContentType): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!content || content.trim().length === 0) {
      errors.push('内容不能为空');
      return { isValid: false, errors };
    }

    switch (contentType) {
      case DocumentContentType.MARKDOWN:
        // 检查Markdown语法
        if (this.hasInvalidMarkdownSyntax(content)) {
          errors.push('Markdown语法格式错误');
        }
        break;

      case DocumentContentType.HTML:
        // 检查HTML语法
        if (this.hasInvalidHtmlSyntax(content)) {
          errors.push('HTML语法格式错误');
        }
        break;

      case DocumentContentType.PLAIN_TEXT:
        // 纯文本通常没有格式要求
        break;
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * 检查Markdown语法
   */
  private hasInvalidMarkdownSyntax(content: string): boolean {
    // 检查未闭合的代码块
    const codeBlockMatches = content.match(/```/g);
    if (codeBlockMatches && codeBlockMatches.length % 2 !== 0) {
      return true;
    }

    // 检查未闭合的行内代码
    const inlineCodeMatches = content.match(/(?<!\\)`/g);
    if (inlineCodeMatches && inlineCodeMatches.length % 2 !== 0) {
      return true;
    }

    return false;
  }

  /**
   * 检查HTML语法
   */
  private hasInvalidHtmlSyntax(content: string): boolean {
    try {
      const { JSDOM } = require('jsdom');
      const dom = new JSDOM(content);
      
      // 如果能成功解析，说明语法基本正确
      return false;
    } catch (error) {
      return true;
    }
  }
}