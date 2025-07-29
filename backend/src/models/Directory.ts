import { 
  DirectoryEntity, 
  DirectoryResponse, 
  DirectoryTreeNode,
  CreateDirectoryRequest, 
  UpdateDirectoryRequest,
  DirectoryPathInfo,
  DirectoryMoveResult
} from '@/types/directory';

/**
 * 目录模型类
 */
export class Directory {
  public id: number;
  public name: string;
  public description?: string;
  public parent_id?: number | null;
  public path: string;
  public sort_order: number;
  public created_at: Date;
  public updated_at: Date;

  /**
   * 构造函数
   */
  constructor(data: DirectoryEntity) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.parent_id = data.parent_id;
    this.path = data.path;
    this.sort_order = data.sort_order;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * 从创建请求创建目录实例数据
   */
  static fromCreateRequest(data: CreateDirectoryRequest, parentPath?: string): Partial<DirectoryEntity> {
    const now = new Date();
    const path = Directory.buildPath(parentPath, data.name);
    
    return {
      name: data.name,
      description: data.description,
      parent_id: data.parent_id,
      path: path,
      sort_order: data.sort_order || 0,
      created_at: now,
      updated_at: now
    };
  }

  /**
   * 从更新请求创建更新数据
   */
  static fromUpdateRequest(data: UpdateDirectoryRequest): Partial<DirectoryEntity> {
    const updateData: Partial<DirectoryEntity> = {
      updated_at: new Date()
    };

    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    
    if (data.description !== undefined) {
      updateData.description = data.description;
    }
    
    if (data.parent_id !== undefined) {
      updateData.parent_id = data.parent_id;
    }
    
    if (data.sort_order !== undefined) {
      updateData.sort_order = data.sort_order;
    }

    return updateData;
  }

  /**
   * 转换为响应格式
   */
  toResponse(children?: DirectoryResponse[], documentCount?: number, totalDocumentCount?: number): DirectoryResponse {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      parent_id: this.parent_id,
      path: this.path,
      sort_order: this.sort_order,
      created_at: this.created_at,
      updated_at: this.updated_at,
      children: children,
      document_count: documentCount,
      total_document_count: totalDocumentCount
    };
  }

  /**
   * 转换为树节点格式
   */
  toTreeNode(children: DirectoryTreeNode[] = [], documentCount: number = 0, totalDocumentCount: number = 0): DirectoryTreeNode {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      parent_id: this.parent_id,
      path: this.path,
      sort_order: this.sort_order,
      children: children,
      document_count: documentCount,
      total_document_count: totalDocumentCount,
      level: this.getLevel()
    };
  }

  /**
   * 检查是否为根目录
   */
  isRoot(): boolean {
    return this.parent_id === null || this.parent_id === undefined;
  }

  /**
   * 获取目录层级
   */
  getLevel(): number {
    return this.path.split('/').filter(segment => segment.length > 0).length;
  }

  /**
   * 获取父目录路径
   */
  getParentPath(): string {
    const segments = this.path.split('/').filter(segment => segment.length > 0);
    if (segments.length <= 1) {
      return '/';
    }
    return '/' + segments.slice(0, -1).join('/');
  }

  /**
   * 检查是否为指定目录的子目录
   */
  isChildOf(parentPath: string): boolean {
    return this.path.startsWith(parentPath + '/') && this.path !== parentPath;
  }

  /**
   * 检查是否为指定目录的直接子目录
   */
  isDirectChildOf(parentPath: string): boolean {
    const parentSegments = parentPath === '/' ? [] : parentPath.split('/').filter(segment => segment.length > 0);
    const currentSegments = this.path.split('/').filter(segment => segment.length > 0);
    
    return currentSegments.length === parentSegments.length + 1 && 
           this.path.startsWith(parentPath === '/' ? '/' : parentPath + '/');
  }

  /**
   * 构建目录路径
   */
  static buildPath(parentPath: string | undefined, name: string): string {
    if (!parentPath || parentPath === '/') {
      return '/' + Directory.sanitizeName(name);
    }
    
    const cleanParentPath = parentPath.endsWith('/') ? parentPath.slice(0, -1) : parentPath;
    return cleanParentPath + '/' + Directory.sanitizeName(name);
  }

  /**
   * 清理目录名称
   */
  static sanitizeName(name: string): string {
    return name
      .trim()
      .replace(/[\/\\:*?"<>|]/g, '') // 移除文件系统不允许的字符
      .replace(/\s+/g, ' ') // 将多个空格替换为单个空格
      .replace(/^\.+|\.+$/g, ''); // 移除开头和结尾的点
  }

  /**
   * 验证目录名称
   */
  static validateName(name: string): boolean {
    if (!name || typeof name !== 'string') {
      return false;
    }
    
    const trimmedName = name.trim();
    if (trimmedName.length === 0 || trimmedName.length > 255) {
      return false;
    }
    
    // 检查是否包含非法字符
    const illegalChars = /[\/\\:*?"<>|]/;
    if (illegalChars.test(trimmedName)) {
      return false;
    }
    
    // 检查是否为保留名称
    const reservedNames = ['.', '..', 'CON', 'PRN', 'AUX', 'NUL'];
    if (reservedNames.includes(trimmedName.toUpperCase())) {
      return false;
    }
    
    return true;
  }

  /**
   * 验证目录描述
   */
  static validateDescription(description?: string): boolean {
    if (description === undefined || description === null) {
      return true;
    }
    
    return typeof description === 'string' && description.length <= 1000;
  }

  /**
   * 验证排序顺序
   */
  static validateSortOrder(sortOrder?: number): boolean {
    if (sortOrder === undefined || sortOrder === null) {
      return true;
    }
    
    return typeof sortOrder === 'number' && Number.isInteger(sortOrder) && sortOrder >= 0;
  }

  /**
   * 从路径解析目录信息
   */
  static parsePathInfo(path: string): DirectoryPathInfo[] {
    const segments = path.split('/').filter(segment => segment.length > 0);
    const pathInfo: DirectoryPathInfo[] = [];
    
    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += '/' + segment;
      pathInfo.push({
        id: 0, // 需要从数据库查询获取实际ID
        name: segment,
        path: currentPath,
        level: index + 1
      });
    });
    
    return pathInfo;
  }

  /**
   * 构建目录树
   */
  static buildTree(directories: Directory[], documentCounts?: Map<number, number>): DirectoryTreeNode[] {
    const directoryMap = new Map<number, DirectoryTreeNode>();
    const rootNodes: DirectoryTreeNode[] = [];

    // 创建所有节点
    directories.forEach(dir => {
      const documentCount = documentCounts?.get(dir.id) || 0;
      const node = dir.toTreeNode([], documentCount, documentCount);
      directoryMap.set(dir.id, node);
    });

    // 构建父子关系
    directories.forEach(dir => {
      const node = directoryMap.get(dir.id)!;
      
      if (dir.isRoot()) {
        rootNodes.push(node);
      } else if (dir.parent_id) {
        const parentNode = directoryMap.get(dir.parent_id);
        if (parentNode) {
          parentNode.children.push(node);
        }
      }
    });

    // 计算总文档数量（包含子目录）
    const calculateTotalDocumentCount = (node: DirectoryTreeNode): number => {
      let total = node.document_count;
      node.children.forEach(child => {
        total += calculateTotalDocumentCount(child);
      });
      node.total_document_count = total;
      return total;
    };

    rootNodes.forEach(calculateTotalDocumentCount);

    // 按排序顺序排序
    const sortNodes = (nodes: DirectoryTreeNode[]) => {
      nodes.sort((a, b) => a.sort_order - b.sort_order);
      nodes.forEach(node => sortNodes(node.children));
    };

    sortNodes(rootNodes);
    
    return rootNodes;
  }

  /**
   * 扁平化目录树
   */
  static flattenTree(nodes: DirectoryTreeNode[]): DirectoryTreeNode[] {
    const result: DirectoryTreeNode[] = [];
    
    const flatten = (nodes: DirectoryTreeNode[]) => {
      nodes.forEach(node => {
        result.push(node);
        if (node.children.length > 0) {
          flatten(node.children);
        }
      });
    };
    
    flatten(nodes);
    return result;
  }

  /**
   * 查找目录树中的节点
   */
  static findNodeInTree(nodes: DirectoryTreeNode[], predicate: (node: DirectoryTreeNode) => boolean): DirectoryTreeNode | null {
    for (const node of nodes) {
      if (predicate(node)) {
        return node;
      }
      
      const found = Directory.findNodeInTree(node.children, predicate);
      if (found) {
        return found;
      }
    }
    
    return null;
  }

  /**
   * 获取目录的所有祖先路径
   */
  getAncestorPaths(): string[] {
    const segments = this.path.split('/').filter(segment => segment.length > 0);
    const paths: string[] = ['/'];
    
    let currentPath = '';
    segments.forEach(segment => {
      currentPath += '/' + segment;
      paths.push(currentPath);
    });
    
    return paths.slice(0, -1); // 排除自身路径
  }

  /**
   * 获取目录的所有后代路径模式
   */
  getDescendantPathPattern(): string {
    return this.path === '/' ? '/%' : this.path + '/%';
  }

  /**
   * 更新路径（用于移动操作）
   */
  updatePath(newParentPath: string): string {
    return Directory.buildPath(newParentPath, this.name);
  }

  /**
   * 检查移动操作是否会造成循环引用
   */
  wouldCreateCycle(targetParentPath: string): boolean {
    return targetParentPath.startsWith(this.path + '/') || targetParentPath === this.path;
  }
}