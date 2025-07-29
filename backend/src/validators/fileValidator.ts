import { FileUploadConfig, DEFAULT_FILE_CONFIG } from '../types/file';

/**
 * 文件上传验证器
 * 提供文件类型、大小、安全性等验证功能
 */
export class FileValidator {
  private config: FileUploadConfig;

  constructor(config: Partial<FileUploadConfig> = {}) {
    this.config = { ...DEFAULT_FILE_CONFIG, ...config };
  }

  /**
   * 验证文件类型是否被允许
   */
  validateFileType(mimeType: string, filename: string): { isValid: boolean; error?: string } {
    // 检查MIME类型
    if (!this.config.allowedMimeTypes.includes(mimeType)) {
      return {
        isValid: false,
        error: `不支持的文件类型: ${mimeType}`
      };
    }

    // 检查文件扩展名（防止MIME类型伪造）
    const extension = this.getFileExtension(filename);
    const expectedMimeTypes = this.getMimeTypesByExtension(extension);
    
    if (expectedMimeTypes.length > 0 && !expectedMimeTypes.includes(mimeType)) {
      return {
        isValid: false,
        error: `文件扩展名与类型不匹配: ${extension} -> ${mimeType}`
      };
    }

    return { isValid: true };
  }

  /**
   * 验证文件大小
   */
  validateFileSize(fileSize: number): { isValid: boolean; error?: string } {
    if (fileSize > this.config.maxFileSize) {
      const maxSizeMB = (this.config.maxFileSize / (1024 * 1024)).toFixed(2);
      const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
      return {
        isValid: false,
        error: `文件大小超出限制: ${fileSizeMB}MB > ${maxSizeMB}MB`
      };
    }

    if (fileSize <= 0) {
      return {
        isValid: false,
        error: '文件大小无效'
      };
    }

    return { isValid: true };
  }

  /**
   * 验证文件名安全性
   */
  validateFileName(filename: string): { isValid: boolean; error?: string } {
    // 检查文件名长度
    if (filename.length > 255) {
      return {
        isValid: false,
        error: '文件名过长'
      };
    }

    // 检查危险字符
    const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (dangerousChars.test(filename)) {
      return {
        isValid: false,
        error: '文件名包含非法字符'
      };
    }

    // 检查保留名称（Windows）
    const reservedNames = [
      'CON', 'PRN', 'AUX', 'NUL',
      'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
      'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
    ];
    
    const nameWithoutExt = filename.split('.')[0].toUpperCase();
    if (reservedNames.includes(nameWithoutExt)) {
      return {
        isValid: false,
        error: '文件名使用了系统保留名称'
      };
    }

    return { isValid: true };
  }

  /**
   * 检查文件内容安全性（基础检查）
   */
  async validateFileContent(buffer: Buffer, mimeType: string): Promise<{ isValid: boolean; error?: string }> {
    try {
      // 检查文件头魔数，验证真实文件类型
      const magicNumbers = this.getMagicNumbers(buffer);
      const expectedMagicNumbers = this.getExpectedMagicNumbers(mimeType);
      
      if (expectedMagicNumbers.length > 0) {
        const isValidMagicNumber = expectedMagicNumbers.some(expected => 
          magicNumbers.startsWith(expected)
        );
        
        if (!isValidMagicNumber) {
          return {
            isValid: false,
            error: '文件内容与声明类型不匹配'
          };
        }
      }

      // 检查恶意脚本（针对文本文件）
      if (mimeType.startsWith('text/') || mimeType === 'application/javascript') {
        const content = buffer.toString('utf8');
        if (this.containsMaliciousScript(content)) {
          return {
            isValid: false,
            error: '文件包含潜在恶意脚本'
          };
        }
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: '文件内容验证失败'
      };
    }
  }

  /**
   * 获取文件扩展名
   */
  private getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  /**
   * 根据扩展名获取期望的MIME类型
   */
  private getMimeTypesByExtension(extension: string): string[] {
    const mimeMap: { [key: string]: string[] } = {
      'jpg': ['image/jpeg'],
      'jpeg': ['image/jpeg'],
      'png': ['image/png'],
      'gif': ['image/gif'],
      'webp': ['image/webp'],
      'pdf': ['application/pdf'],
      'txt': ['text/plain'],
      'md': ['text/markdown'],
      'zip': ['application/zip'],
      'rar': ['application/x-rar-compressed'],
      'doc': ['application/msword'],
      'docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      'xls': ['application/vnd.ms-excel'],
      'xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    };

    return mimeMap[extension] || [];
  }

  /**
   * 获取文件头魔数
   */
  private getMagicNumbers(buffer: Buffer): string {
    return buffer.slice(0, 8).toString('hex').toUpperCase();
  }

  /**
   * 获取MIME类型对应的期望魔数
   */
  private getExpectedMagicNumbers(mimeType: string): string[] {
    const magicMap: { [key: string]: string[] } = {
      'image/jpeg': ['FFD8FF'],
      'image/png': ['89504E47'],
      'image/gif': ['474946'],
      'application/pdf': ['255044462D'],
      'application/zip': ['504B0304', '504B0506', '504B0708'],
      'application/x-rar-compressed': ['526172211A07']
    };

    return magicMap[mimeType] || [];
  }

  /**
   * 检查文本内容是否包含恶意脚本
   */
  private containsMaliciousScript(content: string): boolean {
    const maliciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /onload\s*=/gi,
      /onerror\s*=/gi,
      /onclick\s*=/gi,
      /eval\s*\(/gi,
      /document\.write/gi,
      /window\.location/gi
    ];

    return maliciousPatterns.some(pattern => pattern.test(content));
  }
}