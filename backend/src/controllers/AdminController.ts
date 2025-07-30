import { Request, Response } from 'express';
import { AdminService } from '@/services/AdminService';
import { logger } from '@/utils/logger';

/**
 * 管理员控制器
 * 处理系统管理相关的请求
 */
export class AdminController {
  private adminService: AdminService;

  constructor() {
    this.adminService = new AdminService();
  }

  /**
   * 获取系统设置
   */
  getSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const settings = await this.adminService.getSystemSettings();
      res.json({
        success: true,
        data: settings,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('获取系统设置失败:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '获取系统设置失败',
          details: error instanceof Error ? error.message : '未知错误'
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * 更新系统设置
   */
  updateSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const settings = await this.adminService.updateSystemSettings(req.body);
      res.json({
        success: true,
        data: settings,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('更新系统设置失败:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '更新系统设置失败',
          details: error instanceof Error ? error.message : '未知错误'
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * 重置系统设置
   */
  resetSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const settings = await this.adminService.resetSystemSettings();
      res.json({
        success: true,
        data: settings,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('重置系统设置失败:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '重置系统设置失败',
          details: error instanceof Error ? error.message : '未知错误'
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * 获取系统状态
   */
  getSystemStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const status = await this.adminService.getSystemStatus();
      res.json({
        success: true,
        data: status,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('获取系统状态失败:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '获取系统状态失败',
          details: error instanceof Error ? error.message : '未知错误'
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * 测试邮件设置
   */
  testEmailSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.adminService.testEmailSettings(req.body);
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('测试邮件设置失败:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '测试邮件设置失败',
          details: error instanceof Error ? error.message : '未知错误'
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * 测试搜索引擎
   */
  testSearchEngine = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.adminService.testSearchEngine();
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('测试搜索引擎失败:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '测试搜索引擎失败',
          details: error instanceof Error ? error.message : '未知错误'
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * 清理缓存
   */
  clearCache = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.adminService.clearCache();
      res.json({
        success: true,
        data: { message: '缓存清理成功' },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('清理缓存失败:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '清理缓存失败',
          details: error instanceof Error ? error.message : '未知错误'
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * 重建搜索索引
   */
  rebuildSearchIndex = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.adminService.rebuildSearchIndex();
      res.json({
        success: true,
        data: { message: '搜索索引重建成功' },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('重建搜索索引失败:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '重建搜索索引失败',
          details: error instanceof Error ? error.message : '未知错误'
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * 创建备份
   */
  createBackup = async (req: Request, res: Response): Promise<void> => {
    try {
      const { description } = req.body;
      const backup = await this.adminService.createBackup(description);
      res.json({
        success: true,
        data: backup,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('创建备份失败:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '创建备份失败',
          details: error instanceof Error ? error.message : '未知错误'
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * 获取备份列表
   */
  getBackups = async (req: Request, res: Response): Promise<void> => {
    try {
      const backups = await this.adminService.getBackups();
      res.json({
        success: true,
        data: backups,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('获取备份列表失败:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '获取备份列表失败',
          details: error instanceof Error ? error.message : '未知错误'
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * 下载备份
   */
  downloadBackup = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const backup = await this.adminService.downloadBackup(id);
      
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${backup.filename}"`);
      res.send(backup.data);
    } catch (error) {
      logger.error('下载备份失败:', error);
      res.status(500).json({
        error: '下载备份失败',
        message: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  /**
   * 删除备份
   */
  deleteBackup = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.adminService.deleteBackup(id);
      res.json({
        success: true,
        data: { message: '备份删除成功' },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('删除备份失败:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '删除备份失败',
          details: error instanceof Error ? error.message : '未知错误'
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * 获取系统日志
   */
  getSystemLogs = async (req: Request, res: Response): Promise<void> => {
    try {
      const { limit = 50, level, startDate, endDate } = req.query;
      const logs = await this.adminService.getSystemLogs({
        limit: parseInt(limit as string),
        level: level as string,
        startDate: startDate as string,
        endDate: endDate as string
      });
      res.json({
        success: true,
        data: logs,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('获取系统日志失败:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '获取系统日志失败',
          details: error instanceof Error ? error.message : '未知错误'
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * 导出设置
   */
  exportSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const exportData = await this.adminService.exportSettings();
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="settings-export.json"');
      res.send(exportData);
    } catch (error) {
      logger.error('导出设置失败:', error);
      res.status(500).json({
        error: '导出设置失败',
        message: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  /**
   * 导入设置
   */
  importSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: {
            message: '请选择要导入的文件'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const settings = await this.adminService.importSettings(req.file.buffer);
      res.json({
        success: true,
        data: settings,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('导入设置失败:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '导入设置失败',
          details: error instanceof Error ? error.message : '未知错误'
        },
        timestamp: new Date().toISOString()
      });
    }
  };
}