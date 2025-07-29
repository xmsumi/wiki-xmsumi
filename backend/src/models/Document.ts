import { 
  DocumentEntity, 
  DocumentResponse, 
  CreateDocumentRequest, 
  UpdateDocumentRequest,
  DocumentStatus,
  DocumentContentType 
} from '@/types/document';

/**
 * 文档模型类
 */
export class Document {
  public id: number;
  public title: string;
  public slug: string;
  public content: string;
  public content_type: DocumentContentType;
  public directory_id?: number;
  public author_id: number;
  public status: DocumentStatus;
  public tags: string[];
  public meta_data: Record<string, any>;
  public created_at: Date;
  public updated_at: Date;

  /**
   * 构造函数
   */
  constructor(data: DocumentEntity) {
    this.id = data.id;
    this.title = data.title;
    this.slug = data.slug;
    this.content = data.content;
    this.content_type = data.content_type;
    this.directory_id = data.directory_id;
    this.author_id = data.author_id;
    this.status = data.status;
    this.tags = this.parseTags(data.tags);
    this.meta_data = this.parseMetaData(data.meta_data);
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * 从创建请求创建文档实例数据
   */
  static fromCreateRequest(data: CreateDocumentRequest, authorId: number): Partial<DocumentEntity> {
    const now = new Date();
    const slug = Document.generateSlug(data.title);
    
    return {
      title: data.title,
      slug: slug,
      content: data.content,
      content_type: data.content_type || DocumentContentType.MARKDOWN,
      directory_id: data.directory_id,
      author_id: authorId,
      status: data.status || DocumentStatus.DRAFT,
      tags: JSON.stringify(data.tags || []),
      meta_data: JSON.stringify(data.meta_data || {}),
      created_at: now,
      updated_at: now
    };
  }

  /**
   * 从更新请求创建更新数据
   */
  static fromUpdateRequest(data: UpdateDocumentRequest): Partial<DocumentEntity> {
    const updateData: Partial<DocumentEntity> = {
      updated_at: new Date()
    };

    if (data.title !== undefined) {
      updateData.title = data.title;
      updateData.slug = Document.generateSlug(data.title);
    }
    
    if (data.content !== undefined) {
      updateData.content = data.content;
    }
    
    if (data.content_type !== undefined) {
      updateData.content_type = data.content_type;
    }
    
    if (data.directory_id !== undefined) {
      updateData.directory_id = data.directory_id;
    }
    
    if (data.status !== undefined) {
      updateData.status = data.status;
    }
    
    if (data.tags !== undefined) {
      updateData.tags = JSON.stringify(data.tags);
    }
    
    if (data.meta_data !== undefined) {
      updateData.meta_data = JSON.stringify(data.meta_data);
    }

    return updateData;
  }

  /**
   * 转换为响应格式
   */
  toResponse(authorUsername?: string, versionNumber?: number): DocumentResponse {
    return {
      id: this.id,
      title: this.title,
      slug: this.slug,
      content: this.content,
      content_type: this.content_type,
      directory_id: this.directory_id,
      author_id: this.author_id,
      author_username: authorUsername,
      status: this.status,
      tags: this.tags,
      meta_data: this.meta_data,
      created_at: this.created_at,
      updated_at: this.updated_at,
      version_number: versionNumber
    };
  }

  /**
   * 检查文档是否已发布
   */
  isPublished(): boolean {
    return this.status === DocumentStatus.PUBLISHED;
  }

  /**
   * 检查文档是否为草稿
   */
  isDraft(): boolean {
    return this.status === DocumentStatus.DRAFT;
  }

  /**
   * 检查文档是否已归档
   */
  isArchived(): boolean {
    return this.status === DocumentStatus.ARCHIVED;
  }

  /**
   * 获取文档摘要（前200个字符）
   */
  getSummary(length: number = 200): string {
    // 移除Markdown标记的简单处理
    const plainText = this.content
      .replace(/#{1,6}\s+/g, '') // 移除标题标记
      .replace(/\*\*(.*?)\*\*/g, '$1') // 移除粗体标记
      .replace(/\*(.*?)\*/g, '$1') // 移除斜体标记
      .replace(/`(.*?)`/g, '$1') // 移除行内代码标记
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 移除链接，保留文本
      .replace(/\n+/g, ' ') // 将换行符替换为空格
      .trim();
    
    return plainText.length > length 
      ? plainText.substring(0, length) + '...' 
      : plainText;
  }

  /**
   * 生成文档slug
   */
  static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s\u4e00-\u9fff-]/g, '') // 移除特殊字符，保留中文字符
      .replace(/[\s_-]+/g, '-') // 将空格和下划线替换为连字符
      .replace(/^-+|-+$/g, ''); // 移除开头和结尾的连字符
  }

  /**
   * 验证slug是否唯一（需要在Repository中实现具体逻辑）
   */
  static async generateUniqueSlug(title: string, existingSlugChecker: (slug: string) => Promise<boolean>): Promise<string> {
    let baseSlug = Document.generateSlug(title);
    let slug = baseSlug;
    let counter = 1;

    while (await existingSlugChecker(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  /**
   * 解析标签JSON字符串
   */
  private parseTags(tagsJson?: string): string[] {
    if (!tagsJson) return [];
    
    try {
      const parsed = JSON.parse(tagsJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /**
   * 解析元数据JSON字符串
   */
  private parseMetaData(metaDataJson?: string): Record<string, any> {
    if (!metaDataJson) return {};
    
    try {
      const parsed = JSON.parse(metaDataJson);
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch {
      return {};
    }
  }

  /**
   * 验证文档标题
   */
  static validateTitle(title: string): boolean {
    return Boolean(title && title.trim().length > 0 && title.length <= 255);
  }

  /**
   * 验证文档内容
   */
  static validateContent(content: string): boolean {
    return content !== undefined && content !== null;
  }

  /**
   * 提取文档中的标题层级（用于生成大纲）
   */
  extractHeadings(): Array<{ level: number; text: string; id: string }> {
    if (this.content_type !== DocumentContentType.MARKDOWN) {
      return [];
    }

    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const headings: Array<{ level: number; text: string; id: string }> = [];
    let match;

    while ((match = headingRegex.exec(this.content)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text.toLowerCase()
        .replace(/[^\w\s\u4e00-\u9fff-]/g, '') // 保留中文字符
        .replace(/\s+/g, '-')
        .replace(/^-+|-+$/g, ''); // 移除开头和结尾的连字符
      
      headings.push({ level, text, id });
    }

    return headings;
  }
}