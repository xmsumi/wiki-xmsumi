import { Request, Response } from 'express';
import { FileService } from '../services/FileService';
import { logger } from '../utils/logger';
import multer from 'multer';
import { DEFAULT_FILE_CONFIG } from '../types/file';

// 配置multer用于文件上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: DEFAULT_FILE_CONFIG.maxFileSize,
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // 基本的文件类型检查
    if (DEFAULT_FILE_CONFIG.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`不支持的文件类型: ${file.mimetype}`));
    }
  }
});

/**
 * 文件管理控制器
 * 处理文件上传、下载、删除等HTTP请求
 */
export class FileController {
  private fileService: FileService;

  constructor() {
    this.fileService = new FileService();
  }

  /**
   * 获取multer中间件
   */
  getUploadMiddleware() {
    return upload.single('file');
  }

  /**
   * 上传文件
   * POST /api/files/upload
   */
  async uploadFile(req: Request, res: Response): Promise<void> {
    try {
      // 检查是否有文件上传
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: {
            code: 'NO_FILE',
            message: '请选择要上传的文件'
          }
        });
        return;
      }

      // 获取用户ID（从认证中间件设置）
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '用户未登录'
          }
        });
        return;
      }

      // 检查上传权限
      const permissionCheck = await this.fileService.checkUploadPermission(userId);
      if (!permissionCheck.allowed) {
        res.status(403).json({
          success: false,
          error: {
            code: 'UPLOAD_FORBIDDEN',
            message: permissionCheck.error || '无上传权限'
          }
        });
        return;
      }

      // 上传文件
      const uploadResult = await this.fileService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        userId
      );

      if (!uploadResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'UPLOAD_FAILED',
            message: uploadResult.error || '文件上传失败'
          }
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: {
          fileId: uploadResult.fileId,
          filename: uploadResult.filename,
          originalName: uploadResult.originalName,
          fileSize: uploadResult.fileSize,
          message: '文件上传成功'
        }
      });

    } catch (error) {
      logger.error('文件上传处理失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '服务器内部错误'
        }
      });
    }
  }

  /**
   * 下载文件
   * GET /api/files/:id
   */
  async downloadFile(req: Request, res: Response): Promise<void> {
    try {
      const fileId = parseInt(req.params.id);
      if (isNaN(fileId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FILE_ID',
            message: '无效的文件ID'
          }
        });
        return;
      }

      const downloadResult = await this.fileService.downloadFile(fileId);
      if (!downloadResult.success) {
        const statusCode = downloadResult.error === '文件不存在' ? 404 : 500;
        res.status(statusCode).json({
          success: false,
          error: {
            code: statusCode === 404 ? 'FILE_NOT_FOUND' : 'DOWNLOAD_FAILED',
            message: downloadResult.error || '文件下载失败'
          }
        });
        return;
      }

      const file = downloadResult.file!;
      const buffer = downloadResult.buffer!;

      // 设置响应头
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 缓存1年

      // 发送文件内容
      res.send(buffer);

    } catch (error) {
      logger.error('文件下载处理失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '服务器内部错误'
        }
      });
    }
  }

  /**
   * 删除文件
   * DELETE /api/files/:id
   */
  async deleteFile(req: Request, res: Response): Promise<void> {
    try {
      const fileId = parseInt(req.params.id);
      if (isNaN(fileId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FILE_ID',
            message: '无效的文件ID'
          }
        });
        return;
      }

      // 获取用户ID
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '用户未登录'
          }
        });
        return;
      }

      const deleteResult = await this.fileService.deleteFile(fileId, userId);
      if (!deleteResult.success) {
        const statusCode = deleteResult.error === '文件不存在' ? 404 : 
                          deleteResult.error === '无权限删除此文件' ? 403 : 500;
        
        res.status(statusCode).json({
          success: false,
          error: {
            code: statusCode === 404 ? 'FILE_NOT_FOUND' : 
                  statusCode === 403 ? 'DELETE_FORBIDDEN' : 'DELETE_FAILED',
            message: deleteResult.error || '文件删除失败'
          }
        });
        return;
      }

      res.json({
        success: true,
        data: {
          message: '文件删除成功'
        }
      });

    } catch (error) {
      logger.error('文件删除处理失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '服务器内部错误'
        }
      });
    }
  }

  /**
   * 获取文件信息
   * GET /api/files/:id/info
   */
  async getFileInfo(req: Request, res: Response): Promise<void> {
    try {
      const fileId = parseInt(req.params.id);
      if (isNaN(fileId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FILE_ID',
            message: '无效的文件ID'
          }
        });
        return;
      }

      const file = await this.fileService.getFileInfo(fileId);
      if (!file) {
        res.status(404).json({
          success: false,
          error: {
            code: 'FILE_NOT_FOUND',
            message: '文件不存在'
          }
        });
        return;
      }

      res.json({
        success: true,
        data: {
          id: file.id,
          filename: file.filename,
          originalName: file.originalName,
          fileSize: file.fileSize,
          formattedSize: file.getFormattedSize(),
          mimeType: file.mimeType,
          isImage: file.isImage(),
          isDocument: file.isDocument(),
          uploaderId: file.uploaderId,
          createdAt: file.createdAt
        }
      });

    } catch (error) {
      logger.error('获取文件信息失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '服务器内部错误'
        }
      });
    }
  }

  /**
   * 获取用户文件列表
   * GET /api/files/my
   */
  async getUserFiles(req: Request, res: Response): Promise<void> {
    try {
      // 获取用户ID
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '用户未登录'
          }
        });
        return;
      }

      // 获取分页参数
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);

      const result = await this.fileService.getUserFiles(userId, page, pageSize);

      res.json({
        success: true,
        data: {
          files: result.files.map(file => ({
            id: file.id,
            filename: file.filename,
            originalName: file.originalName,
            fileSize: file.fileSize,
            formattedSize: file.getFormattedSize(),
            mimeType: file.mimeType,
            isImage: file.isImage(),
            isDocument: file.isDocument(),
            createdAt: file.createdAt
          })),
          pagination: {
            page: result.page,
            pageSize: result.pageSize,
            total: result.total,
            totalPages: Math.ceil(result.total / result.pageSize)
          }
        }
      });

    } catch (error) {
      logger.error('获取用户文件列表失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '服务器内部错误'
        }
      });
    }
  }

  /**
   * 获取所有文件列表（管理员功能）
   * GET /api/files/all
   */
  async getAllFiles(req: Request, res: Response): Promise<void> {
    try {
      // 检查管理员权限
      const userRole = (req as any).user?.role;
      if (userRole !== 'admin') {
        res.status(403).json({
          success: false,
          error: {
            code: 'ADMIN_REQUIRED',
            message: '需要管理员权限'
          }
        });
        return;
      }

      // 获取分页参数
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);

      const result = await this.fileService.getAllFiles(page, pageSize);

      res.json({
        success: true,
        data: {
          files: result.files.map(file => ({
            id: file.id,
            filename: file.filename,
            originalName: file.originalName,
            fileSize: file.fileSize,
            formattedSize: file.getFormattedSize(),
            mimeType: file.mimeType,
            isImage: file.isImage(),
            isDocument: file.isDocument(),
            uploaderId: file.uploaderId,
            createdAt: file.createdAt
          })),
          pagination: {
            page: result.page,
            pageSize: result.pageSize,
            total: result.total,
            totalPages: Math.ceil(result.total / result.pageSize)
          }
        }
      });

    } catch (error) {
      logger.error('获取所有文件列表失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '服务器内部错误'
        }
      });
    }
  }

  /**
   * 获取存储统计信息
   * GET /api/files/stats
   */
  async getStorageStats(req: Request, res: Response): Promise<void> {
    try {
      // 检查管理员权限
      const userRole = (req as any).user?.role;
      if (userRole !== 'admin') {
        res.status(403).json({
          success: false,
          error: {
            code: 'ADMIN_REQUIRED',
            message: '需要管理员权限'
          }
        });
        return;
      }

      const stats = await this.fileService.getStorageStats();

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('获取存储统计信息失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '服务器内部错误'
        }
      });
    }
  }
}