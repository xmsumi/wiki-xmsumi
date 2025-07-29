import { FileSecurityScanResult } from '../types/file';
import { FileValidator } from '../validators/fileValidator';
import crypto from 'crypto';
import path from 'path';

/**
 * 文件安全扫描服务
 * 提供文件安全检查、病毒扫描、内容分析等功能
 */
export class FileSecurityService {
  private fileValidator: FileValidator;

  constructor() {
    this.fileValidator = new FileValidator();
  }

  /**
   * 执行完整的文件安全扫描
   */
  async scanFile(
    buffer: Buffer,
    filename: string,
    mimeType: string
  ): Promise<FileSecurityScanResult> {
    const threats: string[] = [];
    const scanTime = new Date();

    try {
      // 1. 验证文件名安全性
      const filenameValidation = this.fileValidator.validateFileName(filename);
      if (!filenameValidation.isValid) {
        threats.push(`文件名安全检查失败: ${filenameValidation.error}`);
      }

      // 2. 验证文件类型
      const typeValidation = this.fileValidator.validateFileType(mimeType, filename);
      if (!typeValidation.isValid) {
        threats.push(`文件类型检查失败: ${typeValidation.error}`);
      }

      // 3. 验证文件大小
      const sizeValidation = this.fileValidator.validateFileSize(buffer.length);
      if (!sizeValidation.isValid) {
        threats.push(`文件大小检查失败: ${sizeValidation.error}`);
      }

      // 4. 验证文件内容
      const contentValidation = await this.fileValidator.validateFileContent(buffer, mimeType);
      if (!contentValidation.isValid) {
        threats.push(`文件内容检查失败: ${contentValidation.error}`);
      }

      // 5. 检查文件熵值（检测加密或压缩文件）
      const entropyCheck = this.checkFileEntropy(buffer);
      if (!entropyCheck.isValid) {
        threats.push(`文件熵值检查失败: ${entropyCheck.error}`);
      }

      // 6. 检查嵌入式脚本
      const scriptCheck = await this.checkEmbeddedScripts(buffer, mimeType);
      if (!scriptCheck.isValid) {
        threats.push(`嵌入式脚本检查失败: ${scriptCheck.error}`);
      }

      // 7. 检查文件结构完整性
      const structureCheck = this.checkFileStructure(buffer, mimeType);
      if (!structureCheck.isValid) {
        threats.push(`文件结构检查失败: ${structureCheck.error}`);
      }

      return {
        isSafe: threats.length === 0,
        threats,
        scanTime
      };

    } catch (error) {
      return {
        isSafe: false,
        threats: [`扫描过程发生错误: ${error instanceof Error ? error.message : '未知错误'}`],
        scanTime
      };
    }
  }

  /**
   * 生成安全的随机文件名
   */
  generateSecureFilename(originalFilename: string): string {
    const extension = path.extname(originalFilename);
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(16).toString('hex');
    
    return `${timestamp}_${randomBytes}${extension}`;
  }

  /**
   * 生成安全的存储路径
   */
  generateSecurePath(baseUploadPath: string): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // 创建按日期分组的目录结构
    return path.join(baseUploadPath, String(year), month, day);
  }

  /**
   * 检查文件熵值
   */
  private checkFileEntropy(buffer: Buffer): { isValid: boolean; error?: string } {
    try {
      // 计算文件的熵值
      const entropy = this.calculateEntropy(buffer);
      
      // 熵值过高可能表示文件被加密或高度压缩
      if (entropy > 7.5) {
        return {
          isValid: false,
          error: `文件熵值过高 (${entropy.toFixed(2)})，可能包含加密内容`
        };
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: '熵值计算失败'
      };
    }
  }

  /**
   * 计算文件熵值
   */
  private calculateEntropy(buffer: Buffer): number {
    const frequency: { [key: number]: number } = {};
    
    // 统计字节频率
    for (let i = 0; i < buffer.length; i++) {
      const byte = buffer[i];
      frequency[byte] = (frequency[byte] || 0) + 1;
    }

    // 计算熵值
    let entropy = 0;
    const length = buffer.length;
    
    for (const count of Object.values(frequency)) {
      const probability = count / length;
      entropy -= probability * Math.log2(probability);
    }

    return entropy;
  }

  /**
   * 检查嵌入式脚本
   */
  private async checkEmbeddedScripts(buffer: Buffer, mimeType: string): Promise<{ isValid: boolean; error?: string }> {
    try {
      // 对于图片文件，检查EXIF数据中的脚本
      if (mimeType.startsWith('image/')) {
        const content = buffer.toString('binary');
        
        // 检查常见的脚本注入模式
        const scriptPatterns = [
          /<%[\s\S]*?%>/g,  // ASP/JSP
          /<\?php[\s\S]*?\?>/g,  // PHP
          /<script[\s\S]*?<\/script>/gi,  // JavaScript
          /javascript:/gi,
          /vbscript:/gi
        ];

        for (const pattern of scriptPatterns) {
          if (pattern.test(content)) {
            return {
              isValid: false,
              error: '检测到嵌入式脚本代码'
            };
          }
        }
      }

      // 对于文档文件，检查宏和脚本
      if (mimeType.includes('officedocument') || mimeType.includes('msword')) {
        const content = buffer.toString('binary');
        
        // 检查Office宏
        if (content.includes('macros') || content.includes('VBA') || content.includes('Microsoft Visual Basic')) {
          return {
            isValid: false,
            error: '检测到Office宏代码'
          };
        }
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: '嵌入式脚本检查失败'
      };
    }
  }

  /**
   * 检查文件结构完整性
   */
  private checkFileStructure(buffer: Buffer, mimeType: string): { isValid: boolean; error?: string } {
    try {
      // 检查文件是否过小（可能是恶意文件）
      if (buffer.length < 10) {
        return {
          isValid: false,
          error: '文件过小，可能不是有效文件'
        };
      }

      // 检查文件头和尾是否匹配
      if (mimeType === 'application/zip') {
        // ZIP文件应该以PK开头
        if (!buffer.slice(0, 2).equals(Buffer.from([0x50, 0x4B]))) {
          return {
            isValid: false,
            error: 'ZIP文件头不正确'
          };
        }
      }

      if (mimeType === 'application/pdf') {
        // PDF文件应该以%PDF开头
        if (!buffer.slice(0, 4).equals(Buffer.from('%PDF', 'ascii'))) {
          return {
            isValid: false,
            error: 'PDF文件头不正确'
          };
        }
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: '文件结构检查失败'
      };
    }
  }

  /**
   * 检查上传频率限制
   */
  async checkUploadRateLimit(userId: number, maxUploadsPerHour: number): Promise<{ isAllowed: boolean; error?: string }> {
    try {
      // 这里应该连接到Redis或数据库来检查上传频率
      // 暂时返回允许上传，实际实现需要根据具体的缓存策略
      
      // 模拟检查逻辑
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      // TODO: 实现实际的频率检查逻辑
      // const uploadCount = await this.getUploadCountSince(userId, oneHourAgo);
      // if (uploadCount >= maxUploadsPerHour) {
      //   return {
      //     isAllowed: false,
      //     error: `上传频率超限，每小时最多上传${maxUploadsPerHour}个文件`
      //   };
      // }

      return { isAllowed: true };
    } catch (error) {
      return {
        isAllowed: false,
        error: '频率检查失败'
      };
    }
  }
}