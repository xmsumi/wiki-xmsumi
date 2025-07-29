/**
 * 文档状态枚举
 */
export enum DocumentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

/**
 * 文档内容类型枚举
 */
export enum DocumentContentType {
  MARKDOWN = 'markdown',
  HTML = 'html',
  PLAIN_TEXT = 'plain_text'
}

/**
 * 文档数据库实体接口
 */
export interface DocumentEntity {
  id: number;
  title: string;
  slug: string;
  content: string;
  content_type: DocumentContentType;
  directory_id?: number;
  author_id: number;
  status: DocumentStatus;
  tags?: string; // JSON字符串
  meta_data?: string; // JSON字符串
  created_at: Date;
  updated_at: Date;
}

/**
 * 文档版本数据库实体接口
 */
export interface DocumentVersionEntity {
  id: number;
  document_id: number;
  version_number: number;
  title: string;
  content: string;
  author_id: number;
  change_summary?: string;
  created_at: Date;
}

/**
 * 创建文档请求接口
 */
export interface CreateDocumentRequest {
  title: string;
  content: string;
  content_type?: DocumentContentType;
  directory_id?: number;
  status?: DocumentStatus;
  tags?: string[];
  meta_data?: Record<string, any>;
}

/**
 * 更新文档请求接口
 */
export interface UpdateDocumentRequest {
  title?: string;
  content?: string;
  content_type?: DocumentContentType;
  directory_id?: number;
  status?: DocumentStatus;
  tags?: string[];
  meta_data?: Record<string, any>;
  change_summary?: string;
}

/**
 * 文档响应接口
 */
export interface DocumentResponse {
  id: number;
  title: string;
  slug: string;
  content: string;
  content_type: DocumentContentType;
  directory_id?: number;
  author_id: number;
  author_username?: string;
  status: DocumentStatus;
  tags: string[];
  meta_data: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  version_number?: number;
}

/**
 * 文档版本响应接口
 */
export interface DocumentVersionResponse {
  id: number;
  document_id: number;
  version_number: number;
  title: string;
  content: string;
  author_id: number;
  author_username?: string;
  change_summary?: string;
  created_at: Date;
}

/**
 * 文档查询条件接口
 */
export interface DocumentQueryOptions {
  id?: number;
  title?: string;
  slug?: string;
  directory_id?: number;
  author_id?: number;
  status?: DocumentStatus;
  content_type?: DocumentContentType;
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
  sort_by?: 'created_at' | 'updated_at' | 'title';
  sort_order?: 'ASC' | 'DESC';
}

/**
 * 文档版本查询条件接口
 */
export interface DocumentVersionQueryOptions {
  document_id?: number;
  author_id?: number;
  limit?: number;
  offset?: number;
}

/**
 * 文档统计信息接口
 */
export interface DocumentStats {
  total_documents: number;
  published_documents: number;
  draft_documents: number;
  archived_documents: number;
  total_versions: number;
}