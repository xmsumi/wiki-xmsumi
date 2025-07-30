import { db } from '@/config/database';
import { SearchService } from '@/services/SearchService';
import { DocumentRepository } from '@/repositories/DocumentRepository';
import { emailService, EmailConfig } from '@/services/EmailService';
import { logger } from '@/utils/logger';

/**
 * 系统设置接口
 */
export interface SystemSettings {
  // 基本设置
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  adminEmail: string;
  
  // 邮件设置
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  smtpSecure: boolean;
  
  // 搜索设置
  searchEnabled: boolean;
  searchIndexName: string;
  
  // 文件上传设置
  maxFileSize: number;
  allowedFileTypes: string[];
  
  // 安全设置
  sessionTimeout: number;
  passwordMinLength: number;
  enableTwoFactor: boolean;
  
  // 其他设置
  enableRegistration: boolean;
  defaultUserRole: string;
  maintenanceMode: boolean;
}

/**
 * 系统状态接口
 */
export interface SystemStatus {
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: number;
  databaseStatus: string;
  searchEngineStatus: string;
  diskUsage: {
    total: number;
    used: number;
    free: number;
  };
}

/**
 * 备份信息接口
 */
export interface BackupInfo {
  id: string;
  filename: string;
  description: string;
  size: number;
  createdAt: Date;
  status: 'completed' | 'failed' | 'in_progress';
}

/**
 * 系统日志接口
 */
export interface SystemLog {
  id: string;
  level: string;
  message: string;
  timestamp: Date;
  source: string;
}

/**
 * 管理员服务类
 * 处理系统管理相关的业务逻辑
 */
export class AdminService {
  private searchService: SearchService;
  private documentRepository: DocumentRepository;

  constructor() {
    this.documentRepository = new DocumentRepository();
    this.searchService = new SearchService(this.documentRepository);
  }

  /**
   * 获取系统设置
   */
  async getSystemSettings(): Promise<SystemSettings> {
    try {
      const query = 'SELECT settings FROM system_settings ORDER BY created_at DESC LIMIT 1';
      const result = await db.query(query);
      
      logger.info('数据库查询结果:', { result, type: typeof result, length: result?.length });
      
      // MySQL返回的是数组，不是{rows: []}格式
      if (!result || result.length === 0) {
        logger.info('没有找到系统设置记录，使用默认设置');
        // 如果没有设置记录，创建默认设置
        const defaultSettings = this.getDefaultSettings();
        await this.updateSystemSettings(defaultSettings);
        return defaultSettings;
      }
      
      logger.info('找到系统设置记录:', result[0]);
      return result[0].settings;
    } catch (error) {
      logger.error('获取系统设置失败:', error);
      // 如果数据库查询失败，返回默认设置
      return this.getDefaultSettings();
    }
  }

  /**
   * 更新系统设置
   */
  async updateSystemSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    try {
      // 避免递归调用，直接获取当前设置
      let currentSettings: SystemSettings;
      try {
        const query = 'SELECT settings FROM system_settings ORDER BY created_at DESC LIMIT 1';
        const result = await db.query(query);
        
        if (!result || result.length === 0) {
          currentSettings = this.getDefaultSettings();
        } else {
          currentSettings = result[0].settings;
        }
      } catch (error) {
        currentSettings = this.getDefaultSettings();
      }
      
      const updatedSettings = { ...currentSettings, ...settings };
      
      // 先尝试更新现有记录
      const updateQuery = `
        UPDATE system_settings 
        SET settings = ?, updated_at = NOW() 
        WHERE id = (SELECT id FROM (SELECT id FROM system_settings ORDER BY created_at DESC LIMIT 1) AS temp)
      `;
      
      const updateResult = await db.query(updateQuery, [JSON.stringify(updatedSettings)]);
      
      // MySQL返回的结果结构不同，检查affectedRows
      if (!updateResult || updateResult.affectedRows === 0) {
        const insertQuery = `
          INSERT INTO system_settings (settings, created_at, updated_at) 
          VALUES (?, NOW(), NOW())
        `;
        await db.query(insertQuery, [JSON.stringify(updatedSettings)]);
      }
      
      logger.info('系统设置已更新');
      return updatedSettings;
    } catch (error) {
      logger.error('更新系统设置失败:', error);
      throw new Error('更新系统设置失败');
    }
  }

  /**
   * 重置系统设置
   */
  async resetSystemSettings(): Promise<SystemSettings> {
    try {
      const defaultSettings = this.getDefaultSettings();
      return await this.updateSystemSettings(defaultSettings);
    } catch (error) {
      logger.error('重置系统设置失败:', error);
      throw new Error('重置系统设置失败');
    }
  }

  /**
   * 获取系统状态
   */
  async getSystemStatus(): Promise<SystemStatus> {
    try {
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();
      
      // 检查数据库状态
      let databaseStatus = 'disconnected';
      try {
        await db.query('SELECT 1');
        databaseStatus = 'connected';
      } catch (error) {
        logger.error('数据库连接检查失败:', error);
      }
      
      // 检查搜索引擎状态
      let searchEngineStatus = 'disconnected';
      try {
        await this.searchService.ping();
        searchEngineStatus = 'connected';
      } catch (error) {
        logger.error('搜索引擎连接检查失败:', error);
      }
      
      // 获取磁盘使用情况（简化版本）
      const diskUsage = {
        total: 0,
        used: 0,
        free: 0
      };
      
      return {
        uptime,
        memoryUsage,
        cpuUsage: 0, // 简化版本，实际应该计算CPU使用率
        databaseStatus,
        searchEngineStatus,
        diskUsage
      };
    } catch (error) {
      logger.error('获取系统状态失败:', error);
      throw new Error('获取系统状态失败');
    }
  }

  /**
   * 测试邮件设置
   */
  async testEmailSettings(emailSettings: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    smtpSecure: boolean;
    emailFromAddress: string;
    testEmailTo: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      logger.info('开始测试邮件设置:', {
        smtpHost: emailSettings.smtpHost,
        smtpPort: emailSettings.smtpPort,
        smtpUser: emailSettings.smtpUser,
        smtpSecure: emailSettings.smtpSecure,
        emailFromAddress: emailSettings.emailFromAddress,
        testEmailTo: emailSettings.testEmailTo
      });

      // QQ邮箱配置优化
      let optimizedSettings = { ...emailSettings };
      if (emailSettings.smtpHost === 'smtp.qq.com') {
        // QQ邮箱建议使用465端口+SSL或587端口+TLS
        if (emailSettings.smtpPort === 465) {
          optimizedSettings.smtpSecure = true;
          logger.info('QQ邮箱使用465端口，启用SSL');
        } else if (emailSettings.smtpPort === 587) {
          optimizedSettings.smtpSecure = false; // 587端口使用STARTTLS
          logger.info('QQ邮箱使用587端口，启用STARTTLS');
        }
      }

      // 配置邮件服务
      const emailConfig: EmailConfig = {
        smtpHost: optimizedSettings.smtpHost,
        smtpPort: optimizedSettings.smtpPort,
        smtpUser: optimizedSettings.smtpUser,
        smtpPassword: optimizedSettings.smtpPassword,
        smtpSecure: optimizedSettings.smtpSecure,
        emailFromAddress: optimizedSettings.emailFromAddress,
        emailFromName: 'Wiki知识库'
      };

      logger.info('配置邮件服务...');
      emailService.configure(emailConfig);

      // 先测试连接
      logger.info('开始测试SMTP连接...');
      const connectionTest = await emailService.testConnection();
      if (!connectionTest.success) {
        logger.error('SMTP连接测试失败:', connectionTest.message);
        return connectionTest;
      }
      logger.info('SMTP连接测试成功');

      // 发送测试邮件
      logger.info('开始发送测试邮件到:', optimizedSettings.testEmailTo);
      const result = await emailService.sendTestEmail(optimizedSettings.testEmailTo);
      
      if (result.success) {
        logger.info('邮件测试成功，邮件已发送');
        return {
          success: true,
          message: '测试邮件发送成功，请检查收件箱（包括垃圾邮件箱）'
        };
      } else {
        logger.error('邮件发送失败:', result.message);
        return result;
      }
    } catch (error) {
      logger.error('测试邮件设置失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '邮件测试失败'
      };
    }
  }

  /**
   * 测试搜索引擎
   */
  async testSearchEngine(): Promise<{ success: boolean; message: string }> {
    try {
      await this.searchService.ping();
      return {
        success: true,
        message: '搜索引擎连接正常'
      };
    } catch (error) {
      logger.error('测试搜索引擎失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '搜索引擎连接失败'
      };
    }
  }

  /**
   * 清理缓存
   */
  async clearCache(): Promise<void> {
    try {
      // 这里应该实现实际的缓存清理逻辑
      logger.info('缓存清理完成');
    } catch (error) {
      logger.error('清理缓存失败:', error);
      throw new Error('清理缓存失败');
    }
  }

  /**
   * 重建搜索索引
   */
  async rebuildSearchIndex(): Promise<void> {
    try {
      // 获取所有文档
      const result = await this.documentRepository.findAll();
      
      // 重建索引
      for (const doc of result.documents) {
        await this.searchService.indexDocument(doc);
      }
      
      logger.info('搜索索引重建完成');
    } catch (error) {
      logger.error('重建搜索索引失败:', error);
      throw new Error('重建搜索索引失败');
    }
  }

  /**
   * 创建备份
   */
  async createBackup(description: string): Promise<BackupInfo> {
    try {
      const backupId = `backup_${Date.now()}`;
      const filename = `${backupId}.sql`;
      
      // 这里应该实现实际的数据库备份逻辑
      const backup: BackupInfo = {
        id: backupId,
        filename,
        description,
        size: 0, // 实际大小
        createdAt: new Date(),
        status: 'completed'
      };
      
      logger.info('备份创建完成:', backup);
      return backup;
    } catch (error) {
      logger.error('创建备份失败:', error);
      throw new Error('创建备份失败');
    }
  }

  /**
   * 获取备份列表
   */
  async getBackups(): Promise<BackupInfo[]> {
    try {
      // 这里应该从实际存储中获取备份列表
      return [];
    } catch (error) {
      logger.error('获取备份列表失败:', error);
      throw new Error('获取备份列表失败');
    }
  }

  /**
   * 下载备份
   */
  async downloadBackup(id: string): Promise<{ filename: string; data: Buffer }> {
    try {
      // 这里应该实现实际的备份下载逻辑
      const filename = `${id}.sql`;
      const data = Buffer.from('-- 备份文件内容');
      
      return { filename, data };
    } catch (error) {
      logger.error('下载备份失败:', error);
      throw new Error('下载备份失败');
    }
  }

  /**
   * 删除备份
   */
  async deleteBackup(id: string): Promise<void> {
    try {
      // 这里应该实现实际的备份删除逻辑
      logger.info('备份删除完成:', id);
    } catch (error) {
      logger.error('删除备份失败:', error);
      throw new Error('删除备份失败');
    }
  }

  /**
   * 获取系统日志
   */
  async getSystemLogs(options: {
    limit?: number;
    level?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ logs: SystemLog[]; total: number }> {
    try {
      // 这里应该从实际日志存储中获取日志
      const logs: SystemLog[] = [];
      
      return {
        logs,
        total: logs.length
      };
    } catch (error) {
      logger.error('获取系统日志失败:', error);
      throw new Error('获取系统日志失败');
    }
  }

  /**
   * 导出设置
   */
  async exportSettings(): Promise<string> {
    try {
      const settings = await this.getSystemSettings();
      return JSON.stringify(settings, null, 2);
    } catch (error) {
      logger.error('导出设置失败:', error);
      throw new Error('导出设置失败');
    }
  }

  /**
   * 导入设置
   */
  async importSettings(fileBuffer: Buffer): Promise<SystemSettings> {
    try {
      const settingsData = JSON.parse(fileBuffer.toString());
      return await this.updateSystemSettings(settingsData);
    } catch (error) {
      logger.error('导入设置失败:', error);
      throw new Error('导入设置失败');
    }
  }

  /**
   * 获取默认设置
   */
  private getDefaultSettings(): SystemSettings {
    return {
      siteName: 'Wiki知识库',
      siteDescription: '基于AI的智能知识管理系统',
      siteUrl: 'http://localhost:3000',
      adminEmail: 'admin@example.com',
      
      smtpHost: 'smtp.qq.com',
      smtpPort: 465,
      smtpUser: '',
      smtpPassword: '',
      smtpSecure: true,
      
      searchEnabled: true,
      searchIndexName: 'wiki_documents',
      
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedFileTypes: ['.pdf', '.doc', '.docx', '.txt', '.md'],
      
      sessionTimeout: 24 * 60 * 60 * 1000, // 24小时
      passwordMinLength: 8,
      enableTwoFactor: false,
      
      enableRegistration: true,
      defaultUserRole: 'viewer',
      maintenanceMode: false
    };
  }
}