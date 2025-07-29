// 导出用户相关类型
export * from './user';
export * from './document';
export * from './directory';
export * from './file';

/**
 * API响应基础接口
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string | number;
    details?: any;
  };
  timestamp: string;
}

/**
 * 分页参数接口
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * 分页响应接口
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * 文档状态枚举
 */
export enum DocumentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

/**
 * 文件类型枚举
 */
export enum FileType {
  IMAGE = 'image',
  DOCUMENT = 'document',
  ARCHIVE = 'archive',
  OTHER = 'other',
}

/**
 * 请求扩展接口（添加用户信息）
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
    role: import('./user').UserRole;
  };
}