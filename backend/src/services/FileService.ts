import { FileRepository } from '../repositories/FileRepository';
import { FileSecurityService } from './FileSecurityService';
import { FileStorageService } from './FileStorageService';
import { File } from '../models/File';
import { FileUploadResult, FileUploadConfig, DEFAULT_FILE_CONFIG } from '../types/file';
import { logger } from '../utils/logger';

/**
 * 文件服务层
 * 整合文件安全检查、存储和数据库操作
 */
export class FileService {
  private fileRepository: FileRepository;
  private securityService: FileSecurityService;
  private storageService: FileStorageService;
  private config: FileUploadConfig;

  constructor(config: Partial<FileUploadConfig> = {}) {
    this.config = { ...DEFAULT_FILE_CONFIG, ...config };
    this.fileRepository = new FileRepository();
    this.securityService = new FileSecurityService();
    this.storageService = new FileStorageService(this.config);
  }

  /**
   * 上传文件
   */
  async uploadFile(
    buffer: Buffer,
    originalFilename: string,
    mimeType: string,
    uploaderId: number
  ): Promise<FileUploadResult> {
    try {
      // 1. 检查上传频率限制
      const rateLimitCheck = await this.securityService.checkUploadRateLimit(
        uploaderId,
        this.config.maxFilesPerHour
      );

      if (!rateLimitCheck.isAllowed) {
        return {
          success: false,
          error: rateLimitCheck.error || '上传频率超限'
        };
      }

      // 2. 执行安全扫描
      const scanResult = await this.securityService.scanFile(buffer, originalFilename, mimeType);
      if (!scanResult.isSafe) {
        return {
          success: false,
          error: `文件安全检查失败: ${scanResult.threats.join(', ')}`
        };
      }

      // 3. 存储文件
      const storageResult = await this.storageService.storeFile(buffer, originalFilename, mimeType);
      if (!storageResult.success) {
        return {
          success: false,
          error: storageResult.error || '文件存储失败'
        };
      }

      // 4. 保存文件元数据到数据库
      const fileRecord = await this.fileRepository.create({
        filename: storageResult.filename!,
        originalName: originalFilename,
        filePath: this.storageService.getRelativePath(storageResult.filePath!),
        fileSize: buffer.length,
        mimeType: mimeType,
        uploaderId: uploaderId
      });

      return {
        success: true,
        fileId: fileRecord.id,
        filename: fileRecord.filename,
        originalName: fileRecord.originalName,
        fileSize: fileRecord.fileSize
      };

    } catch (error) {
      logger.error('文件上传失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '文件上传失败'
      };
    }
  }

  /**
   * 获取文件信息
   */
  async getFileInfo(fileId: number): Promise<File | null> {
    try {
      return await this.fileRepository.findById(fileId);
    } catch (error) {
      logger.error(`获取文件信息失败 (fileId: ${fileId}):`, error);
      throw error;
    }
  }

  /**
   * 下载文件
   */
  async downloadFile(fileId: number): Promise<{ success: boolean; buffer?: Buffer; file?: File; error?: string }> {
    try {
      // 1. 获取文件信息
      const file = await this.fileRepository.findById(fileId);
      if (!file) {
        return {
          success: false,
          error: '文件不存在'
        };
      }

      // 2. 读取文件内容
      const fullPath = this.storageService.getFullPath(file.filePath);
      const readResult = await this.storageService.readFile(fullPath);

      if (!readResult.success) {
        return {
          success: false,
          error: readResult.error || '文件读取失败'
        };
      }

      return {
        success: true,
        buffer: readResult.buffer,
        file: file
      };

    } catch (error) {
      logger.error(`文件下载失败 (fileId: ${fileId}):`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '文件下载失败'
      };
    }
  }

  /**
   * 删除文件
   */
  async deleteFile(fileId: number, userId: number): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. 获取文件信息
      const file = await this.fileRepository.findById(fileId);
      if (!file) {
        return {
          success: false,
          error: '文件不存在'
        };
      }

      // 2. 检查权限（只有上传者可以删除）
      if (file.uploaderId !== userId) {
        return {
          success: false,
          error: '无权限删除此文件'
        };
      }

      // 3. 删除物理文件
      const fullPath = this.storageService.getFullPath(file.filePath);
      const deleteResult = await this.storageService.deleteFile(fullPath);

      if (!deleteResult.success) {
        logger.warn(`物理文件删除失败，但继续删除数据库记录: ${deleteResult.error}`);
      }

      // 4. 删除数据库记录
      const dbDeleteResult = await this.fileRepository.delete(fileId);
      if (!dbDeleteResult) {
        return {
          success: false,
          error: '删除文件记录失败'
        };
      }

      return {
        success: true
      };

    } catch (error) {
      logger.error(`文件删除失败 (fileId: ${fileId}):`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '文件删除失败'
      };
    }
  }

  /**
   * 获取用户文件列表
   */
  async getUserFiles(
    userId: number,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ files: File[]; total: number; page: number; pageSize: number }> {
    try {
      const offset = (page - 1) * pageSize;
      const [files, total] = await Promise.all([
        this.fileRepository.findByUploader(userId, pageSize, offset),
        this.fileRepository.countByUploader(userId)
      ]);

      return {
        files,
        total,
        page,
        pageSize
      };
    } catch (error) {
      logger.error(`获取用户文件列表失败 (userId: ${userId}):`, error);
      throw error;
    }
  }

  /**
   * 获取所有文件列表（管理员功能）
   */
  async getAllFiles(
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ files: File[]; total: number; page: number; pageSize: number }> {
    try {
      const offset = (page - 1) * pageSize;
      const [files, total] = await Promise.all([
        this.fileRepository.findAll(pageSize, offset),
        this.fileRepository.count()
      ]);

      return {
        files,
        total,
        page,
        pageSize
      };
    } catch (error) {
      logger.error('获取所有文件列表失败:', error);
      throw error;
    }
  }

  /**
   * 根据文件类型获取文件列表
   */
  async getFilesByType(
    mimeType: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ files: File[]; total: number; page: number; pageSize: number }> {
    try {
      const offset = (page - 1) * pageSize;
      const files = await this.fileRepository.findByMimeType(mimeType, pageSize, offset);
      
      // 注意：这里没有实现按类型计数的方法，实际使用时可能需要添加
      const total = files.length;

      return {
        files,
        total,
        page,
        pageSize
      };
    } catch (error) {
      logger.error(`根据类型获取文件列表失败 (mimeType: ${mimeType}):`, error);
      throw error;
    }
  }

  /**
   * 获取存储统计信息
   */
  async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    averageSize: number;
    largestFile: number;
    formattedTotalSize: string;
    formattedAverageSize: string;
    formattedLargestFile: string;
  }> {
    try {
      const stats = await this.fileRepository.getStorageStats();
      
      return {
        ...stats,
        formattedTotalSize: this.formatFileSize(stats.totalSize),
        formattedAverageSize: this.formatFileSize(stats.averageSize),
        formattedLargestFile: this.formatFileSize(stats.largestFile)
      };
    } catch (error) {
      logger.error('获取存储统计信息失败:', error);
      throw error;
    }
  }

  /**
   * 检查用户上传权限
   */
  async checkUploadPermission(userId: number): Promise<{ allowed: boolean; error?: string }> {
    try {
      // 检查今天的上传次数
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      const todayUploads = await this.fileRepository.countUploadsInTimeRange(
        userId,
        startOfDay,
        endOfDay
      );

      if (todayUploads >= this.config.maxFilesPerHour * 24) {
        return {
          allowed: false,
          error: '今日上传次数已达上限'
        };
      }

      return {
        allowed: true
      };
    } catch (error) {
      logger.error(`检查上传权限失败 (userId: ${userId}):`, error);
      return {
        allowed: false,
        error: '权限检查失败'
      };
    }
  }

  /**
   * 格式化文件大小
   */
  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
}