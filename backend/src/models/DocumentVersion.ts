import { 
  DocumentVersionEntity, 
  DocumentVersionResponse 
} from '@/types/document';

/**
 * 文档版本模型类
 */
export class DocumentVersion {
  public id: number;
  public document_id: number;
  public version_number: number;
  public title: string;
  public content: string;
  public author_id: number;
  public change_summary?: string;
  public created_at: Date;

  /**
   * 构造函数
   */
  constructor(data: DocumentVersionEntity) {
    this.id = data.id;
    this.document_id = data.document_id;
    this.version_number = data.version_number;
    this.title = data.title;
    this.content = data.content;
    this.author_id = data.author_id;
    this.change_summary = data.change_summary;
    this.created_at = data.created_at;
  }

  /**
   * 创建文档版本实例数据
   */
  static create(
    documentId: number,
    versionNumber: number,
    title: string,
    content: string,
    authorId: number,
    changeSummary?: string
  ): Partial<DocumentVersionEntity> {
    return {
      document_id: documentId,
      version_number: versionNumber,
      title: title,
      content: content,
      author_id: authorId,
      change_summary: changeSummary,
      created_at: new Date()
    };
  }

  /**
   * 转换为响应格式
   */
  toResponse(authorUsername?: string): DocumentVersionResponse {
    return {
      id: this.id,
      document_id: this.document_id,
      version_number: this.version_number,
      title: this.title,
      content: this.content,
      author_id: this.author_id,
      author_username: authorUsername,
      change_summary: this.change_summary,
      created_at: this.created_at
    };
  }

  /**
   * 获取版本内容摘要
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
   * 比较两个版本的差异（简单的字符差异统计）
   */
  static compareVersions(oldContent: string, newContent: string): {
    added: number;
    removed: number;
    changed: boolean;
  } {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    
    let added = 0;
    let removed = 0;
    
    // 简单的行级比较
    const maxLines = Math.max(oldLines.length, newLines.length);
    
    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i] || '';
      const newLine = newLines[i] || '';
      
      if (i >= oldLines.length) {
        added++;
      } else if (i >= newLines.length) {
        removed++;
      } else if (oldLine !== newLine) {
        // 简化处理：如果行不同，计为修改
        if (oldLine.length === 0) {
          added++;
        } else if (newLine.length === 0) {
          removed++;
        } else {
          // 行内容变化，同时计算增加和删除
          added++;
          removed++;
        }
      }
    }
    
    return {
      added,
      removed,
      changed: added > 0 || removed > 0
    };
  }

  /**
   * 生成变更摘要
   */
  static generateChangeSummary(oldContent: string, newContent: string, oldTitle?: string, newTitle?: string): string {
    const changes: string[] = [];
    
    // 检查标题变更
    if (oldTitle && newTitle && oldTitle !== newTitle) {
      changes.push(`标题从"${oldTitle}"更改为"${newTitle}"`);
    }
    
    // 检查内容变更
    const contentDiff = DocumentVersion.compareVersions(oldContent, newContent);
    
    if (contentDiff.changed) {
      const parts: string[] = [];
      
      if (contentDiff.added > 0) {
        parts.push(`新增${contentDiff.added}处内容`);
      }
      
      if (contentDiff.removed > 0) {
        parts.push(`删除${contentDiff.removed}处内容`);
      }
      
      if (parts.length > 0) {
        changes.push(parts.join('，'));
      }
    }
    
    return changes.length > 0 ? changes.join('；') : '内容更新';
  }

  /**
   * 验证版本号
   */
  static validateVersionNumber(versionNumber: number): boolean {
    return Number.isInteger(versionNumber) && versionNumber > 0;
  }

  /**
   * 检查是否为初始版本
   */
  isInitialVersion(): boolean {
    return this.version_number === 1;
  }
}