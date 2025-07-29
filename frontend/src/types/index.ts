/**
 * 用户角色枚举
 */
export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
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
 * 用户接口
 */
export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 目录接口
 */
export interface Directory {
  id: number;
  name: string;
  description?: string;
  parentId?: number;
  path: string;
  sortOrder: number;
  children?: Directory[];
  documentCount?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 文档接口
 */
export interface Document {
  id: number;
  title: string;
  slug: string;
  content: string;
  contentType: 'markdown' | 'html';
  directoryId?: number;
  directory?: Directory;
  authorId: number;
  author?: User;
  status: DocumentStatus;
  tags: string[];
  metaData: Record<string, any>;
  viewCount?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 文档版本接口
 */
export interface DocumentVersion {
  id: number;
  documentId: number;
  versionNumber: number;
  title: string;
  content: string;
  authorId: number;
  author?: User;
  changeSummary?: string;
  createdAt: string;
}

/**
 * 文件接口
 */
export interface File {
  id: number;
  filename: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploaderId: number;
  uploader?: User;
  createdAt: string;
}

/**
 * 搜索结果接口
 */
export interface SearchResult {
  id: number;
  title: string;
  content: string;
  type: 'document' | 'directory';
  url: string;
  highlights: string[];
  score: number;
}

/**
 * 面包屑导航项接口
 */
export interface BreadcrumbItem {
  title: string;
  path: string;
  icon?: React.ReactNode;
}

/**
 * 菜单项接口
 */
export interface MenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  path?: string;
  children?: MenuItem[];
  disabled?: boolean;
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
 * 表格列配置接口
 */
export interface TableColumn {
  key: string;
  title: string;
  dataIndex?: string;
  width?: number;
  fixed?: 'left' | 'right';
  sorter?: boolean;
  render?: (value: any, record: any, index: number) => React.ReactNode;
}

/**
 * 表单字段接口
 */
export interface FormField {
  name: string;
  label: string;
  type: 'input' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'upload' | 'editor';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: any }>;
  rules?: any[];
  props?: Record<string, any>;
}

/**
 * 通知消息接口
 */
export interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
  timestamp: string;
}

/**
 * 主题配置接口
 */
export interface ThemeConfig {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  borderRadius: number;
  fontSize: number;
}

/**
 * 系统设置接口
 */
export interface SystemSettings {
  siteName: string;
  siteDescription: string;
  logo?: string;
  favicon?: string;
  theme: ThemeConfig;
  features: {
    registration: boolean;
    search: boolean;
    comments: boolean;
    fileUpload: boolean;
  };
  limits: {
    maxFileSize: number;
    maxDocuments: number;
    maxUsers: number;
  };
}