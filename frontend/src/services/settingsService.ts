import { apiClient } from './api';

/**
 * 系统设置接口
 */
export interface SystemSettings {
  // 网站基本信息
  siteName: string;
  siteDescription: string;
  siteKeywords: string;
  siteLogo?: string;
  siteFavicon?: string;
  siteUrl: string;
  
  // 用户注册设置
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  defaultUserRole: 'viewer' | 'editor';
  
  // 搜索引擎设置
  searchEnabled: boolean;
  searchIndexUpdateInterval: number; // 分钟
  searchResultsPerPage: number;
  searchHighlightEnabled: boolean;
  
  // 文档设置
  documentVersionsEnabled: boolean;
  maxDocumentVersions: number;
  documentAutoSave: boolean;
  documentAutoSaveInterval: number; // 秒
  
  // 文件上传设置
  maxFileSize: number; // MB
  allowedFileTypes: string[];
  imageCompressionEnabled: boolean;
  imageMaxWidth: number;
  imageMaxHeight: number;
  
  // 邮件设置
  emailEnabled: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword: string;
  emailFromAddress: string;
  emailFromName: string;
  
  // 安全设置
  sessionTimeout: number; // 分钟
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSymbols: boolean;
  maxLoginAttempts: number;
  lockoutDuration: number; // 分钟
  
  // 备份设置
  backupEnabled: boolean;
  backupInterval: number; // 小时
  backupRetentionDays: number;
  backupLocation: string;
  
  // 主题和外观
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  customCSS?: string;
  
  // 其他设置
  maintenanceMode: boolean;
  maintenanceMessage: string;
  analyticsEnabled: boolean;
  analyticsCode?: string;
  
  // 系统信息（只读）
  version: string;
  buildDate: string;
  environment: string;
}

/**
 * 备份信息接口
 */
export interface BackupInfo {
  id: string;
  filename: string;
  size: number;
  createdAt: string;
  type: 'manual' | 'automatic';
  status: 'completed' | 'failed' | 'in_progress';
  description?: string;
}

/**
 * 系统状态接口
 */
export interface SystemStatus {
  uptime: number; // 秒
  cpuUsage: number; // 百分比
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  diskUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  databaseStatus: 'connected' | 'disconnected' | 'error';
  searchEngineStatus: 'connected' | 'disconnected' | 'error';
  lastBackup?: string;
  activeUsers: number;
}

/**
 * 系统日志接口
 */
export interface SystemLog {
  id: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  timestamp: string;
  source: string;
  details?: Record<string, any>;
}

/**
 * 设置服务类
 */
class SettingsService {
  /**
   * 获取系统设置
   */
  async getSettings(): Promise<SystemSettings> {
    return await apiClient.get<SystemSettings>('/api/admin/settings');
  }

  /**
   * 更新系统设置
   */
  async updateSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    return await apiClient.put<SystemSettings>('/api/admin/settings', settings);
  }

  /**
   * 重置设置为默认值
   */
  async resetSettings(): Promise<SystemSettings> {
    return await apiClient.post<SystemSettings>('/api/admin/settings/reset');
  }

  /**
   * 获取系统状态
   */
  async getSystemStatus(): Promise<SystemStatus> {
    return await apiClient.get<SystemStatus>('/api/admin/status');
  }

  /**
   * 获取系统日志
   */
  async getSystemLogs(params?: {
    level?: string;
    source?: string;
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{
    logs: SystemLog[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    
    if (params?.level) queryParams.append('level', params.level);
    if (params?.source) queryParams.append('source', params.source);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo);

    const queryString = queryParams.toString();
    const url = `/api/admin/logs${queryString ? `?${queryString}` : ''}`;
    
    return await apiClient.get(url);
  }

  /**
   * 清理系统日志
   */
  async clearLogs(olderThanDays?: number): Promise<{ message: string; deletedCount: number }> {
    return await apiClient.post('/api/admin/logs/clear', {
      olderThanDays
    });
  }

  /**
   * 获取备份列表
   */
  async getBackups(): Promise<BackupInfo[]> {
    return await apiClient.get<BackupInfo[]>('/api/admin/backups');
  }

  /**
   * 创建备份
   */
  async createBackup(description?: string): Promise<BackupInfo> {
    return await apiClient.post<BackupInfo>('/api/admin/backups', {
      description
    });
  }

  /**
   * 下载备份
   */
  async downloadBackup(backupId: string): Promise<Blob> {
    const response = await apiClient.getInstance().get(`/api/admin/backups/${backupId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  }

  /**
   * 删除备份
   */
  async deleteBackup(backupId: string): Promise<{ message: string }> {
    return await apiClient.delete<{ message: string }>(`/api/admin/backups/${backupId}`);
  }

  /**
   * 恢复备份
   */
  async restoreBackup(backupId: string): Promise<{ message: string }> {
    return await apiClient.post<{ message: string }>(`/api/admin/backups/${backupId}/restore`);
  }

  /**
   * 测试邮件配置
   */
  async testEmailSettings(settings: {
    smtpHost: string;
    smtpPort: number;
    smtpSecure: boolean;
    smtpUser: string;
    smtpPassword: string;
    emailFromAddress: string;
    testEmailTo: string;
  }): Promise<{ success: boolean; message: string }> {
    return await apiClient.post('/api/admin/settings/test-email', settings);
  }

  /**
   * 测试搜索引擎连接
   */
  async testSearchEngine(): Promise<{ success: boolean; message: string }> {
    return await apiClient.post('/api/admin/settings/test-search');
  }

  /**
   * 重建搜索索引
   */
  async rebuildSearchIndex(): Promise<{ message: string }> {
    return await apiClient.post('/api/admin/search/rebuild-index');
  }

  /**
   * 清理缓存
   */
  async clearCache(): Promise<{ message: string }> {
    return await apiClient.post('/api/admin/cache/clear');
  }

  /**
   * 重启系统服务
   */
  async restartSystem(): Promise<{ message: string }> {
    return await apiClient.post('/api/admin/system/restart');
  }

  /**
   * 导出设置
   */
  async exportSettings(): Promise<Blob> {
    const response = await apiClient.getInstance().get('/api/admin/settings/export', {
      responseType: 'blob'
    });
    return response.data;
  }

  /**
   * 导入设置
   */
  async importSettings(file: File): Promise<{ message: string }> {
    const formData = new FormData();
    formData.append('file', file);

    return await apiClient.post('/api/admin/settings/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * 获取系统信息
   */
  async getSystemInfo(): Promise<{
    version: string;
    buildDate: string;
    environment: string;
    nodeVersion: string;
    platform: string;
    architecture: string;
    dependencies: Record<string, string>;
  }> {
    return await apiClient.get('/api/admin/system/info');
  }

  /**
   * 检查更新
   */
  async checkUpdates(): Promise<{
    hasUpdate: boolean;
    currentVersion: string;
    latestVersion?: string;
    releaseNotes?: string;
    downloadUrl?: string;
  }> {
    return await apiClient.get('/api/admin/system/check-updates');
  }

  /**
   * 格式化文件大小
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 格式化运行时间
   */
  formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}天 ${hours}小时 ${minutes}分钟`;
    } else if (hours > 0) {
      return `${hours}小时 ${minutes}分钟`;
    } else {
      return `${minutes}分钟`;
    }
  }

  /**
   * 获取日志级别颜色
   */
  getLogLevelColor(level: string): string {
    switch (level) {
      case 'error': return 'red';
      case 'warn': return 'orange';
      case 'info': return 'blue';
      case 'debug': return 'gray';
      default: return 'default';
    }
  }

  /**
   * 获取状态颜色
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'connected':
      case 'completed': return 'green';
      case 'disconnected':
      case 'failed': return 'red';
      case 'in_progress': return 'blue';
      case 'error': return 'red';
      default: return 'default';
    }
  }

  /**
   * 验证邮箱设置
   */
  validateEmailSettings(settings: Partial<SystemSettings>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (settings.emailEnabled) {
      if (!settings.smtpHost) errors.push('SMTP主机不能为空');
      if (!settings.smtpPort || settings.smtpPort < 1 || settings.smtpPort > 65535) {
        errors.push('SMTP端口必须在1-65535之间');
      }
      if (!settings.smtpUser) errors.push('SMTP用户名不能为空');
      if (!settings.smtpPassword) errors.push('SMTP密码不能为空');
      if (!settings.emailFromAddress) errors.push('发件人邮箱不能为空');
      if (!settings.emailFromName) errors.push('发件人姓名不能为空');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证文件上传设置
   */
  validateFileSettings(settings: Partial<SystemSettings>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (settings.maxFileSize && (settings.maxFileSize < 1 || settings.maxFileSize > 1024)) {
      errors.push('文件大小限制必须在1MB-1024MB之间');
    }
    
    if (settings.imageMaxWidth && (settings.imageMaxWidth < 100 || settings.imageMaxWidth > 10000)) {
      errors.push('图片最大宽度必须在100-10000像素之间');
    }
    
    if (settings.imageMaxHeight && (settings.imageMaxHeight < 100 || settings.imageMaxHeight > 10000)) {
      errors.push('图片最大高度必须在100-10000像素之间');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 获取默认设置
   */
  getDefaultSettings(): Partial<SystemSettings> {
    return {
      siteName: 'Wiki知识库',
      siteDescription: '企业级知识管理系统',
      siteKeywords: 'wiki,知识库,文档管理',
      siteUrl: 'http://localhost:3000',
      allowRegistration: false,
      requireEmailVerification: true,
      defaultUserRole: 'viewer',
      searchEnabled: true,
      searchIndexUpdateInterval: 60,
      searchResultsPerPage: 10,
      searchHighlightEnabled: true,
      documentVersionsEnabled: true,
      maxDocumentVersions: 10,
      documentAutoSave: true,
      documentAutoSaveInterval: 30,
      maxFileSize: 10,
      allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt', 'md'],
      imageCompressionEnabled: true,
      imageMaxWidth: 1920,
      imageMaxHeight: 1080,
      emailEnabled: false,
      smtpHost: 'smtp.qq.com',
      smtpPort: 465,
      smtpSecure: true,
      sessionTimeout: 480,
      passwordMinLength: 6,
      passwordRequireUppercase: false,
      passwordRequireLowercase: false,
      passwordRequireNumbers: false,
      passwordRequireSymbols: false,
      maxLoginAttempts: 5,
      lockoutDuration: 15,
      backupEnabled: true,
      backupInterval: 24,
      backupRetentionDays: 30,
      backupLocation: './backups',
      theme: 'light',
      primaryColor: '#1890ff',
      maintenanceMode: false,
      maintenanceMessage: '系统正在维护中，请稍后再试。',
      analyticsEnabled: false
    };
  }
}

// 导出设置服务实例
export const settingsService = new SettingsService();