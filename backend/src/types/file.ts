/**
 * 文件相关的类型定义
 */

export interface FileUploadConfig {
  maxFileSize: number; // 最大文件大小（字节）
  allowedMimeTypes: string[]; // 允许的MIME类型
  maxFilesPerHour: number; // 每小时最大上传文件数
  uploadPath: string; // 上传路径
}

export interface FileMetadata {
  id: number;
  filename: string; // 存储的文件名（随机化）
  originalName: string; // 原始文件名
  filePath: string; // 文件存储路径
  fileSize: number; // 文件大小
  mimeType: string; // MIME类型
  uploaderId: number; // 上传者ID
  createdAt: Date;
}

export interface FileUploadRequest {
  file: Express.Multer.File;
  uploaderId: number;
}

export interface FileUploadResult {
  success: boolean;
  fileId?: number;
  filename?: string;
  originalName?: string;
  fileSize?: number;
  error?: string;
}

export interface FileSecurityScanResult {
  isSafe: boolean;
  threats: string[];
  scanTime: Date;
}

// 支持的文件类型配置
export const ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  documents: ['application/pdf', 'text/plain', 'text/markdown'],
  archives: ['application/zip', 'application/x-rar-compressed'],
  office: [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
};

// 默认文件上传配置
export const DEFAULT_FILE_CONFIG: FileUploadConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    ...ALLOWED_FILE_TYPES.images,
    ...ALLOWED_FILE_TYPES.documents,
    ...ALLOWED_FILE_TYPES.archives,
    ...ALLOWED_FILE_TYPES.office
  ],
  maxFilesPerHour: 50,
  uploadPath: 'uploads'
};