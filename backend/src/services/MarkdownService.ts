import { marked } from 'marked';
import hljs from 'highlight.js';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { logger } from '@/utils/logger';

// 创建DOM环境用于DOMPurify
const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

/**
 * 文档大纲项接口
 */
export interface TableOfContentsItem {
  id: string;
  text: string;
  level: number;
  children?: TableOfContentsItem[];
}

/**
 * Markdown渲染结果接口
 */
export interface MarkdownRenderResult {
  html: string;
  tableOfContents: TableOfContentsItem[];
  wordCount: number;
  readingTime: number; // 预估阅读时间（分钟）
}

/**
 * Markdown处理服务
 */
export class MarkdownService {
  private headings: Array<{ id: string; text: string; level: number }> = [];

  constructor() {
    this.configureMarked();
  }

  /**
   * 配置marked选项
   */
  private configureMarked(): void {
    // 配置marked的基本选项
    marked.setOptions({
      breaks: true,
      gfm: true
    });
  }



  /**
   * 渲染Markdown内容
   */
  async renderMarkdown(content: string): Promise<MarkdownRenderResult> {
    try {
      // 重置标题数组
      this.headings = [];
      
      // 预处理内容
      const preprocessedContent = this.preprocessContent(content);
      
      // 渲染Markdown
      const rawHtml = await marked(preprocessedContent);
      
      // 处理HTML，添加标题ID和提取标题信息
      const processedHtml = this.processHtmlHeadings(rawHtml);
      
      // 清理HTML内容
      const cleanHtml = this.sanitizeHtml(processedHtml);
      
      // 生成目录
      const tableOfContents = this.generateTableOfContents();
      
      // 计算字数和阅读时间
      const wordCount = this.countWords(content);
      const readingTime = this.calculateReadingTime(wordCount);
      
      return {
        html: cleanHtml,
        tableOfContents,
        wordCount,
        readingTime
      };
    } catch (error) {
      logger.error('Markdown渲染失败:', error);
      throw new Error('Markdown渲染失败');
    }
  }

  /**
   * 预处理Markdown内容
   */
  private preprocessContent(content: string): string {
    // 处理任务列表
    content = content.replace(/^(\s*)-\s+\[([ x])\]\s+(.+)$/gm, (match, indent, checked, text) => {
      const isChecked = checked.toLowerCase() === 'x';
      return `${indent}- <input type="checkbox" ${isChecked ? 'checked' : ''} disabled> ${text}`;
    });

    // 处理警告框语法 (如 :::warning 内容 :::)
    content = content.replace(/^:::(warning|info|tip|danger)\s*\n([\s\S]*?)\n:::$/gm, (match, type, text) => {
      return `<div class="alert alert-${type}">\n${text.trim()}\n</div>`;
    });

    // 处理脚注
    content = content.replace(/\[\^([^\]]+)\]/g, '<sup><a href="#fn-$1" id="ref-$1">$1</a></sup>');

    return content;
  }

  /**
   * 处理HTML中的标题，添加ID和提取标题信息
   */
  private processHtmlHeadings(html: string): string {
    // 匹配所有标题标签
    const headingRegex = /<h([1-6])([^>]*)>(.*?)<\/h[1-6]>/gi;
    
    return html.replace(headingRegex, (match, level, attributes, text) => {
      const cleanText = text.replace(/<[^>]*>/g, ''); // 移除HTML标签
      const id = this.generateHeadingId(cleanText);
      
      // 记录标题用于生成目录
      this.headings.push({ 
        id, 
        text: cleanText, 
        level: parseInt(level) 
      });
      
      // 检查是否已经有ID属性
      const hasId = /id\s*=\s*["'][^"']*["']/.test(attributes);
      const idAttr = hasId ? '' : ` id="${id}"`;
      
      return `<h${level}${attributes}${idAttr} class="heading-${level}">
        <a href="#${id}" class="heading-anchor" aria-hidden="true">#</a>
        ${text}
      </h${level}>`;
    });
  }

  /**
   * 清理HTML内容
   */
  private sanitizeHtml(html: string): string {
    const config = {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'strong', 'em', 'u', 's', 'del', 'ins',
        'a', 'img', 'video', 'audio',
        'ul', 'ol', 'li', 'dl', 'dt', 'dd',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'blockquote', 'pre', 'code',
        'div', 'span', 'hr',
        'input', 'button', 'svg', 'path', 'rect'
      ],
      ALLOWED_ATTR: [
        'href', 'title', 'alt', 'src', 'width', 'height',
        'class', 'id', 'style', 'target', 'rel',
        'type', 'checked', 'disabled',
        'onclick', 'onerror', 'loading',
        'viewBox', 'fill', 'stroke', 'stroke-width',
        'x', 'y', 'rx', 'ry', 'd'
      ],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
    };

    return purify.sanitize(html, config);
  }

  /**
   * 生成标题ID
   */
  private generateHeadingId(text: string): string {
    // 移除特殊字符，保留中文、英文、数字和连字符
    let id = text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '');

    // 如果ID为空，使用随机字符串
    if (!id) {
      id = 'heading-' + Math.random().toString(36).substr(2, 9);
    }

    // 确保ID唯一
    const existingIds = this.headings.map(h => h.id);
    let uniqueId = id;
    let counter = 1;
    
    while (existingIds.includes(uniqueId)) {
      uniqueId = `${id}-${counter}`;
      counter++;
    }

    return uniqueId;
  }

  /**
   * 生成目录
   */
  private generateTableOfContents(): TableOfContentsItem[] {
    if (this.headings.length === 0) {
      return [];
    }

    const toc: TableOfContentsItem[] = [];
    const stack: TableOfContentsItem[] = [];

    for (const heading of this.headings) {
      const item: TableOfContentsItem = {
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
        toc.push(item);
      } else {
        const parent = stack[stack.length - 1];
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(item);
      }

      stack.push(item);
    }

    return toc;
  }

  /**
   * 计算字数
   */
  private countWords(content: string): number {
    // 移除Markdown标记
    const plainText = content
      .replace(/```[\s\S]*?```/g, '') // 移除代码块
      .replace(/`[^`]+`/g, '') // 移除行内代码
      .replace(/!\[.*?\]\(.*?\)/g, '') // 移除图片
      .replace(/\[.*?\]\(.*?\)/g, '') // 移除链接
      .replace(/[#*_~`]/g, '') // 移除Markdown标记
      .replace(/\s+/g, ' ') // 合并空白字符
      .trim();

    // 分别计算中文字符和英文单词
    const chineseChars = (plainText.match(/[\u4e00-\u9fff]/g) || []).length;
    const englishWords = (plainText.replace(/[\u4e00-\u9fff]/g, '').match(/\b\w+\b/g) || []).length;

    return chineseChars + englishWords;
  }

  /**
   * 计算预估阅读时间
   */
  private calculateReadingTime(wordCount: number): number {
    // 假设中文阅读速度为每分钟300字，英文为每分钟200词
    const averageReadingSpeed = 250; // 综合阅读速度
    const minutes = Math.ceil(wordCount / averageReadingSpeed);
    return Math.max(1, minutes); // 至少1分钟
  }

  /**
   * 提取纯文本内容
   */
  extractPlainText(content: string): string {
    return content
      .replace(/```[\s\S]*?```/g, '') // 移除代码块
      .replace(/`[^`]+`/g, '') // 移除行内代码
      .replace(/!\[.*?\]\(.*?\)/g, '') // 移除图片
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 保留链接文本
      .replace(/[#*_~`]/g, '') // 移除Markdown标记
      .replace(/\n+/g, ' ') // 将换行符替换为空格
      .replace(/\s+/g, ' ') // 合并空白字符
      .trim();
  }

  /**
   * 生成文档摘要
   */
  generateSummary(content: string, maxLength: number = 200): string {
    const plainText = this.extractPlainText(content);
    
    if (plainText.length <= maxLength) {
      return plainText;
    }

    // 尝试在句号处截断
    const sentences = plainText.split(/[。！？.!?]/);
    let summary = '';
    
    for (const sentence of sentences) {
      if ((summary + sentence).length > maxLength) {
        break;
      }
      summary += sentence + '。';
    }

    // 如果没有找到合适的句号，直接截断
    if (summary.length === 0) {
      summary = plainText.substring(0, maxLength) + '...';
    }

    return summary.trim();
  }
}