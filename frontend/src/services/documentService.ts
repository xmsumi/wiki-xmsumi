import { apiClient } from './api';

/**
 * 文档状态枚举
 */
export enum DocumentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
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
  authorId: number;
  status: DocumentStatus;
  tags: string[];
  metaData: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: number;
    username: string;
    email: string;
  };
  directory?: {
    id: number;
    name: string;
    path: string;
  };
  versions?: DocumentVersion[];
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
  changeSummary?: string;
  createdAt: string;
  author?: {
    id: number;
    username: string;
    email: string;
  };
}

/**
 * 创建文档请求接口
 */
export interface CreateDocumentRequest {
  title: string;
  content: string;
  contentType?: 'markdown' | 'html';
  directoryId?: number;
  status?: DocumentStatus;
  tags?: string[];
  metaData?: Record<string, any>;
}

/**
 * 更新文档请求接口
 */
export interface UpdateDocumentRequest {
  title?: string;
  content?: string;
  contentType?: 'markdown' | 'html';
  directoryId?: number;
  status?: DocumentStatus;
  tags?: string[];
  metaData?: Record<string, any>;
  changeSummary?: string;
}

/**
 * 文档列表响应接口
 */
export interface DocumentListResponse {
  documents: Document[];
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
 * 文档搜索参数接口
 */
export interface DocumentSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: DocumentStatus;
  directoryId?: number;
  authorId?: number;
  tags?: string[];
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

/**
 * 文档服务类
 */
class DocumentService {
  /**
   * 获取文档列表
   */
  async getDocuments(params?: DocumentSearchParams): Promise<DocumentListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.directoryId) queryParams.append('directoryId', params.directoryId.toString());
    if (params?.authorId) queryParams.append('authorId', params.authorId.toString());
    if (params?.tags) queryParams.append('tags', params.tags.join(','));
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const queryString = queryParams.toString();
    const url = `/api/documents${queryString ? `?${queryString}` : ''}`;
    
    return await apiClient.get<DocumentListResponse>(url);
  }

  /**
   * 获取单个文档
   */
  async getDocument(id: number): Promise<Document> {
    return await apiClient.get<Document>(`/api/documents/${id}`);
  }

  /**
   * 根据slug获取文档
   */
  async getDocumentBySlug(slug: string): Promise<Document> {
    return await apiClient.get<Document>(`/api/documents/slug/${slug}`);
  }

  /**
   * 创建文档
   */
  async createDocument(data: CreateDocumentRequest): Promise<Document> {
    return await apiClient.post<Document>('/api/documents', data);
  }

  /**
   * 更新文档
   */
  async updateDocument(id: number, data: UpdateDocumentRequest): Promise<Document> {
    return await apiClient.put<Document>(`/api/documents/${id}`, data);
  }

  /**
   * 删除文档
   */
  async deleteDocument(id: number): Promise<{ message: string }> {
    return await apiClient.delete<{ message: string }>(`/api/documents/${id}`);
  }

  /**
   * 批量删除文档
   */
  async deleteDocuments(ids: number[]): Promise<{ message: string; deletedCount: number }> {
    return await apiClient.post<{ message: string; deletedCount: number }>('/api/documents/batch-delete', {
      ids
    });
  }

  /**
   * 复制文档
   */
  async duplicateDocument(id: number, title?: string): Promise<Document> {
    return await apiClient.post<Document>(`/api/documents/${id}/duplicate`, {
      title: title || undefined
    });
  }

  /**
   * 移动文档到其他目录
   */
  async moveDocument(id: number, directoryId: number): Promise<Document> {
    return await apiClient.post<Document>(`/api/documents/${id}/move`, {
      directoryId
    });
  }

  /**
   * 获取文档版本历史
   */
  async getDocumentVersions(id: number): Promise<DocumentVersion[]> {
    return await apiClient.get<DocumentVersion[]>(`/api/documents/${id}/versions`);
  }

  /**
   * 获取特定版本的文档
   */
  async getDocumentVersion(id: number, versionNumber: number): Promise<DocumentVersion> {
    return await apiClient.get<DocumentVersion>(`/api/documents/${id}/versions/${versionNumber}`);
  }

  /**
   * 恢复到特定版本
   */
  async restoreDocumentVersion(id: number, versionNumber: number): Promise<Document> {
    return await apiClient.post<Document>(`/api/documents/${id}/versions/${versionNumber}/restore`);
  }

  /**
   * 发布文档
   */
  async publishDocument(id: number): Promise<Document> {
    return await apiClient.post<Document>(`/api/documents/${id}/publish`);
  }

  /**
   * 取消发布文档
   */
  async unpublishDocument(id: number): Promise<Document> {
    return await apiClient.post<Document>(`/api/documents/${id}/unpublish`);
  }

  /**
   * 归档文档
   */
  async archiveDocument(id: number): Promise<Document> {
    return await apiClient.post<Document>(`/api/documents/${id}/archive`);
  }

  /**
   * 取消归档文档
   */
  async unarchiveDocument(id: number): Promise<Document> {
    return await apiClient.post<Document>(`/api/documents/${id}/unarchive`);
  }

  /**
   * 获取文档统计信息
   */
  async getDocumentStats(): Promise<{
    total: number;
    published: number;
    draft: number;
    archived: number;
    byAuthor: Array<{ authorId: number; username: string; count: number }>;
    byDirectory: Array<{ directoryId: number; name: string; count: number }>;
    recentActivity: Array<{ date: string; count: number }>;
  }> {
    return await apiClient.get('/api/documents/stats');
  }

  /**
   * 搜索文档
   */
  async searchDocuments(query: string, params?: {
    page?: number;
    limit?: number;
    directoryId?: number;
    status?: DocumentStatus;
  }): Promise<DocumentListResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('q', query);
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.directoryId) queryParams.append('directoryId', params.directoryId.toString());
    if (params?.status) queryParams.append('status', params.status);

    return await apiClient.get<DocumentListResponse>(`/api/search/documents?${queryParams.toString()}`);
  }

  /**
   * 获取相关文档
   */
  async getRelatedDocuments(id: number, limit: number = 5): Promise<Document[]> {
    return await apiClient.get<Document[]>(`/api/documents/${id}/related?limit=${limit}`);
  }

  /**
   * 获取热门文档
   */
  async getPopularDocuments(limit: number = 10): Promise<Document[]> {
    return await apiClient.get<Document[]>(`/api/documents/popular?limit=${limit}`);
  }

  /**
   * 获取最近更新的文档
   */
  async getRecentDocuments(limit: number = 10): Promise<Document[]> {
    return await apiClient.get<Document[]>(`/api/documents/recent?limit=${limit}`);
  }

  /**
   * 导出文档
   */
  async exportDocument(id: number, format: 'pdf' | 'html' | 'markdown'): Promise<Blob> {
    const response = await apiClient.getInstance().get(`/api/documents/${id}/export/${format}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  /**
   * 批量导出文档
   */
  async exportDocuments(ids: number[], format: 'zip'): Promise<Blob> {
    const response = await apiClient.getInstance().post(`/api/documents/export/${format}`, 
      { ids }, 
      { responseType: 'blob' }
    );
    return response.data;
  }

  /**
   * 生成文档slug
   */
  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // 移除特殊字符
      .replace(/[\s_-]+/g, '-') // 替换空格和下划线为连字符
      .replace(/^-+|-+$/g, ''); // 移除开头和结尾的连字符
  }

  /**
   * 验证文档标题
   */
  validateTitle(title: string): { isValid: boolean; error?: string } {
    if (!title || title.trim().length === 0) {
      return { isValid: false, error: '标题不能为空' };
    }
    
    if (title.length > 255) {
      return { isValid: false, error: '标题长度不能超过255个字符' };
    }
    
    return { isValid: true };
  }

  /**
   * 格式化文档状态
   */
  formatStatus(status: DocumentStatus): string {
    switch (status) {
      case DocumentStatus.DRAFT:
        return '草稿';
      case DocumentStatus.PUBLISHED:
        return '已发布';
      case DocumentStatus.ARCHIVED:
        return '已归档';
      default:
        return '未知';
    }
  }

  /**
   * 获取状态颜色
   */
  getStatusColor(status: DocumentStatus): string {
    switch (status) {
      case DocumentStatus.DRAFT:
        return 'orange';
      case DocumentStatus.PUBLISHED:
        return 'green';
      case DocumentStatus.ARCHIVED:
        return 'gray';
      default:
        return 'default';
    }
  }
}

// 导出文档服务实例
export const documentService = new DocumentService();