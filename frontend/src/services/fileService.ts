import { apiClient } from './api';

/**
 * 文件上传响应接口
 */
export interface FileUploadResponse {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  size: number;
  mimeType: string;
  createdAt: string;
}

/**
 * 文件信息接口
 */
export interface FileInfo {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  size: number;
  mimeType: string;
  uploaderId: number;
  createdAt: string;
}

/**
 * 文件列表响应接口
 */
export interface FileListResponse {
  files: FileInfo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * 文件服务类
 */
class FileService {
  /**
   * 上传单个文件
   */
  async uploadFile(
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<FileUploadResponse> {
    return await apiClient.upload('/api/files/upload', file, onProgress);
  }

  /**
   * 上传多个文件
   */
  async uploadFiles(
    files: File[], 
    onProgress?: (progress: number) => void
  ): Promise<FileUploadResponse[]> {
    const uploadPromises = files.map(file => this.uploadFile(file, onProgress));
    return await Promise.all(uploadPromises);
  }

  /**
   * 上传头像
   */
  async uploadAvatar(
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<FileUploadResponse> {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      throw new Error('只能上传图片文件');
    }

    // 验证文件大小 (2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('图片文件大小不能超过2MB');
    }

    return await this.uploadFile(file, onProgress);
  }

  /**
   * 上传文档附件
   */
  async uploadAttachment(
    file: File, 
    documentId?: string,
    onProgress?: (progress: number) => void
  ): Promise<FileUploadResponse> {
    // 验证文件大小 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('附件文件大小不能超过10MB');
    }

    const formData = new FormData();
    formData.append('file', file);
    if (documentId) {
      formData.append('documentId', documentId);
    }

    return await apiClient.post('/api/files/upload/attachment', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  }

  /**
   * 获取文件信息
   */
  async getFileInfo(fileId: string): Promise<FileInfo> {
    return await apiClient.get<FileInfo>(`/api/files/${fileId}`);
  }

  /**
   * 获取文件列表
   */
  async getFileList(params?: {
    page?: number;
    limit?: number;
    type?: string;
    search?: string;
  }): Promise<FileListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const url = `/api/files${queryString ? `?${queryString}` : ''}`;
    
    return await apiClient.get<FileListResponse>(url);
  }

  /**
   * 删除文件
   */
  async deleteFile(fileId: string): Promise<{ message: string }> {
    return await apiClient.delete<{ message: string }>(`/api/files/${fileId}`);
  }

  /**
   * 批量删除文件
   */
  async deleteFiles(fileIds: string[]): Promise<{ message: string; deletedCount: number }> {
    return await apiClient.post<{ message: string; deletedCount: number }>('/api/files/batch-delete', {
      fileIds
    });
  }

  /**
   * 获取文件下载URL
   */
  getDownloadUrl(fileId: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return `${baseUrl}/api/files/${fileId}/download`;
  }

  /**
   * 获取文件预览URL
   */
  getPreviewUrl(fileId: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return `${baseUrl}/api/files/${fileId}/preview`;
  }

  /**
   * 验证文件类型
   */
  validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.type === type;
    });
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
   * 获取文件图标
   */
  getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📈';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return '🗜️';
    if (mimeType.includes('text/')) return '📄';
    return '📎';
  }

  /**
   * 压缩图片
   */
  async compressImage(file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // 计算新的尺寸
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // 绘制压缩后的图片
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('图片压缩失败'));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = URL.createObjectURL(file);
    });
  }
}

// 导出文件服务实例
export const fileService = new FileService();