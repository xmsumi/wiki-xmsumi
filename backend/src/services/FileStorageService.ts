import fs from 'fs/promises';
import path from 'path';
import { FileSecurityService } from './FileSecurityService';
import { FileUploadConfig, DEFAULT_FILE_CONFIG } from '../types/file';

/**
 * 文件存储服务
 * 处理文件的安全存储、路径管理和文件操作
 */
export class FileStorageService {
  private config: FileUploadConfig;
  private securityService: FileSecurityService;

  constructor(config: Partial<FileUploadConfig> = {}) {
    this.config = { ...DEFAULT_FILE_CONFIG, ...config };
    this.securityService = new FileSecurityService();
  }

  /**
   * 安全存储文件
   */
  async storeFile(
    buffer: Buffer,
    originalFilename: string,
    mimeType: string
  ): Promise<{ success: boolean; filePath?: string; filename?: string; error?: string }> {
    try {
      // 1. 生成安全的文件名和路径
      const secureFilename = this.securityService.generateSecureFilename(originalFilename);
      const securePath = this.securityService.generateSecurePath(this.config.uploadPath);
      const fullPath = path.join(securePath, secureFilename);

      // 2. 确保目录存在
      await this.ensureDirectoryExists(securePath);

      // 3. 检查磁盘空间
      const spaceCheck = await this.checkDiskSpace(securePath, buffer.length);
      if (!spaceCheck.hasSpace) {
        return {
          success: false,
          error: '磁盘空间不足'
        };
      }

      // 4. 写入文件
      await fs.writeFile(fullPath, buffer);

      // 5. 验证文件写入成功
      const writeVerification = await this.verifyFileWrite(fullPath, buffer.length);
      if (!writeVerification.isValid) {
        // 清理失败的文件
        await this.deleteFile(fullPath);
        return {
          success: false,
          error: '文件写入验证失败'
        };
      }

      // 6. 设置文件权限
      await this.setFilePermissions(fullPath);

      return {
        success: true,
        filePath: fullPath,
        filename: secureFilename
      };

    } catch (error) {
      return {
        success: false,
        error: `文件存储失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 读取文件
   */
  async readFile(filePath: string): Promise<{ success: boolean; buffer?: Buffer; error?: string }> {
    try {
      // 1. 验证文件路径安全性
      const pathValidation = this.validateFilePath(filePath);
      if (!pathValidation.isValid) {
        return {
          success: false,
          error: pathValidation.error
        };
      }

      // 2. 检查文件是否存在
      const exists = await this.fileExists(filePath);
      if (!exists) {
        return {
          success: false,
          error: '文件不存在'
        };
      }

      // 3. 读取文件
      const buffer = await fs.readFile(filePath);

      return {
        success: true,
        buffer
      };

    } catch (error) {
      return {
        success: false,
        error: `文件读取失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 删除文件
   */
  async deleteFile(filePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. 验证文件路径安全性
      const pathValidation = this.validateFilePath(filePath);
      if (!pathValidation.isValid) {
        return {
          success: false,
          error: pathValidation.error
        };
      }

      // 2. 检查文件是否存在
      const exists = await this.fileExists(filePath);
      if (!exists) {
        return {
          success: true // 文件不存在视为删除成功
        };
      }

      // 3. 删除文件
      await fs.unlink(filePath);

      // 4. 尝试清理空目录
      await this.cleanupEmptyDirectories(path.dirname(filePath));

      return {
        success: true
      };

    } catch (error) {
      return {
        success: false,
        error: `文件删除失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 获取文件信息
   */
  async getFileInfo(filePath: string): Promise<{ 
    success: boolean; 
    info?: { size: number; mtime: Date; isFile: boolean }; 
    error?: string 
  }> {
    try {
      const pathValidation = this.validateFilePath(filePath);
      if (!pathValidation.isValid) {
        return {
          success: false,
          error: pathValidation.error
        };
      }

      const stats = await fs.stat(filePath);

      return {
        success: true,
        info: {
          size: stats.size,
          mtime: stats.mtime,
          isFile: stats.isFile()
        }
      };

    } catch (error) {
      return {
        success: false,
        error: `获取文件信息失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 确保目录存在
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * 检查磁盘空间
   */
  private async checkDiskSpace(dirPath: string, requiredSpace: number): Promise<{ hasSpace: boolean }> {
    try {
      // 简单的磁盘空间检查
      // 在实际生产环境中，应该使用更精确的磁盘空间检查方法
      const stats = await fs.stat(dirPath).catch(() => null);
      
      // 预留100MB空间
      const reservedSpace = 100 * 1024 * 1024;
      const hasSpace = requiredSpace < reservedSpace;

      return { hasSpace };
    } catch {
      return { hasSpace: true }; // 默认允许
    }
  }

  /**
   * 验证文件写入
   */
  private async verifyFileWrite(filePath: string, expectedSize: number): Promise<{ isValid: boolean }> {
    try {
      const stats = await fs.stat(filePath);
      return {
        isValid: stats.size === expectedSize && stats.isFile()
      };
    } catch {
      return { isValid: false };
    }
  }

  /**
   * 设置文件权限
   */
  private async setFilePermissions(filePath: string): Promise<void> {
    try {
      // 设置文件权限为只读（644）
      await fs.chmod(filePath, 0o644);
    } catch {
      // 权限设置失败不影响主流程
    }
  }

  /**
   * 验证文件路径安全性
   */
  private validateFilePath(filePath: string): { isValid: boolean; error?: string } {
    // 检查路径遍历攻击
    const normalizedPath = path.normalize(filePath);
    if (normalizedPath.includes('..')) {
      return {
        isValid: false,
        error: '文件路径包含非法字符'
      };
    }

    // 检查是否在允许的上传目录内
    const uploadPath = path.resolve(this.config.uploadPath);
    const resolvedPath = path.resolve(normalizedPath);
    
    if (!resolvedPath.startsWith(uploadPath)) {
      return {
        isValid: false,
        error: '文件路径超出允许范围'
      };
    }

    return { isValid: true };
  }

  /**
   * 检查文件是否存在
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 清理空目录
   */
  private async cleanupEmptyDirectories(dirPath: string): Promise<void> {
    try {
      const uploadPath = path.resolve(this.config.uploadPath);
      const currentPath = path.resolve(dirPath);
      
      // 不要删除根上传目录
      if (currentPath === uploadPath) {
        return;
      }

      const entries = await fs.readdir(currentPath);
      if (entries.length === 0) {
        await fs.rmdir(currentPath);
        // 递归清理父目录
        await this.cleanupEmptyDirectories(path.dirname(currentPath));
      }
    } catch {
      // 清理失败不影响主流程
    }
  }

  /**
   * 获取文件的相对路径（用于数据库存储）
   */
  getRelativePath(fullPath: string): string {
    const uploadPath = path.resolve(this.config.uploadPath);
    const resolvedPath = path.resolve(fullPath);
    return path.relative(uploadPath, resolvedPath);
  }

  /**
   * 从相对路径获取完整路径
   */
  getFullPath(relativePath: string): string {
    return path.join(this.config.uploadPath, relativePath);
  }
}