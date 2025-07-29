import { FileMetadata } from '../types/file';

/**
 * 文件模型类
 * 处理文件的基本属性和验证
 */
export class File {
  public id: number;
  public filename: string;
  public originalName: string;
  public filePath: string;
  public fileSize: number;
  public mimeType: string;
  public uploaderId: number;
  public createdAt: Date;

  constructor(data: Partial<FileMetadata>) {
    this.id = data.id || 0;
    this.filename = data.filename || '';
    this.originalName = data.originalName || '';
    this.filePath = data.filePath || '';
    this.fileSize = data.fileSize || 0;
    this.mimeType = data.mimeType || '';
    this.uploaderId = data.uploaderId || 0;
    this.createdAt = data.createdAt || new Date();
  }

  /**
   * 验证文件数据的完整性
   */
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.filename.trim()) {
      errors.push('文件名不能为空');
    }

    if (!this.originalName.trim()) {
      errors.push('原始文件名不能为空');
    }

    if (!this.filePath.trim()) {
      errors.push('文件路径不能为空');
    }

    if (this.fileSize <= 0) {
      errors.push('文件大小必须大于0');
    }

    if (!this.mimeType.trim()) {
      errors.push('文件类型不能为空');
    }

    if (this.uploaderId <= 0) {
      errors.push('上传者ID无效');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 获取文件扩展名
   */
  getFileExtension(): string {
    const parts = this.originalName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  /**
   * 检查是否为图片文件
   */
  isImage(): boolean {
    return this.mimeType.startsWith('image/');
  }

  /**
   * 检查是否为文档文件
   */
  isDocument(): boolean {
    const documentTypes = [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    return documentTypes.includes(this.mimeType);
  }

  /**
   * 格式化文件大小显示
   */
  getFormattedSize(): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = this.fileSize;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * 转换为JSON对象
   */
  toJSON(): FileMetadata {
    return {
      id: this.id,
      filename: this.filename,
      originalName: this.originalName,
      filePath: this.filePath,
      fileSize: this.fileSize,
      mimeType: this.mimeType,
      uploaderId: this.uploaderId,
      createdAt: this.createdAt
    };
  }
}