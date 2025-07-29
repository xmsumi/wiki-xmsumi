/**
 * 目录数据库实体接口
 */
export interface DirectoryEntity {
  id: number;
  name: string;
  description?: string;
  parent_id?: number | null;
  path: string;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * 创建目录请求接口
 */
export interface CreateDirectoryRequest {
  name: string;
  description?: string;
  parent_id?: number;
  sort_order?: number;
}

/**
 * 更新目录请求接口
 */
export interface UpdateDirectoryRequest {
  name?: string;
  description?: string;
  parent_id?: number;
  sort_order?: number;
}

/**
 * 移动目录请求接口
 */
export interface MoveDirectoryRequest {
  target_parent_id?: number;
  new_sort_order?: number;
}

/**
 * 目录响应接口
 */
export interface DirectoryResponse {
  id: number;
  name: string;
  description?: string;
  parent_id?: number | null;
  path: string;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
  children?: DirectoryResponse[];
  document_count?: number;
  total_document_count?: number; // 包含子目录的文档总数
}

/**
 * 目录树节点接口
 */
export interface DirectoryTreeNode {
  id: number;
  name: string;
  description?: string;
  parent_id?: number | null;
  path: string;
  sort_order: number;
  children: DirectoryTreeNode[];
  document_count: number;
  total_document_count: number;
  level: number;
  is_expanded?: boolean;
}

/**
 * 目录查询条件接口
 */
export interface DirectoryQueryOptions {
  id?: number;
  name?: string;
  parent_id?: number;
  path?: string;
  include_children?: boolean;
  include_documents?: boolean;
  max_depth?: number;
  limit?: number;
  offset?: number;
  sort_by?: 'name' | 'sort_order' | 'created_at' | 'updated_at';
  sort_order?: 'ASC' | 'DESC';
}

/**
 * 目录统计信息接口
 */
export interface DirectoryStats {
  total_directories: number;
  root_directories: number;
  max_depth: number;
  total_documents: number;
}

/**
 * 目录路径信息接口
 */
export interface DirectoryPathInfo {
  id: number;
  name: string;
  path: string;
  level: number;
}

/**
 * 目录移动结果接口
 */
export interface DirectoryMoveResult {
  moved_directory: DirectoryResponse;
  affected_paths: Array<{
    id: number;
    old_path: string;
    new_path: string;
  }>;
}

/**
 * 目录删除检查结果接口
 */
export interface DirectoryDeleteCheck {
  can_delete: boolean;
  has_children: boolean;
  has_documents: boolean;
  children_count: number;
  document_count: number;
  total_document_count: number;
  warnings: string[];
}