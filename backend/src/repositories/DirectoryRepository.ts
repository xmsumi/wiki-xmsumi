import mysql from 'mysql2/promise';
import { db } from '@/config/database';
import { Directory } from '@/models/Directory';
import { 
  DirectoryEntity, 
  DirectoryQueryOptions, 
  DirectoryStats,
  DirectoryDeleteCheck,
  DirectoryMoveResult,
  DirectoryResponse
} from '@/types/directory';

/**
 * 目录数据访问层
 */
export class DirectoryRepository {
  constructor() {
    // 使用全局数据库连接
  }

  /**
   * 创建目录
   */
  async create(directoryData: Partial<DirectoryEntity>): Promise<Directory> {
    const query = `
      INSERT INTO directories (name, description, parent_id, path, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      directoryData.name,
      directoryData.description || null,
      directoryData.parent_id || null,
      directoryData.path,
      directoryData.sort_order || 0,
      directoryData.created_at,
      directoryData.updated_at
    ];

    const result = await db.query(query, values) as any;
    const insertId = result.insertId;
    
    const createdDirectory = await this.findById(insertId);
    if (!createdDirectory) {
      throw new Error('创建目录后无法找到该目录');
    }
    
    return createdDirectory;
  }

  /**
   * 根据ID查找目录
   */
  async findById(id: number): Promise<Directory | null> {
    const query = 'SELECT * FROM directories WHERE id = ?';
    const rows = await db.query(query, [id]) as DirectoryEntity[];
    
    if (rows.length === 0) {
      return null;
    }
    
    return new Directory(rows[0]);
  }

  /**
   * 根据路径查找目录
   */
  async findByPath(path: string): Promise<Directory | null> {
    const query = 'SELECT * FROM directories WHERE path = ?';
    const rows = await db.query(query, [path]) as DirectoryEntity[];
    
    if (rows.length === 0) {
      return null;
    }
    
    return new Directory(rows[0]);
  }

  /**
   * 根据父目录ID查找子目录
   */
  async findByParentId(parentId: number | null, options: DirectoryQueryOptions = {}): Promise<Directory[]> {
    let query = 'SELECT * FROM directories WHERE ';
    const values: any[] = [];
    
    if (parentId === null) {
      query += 'parent_id IS NULL';
    } else {
      query += 'parent_id = ?';
      values.push(parentId);
    }
    
    // 添加排序
    const sortBy = options.sort_by || 'sort_order';
    const sortOrder = options.sort_order || 'ASC';
    query += ` ORDER BY ${sortBy} ${sortOrder}`;
    
    // 添加分页
    if (options.limit) {
      query += ' LIMIT ?';
      values.push(options.limit);
      
      if (options.offset) {
        query += ' OFFSET ?';
        values.push(options.offset);
      }
    }
    
    const rows = await db.query(query, values) as DirectoryEntity[];
    return rows.map(row => new Directory(row));
  }

  /**
   * 查找所有目录
   */
  async findAll(options: DirectoryQueryOptions = {}): Promise<Directory[]> {
    let query = 'SELECT * FROM directories';
    const values: any[] = [];
    const conditions: string[] = [];
    
    // 添加查询条件
    if (options.name) {
      conditions.push('name LIKE ?');
      values.push(`%${options.name}%`);
    }
    
    if (options.parent_id !== undefined) {
      if (options.parent_id === null) {
        conditions.push('parent_id IS NULL');
      } else {
        conditions.push('parent_id = ?');
        values.push(options.parent_id);
      }
    }
    
    if (options.path) {
      conditions.push('path LIKE ?');
      values.push(`${options.path}%`);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    // 添加排序
    const sortBy = options.sort_by || 'sort_order';
    const sortOrder = options.sort_order || 'ASC';
    query += ` ORDER BY ${sortBy} ${sortOrder}`;
    
    // 添加分页
    if (options.limit) {
      query += ' LIMIT ?';
      values.push(options.limit);
      
      if (options.offset) {
        query += ' OFFSET ?';
        values.push(options.offset);
      }
    }
    
    const rows = await db.query(query, values) as DirectoryEntity[];
    return rows.map(row => new Directory(row));
  }

  /**
   * 更新目录
   */
  async update(id: number, updateData: Partial<DirectoryEntity>): Promise<Directory | null> {
    const fields: string[] = [];
    const values: any[] = [];
    
    if (updateData.name !== undefined) {
      fields.push('name = ?');
      values.push(updateData.name);
    }
    
    if (updateData.description !== undefined) {
      fields.push('description = ?');
      values.push(updateData.description);
    }
    
    if (updateData.parent_id !== undefined) {
      fields.push('parent_id = ?');
      values.push(updateData.parent_id);
    }
    
    if (updateData.path !== undefined) {
      fields.push('path = ?');
      values.push(updateData.path);
    }
    
    if (updateData.sort_order !== undefined) {
      fields.push('sort_order = ?');
      values.push(updateData.sort_order);
    }
    
    if (fields.length === 0) {
      return this.findById(id);
    }
    
    fields.push('updated_at = ?');
    values.push(new Date());
    values.push(id);
    
    const query = `UPDATE directories SET ${fields.join(', ')} WHERE id = ?`;
    await db.query(query, values);
    
    return this.findById(id);
  }

  /**
   * 删除目录
   */
  async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM directories WHERE id = ?';
    const result = await db.query(query, [id]) as any;
    
    return result.affectedRows > 0;
  }

  /**
   * 检查目录是否存在
   */
  async exists(id: number): Promise<boolean> {
    const query = 'SELECT 1 FROM directories WHERE id = ? LIMIT 1';
    const rows = await db.query(query, [id]) as any[];
    
    return rows.length > 0;
  }

  /**
   * 检查路径是否存在
   */
  async pathExists(path: string, excludeId?: number): Promise<boolean> {
    let query = 'SELECT 1 FROM directories WHERE path = ?';
    const values: any[] = [path];
    
    if (excludeId) {
      query += ' AND id != ?';
      values.push(excludeId);
    }
    
    query += ' LIMIT 1';
    const rows = await db.query(query, values) as any[];
    
    return rows.length > 0;
  }

  /**
   * 获取目录的文档数量
   */
  async getDocumentCount(directoryId: number): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM documents WHERE directory_id = ?';
    const rows = await db.query(query, [directoryId]) as any[];
    
    return rows[0].count;
  }

  /**
   * 获取多个目录的文档数量
   */
  async getDocumentCounts(directoryIds: number[]): Promise<Map<number, number>> {
    if (directoryIds.length === 0) {
      return new Map();
    }
    
    const placeholders = directoryIds.map(() => '?').join(',');
    const query = `
      SELECT directory_id, COUNT(*) as count 
      FROM documents 
      WHERE directory_id IN (${placeholders})
      GROUP BY directory_id
    `;
    
    const rows = await db.query(query, directoryIds) as any[];
    
    const countMap = new Map<number, number>();
    rows.forEach(row => {
      countMap.set(row.directory_id, row.count);
    });
    
    return countMap;
  }

  /**
   * 获取目录的所有子目录（递归）
   */
  async getDescendants(directoryId: number): Promise<Directory[]> {
    const directory = await this.findById(directoryId);
    if (!directory) {
      return [];
    }
    
    const query = 'SELECT * FROM directories WHERE path LIKE ? ORDER BY path';
    const pattern = directory.getDescendantPathPattern();
    const rows = await db.query(query, [pattern]) as DirectoryEntity[];
    
    return rows.map(row => new Directory(row));
  }

  /**
   * 获取目录的所有祖先
   */
  async getAncestors(directoryId: number): Promise<Directory[]> {
    const directory = await this.findById(directoryId);
    if (!directory) {
      return [];
    }
    
    const ancestorPaths = directory.getAncestorPaths();
    if (ancestorPaths.length === 0) {
      return [];
    }
    
    const placeholders = ancestorPaths.map(() => '?').join(',');
    const query = `SELECT * FROM directories WHERE path IN (${placeholders}) ORDER BY path`;
    const rows = await db.query(query, ancestorPaths) as DirectoryEntity[];
    
    return rows.map(row => new Directory(row));
  }

  /**
   * 批量更新路径（用于移动操作）
   */
  async updatePaths(pathUpdates: Array<{ id: number; newPath: string }>): Promise<void> {
    if (pathUpdates.length === 0) {
      return;
    }
    
    const connection = await db.getPool().getConnection();
    
    try {
      await connection.beginTransaction();
      
      const query = 'UPDATE directories SET path = ?, updated_at = ? WHERE id = ?';
      const now = new Date();
      
      for (const update of pathUpdates) {
        await connection.execute(query, [update.newPath, now, update.id]);
      }
      
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 获取目录统计信息
   */
  async getStats(): Promise<DirectoryStats> {
    const queries = [
      'SELECT COUNT(*) as total_directories FROM directories',
      'SELECT COUNT(*) as root_directories FROM directories WHERE parent_id IS NULL',
      'SELECT MAX(LENGTH(path) - LENGTH(REPLACE(path, "/", ""))) as max_depth FROM directories',
      'SELECT COUNT(*) as total_documents FROM documents WHERE directory_id IS NOT NULL'
    ];
    
    const results = await Promise.all(
      queries.map(query => db.query(query))
    );
    
    return {
      total_directories: (results[0] as any[])[0].total_directories,
      root_directories: (results[1] as any[])[0].root_directories,
      max_depth: (results[2] as any[])[0].max_depth || 0,
      total_documents: (results[3] as any[])[0].total_documents
    };
  }

  /**
   * 检查目录删除前的状态
   */
  async checkDeleteStatus(directoryId: number): Promise<DirectoryDeleteCheck> {
    const directory = await this.findById(directoryId);
    if (!directory) {
      throw new Error('目录不存在');
    }
    
    // 检查子目录
    const children = await this.findByParentId(directoryId);
    const hasChildren = children.length > 0;
    
    // 检查直接文档
    const documentCount = await this.getDocumentCount(directoryId);
    const hasDocuments = documentCount > 0;
    
    // 检查所有后代文档
    const descendants = await this.getDescendants(directoryId);
    const descendantIds = descendants.map(d => d.id);
    const descendantDocumentCounts = await this.getDocumentCounts(descendantIds);
    const totalDocumentCount = documentCount + Array.from(descendantDocumentCounts.values()).reduce((sum, count) => sum + count, 0);
    
    const warnings: string[] = [];
    if (hasChildren) {
      warnings.push(`该目录包含 ${children.length} 个子目录`);
    }
    if (hasDocuments) {
      warnings.push(`该目录包含 ${documentCount} 个文档`);
    }
    if (totalDocumentCount > documentCount) {
      warnings.push(`子目录中包含 ${totalDocumentCount - documentCount} 个文档`);
    }
    
    return {
      can_delete: !hasChildren && !hasDocuments,
      has_children: hasChildren,
      has_documents: hasDocuments,
      children_count: children.length,
      document_count: documentCount,
      total_document_count: totalDocumentCount,
      warnings
    };
  }

  /**
   * 获取下一个排序顺序
   */
  async getNextSortOrder(parentId: number | null): Promise<number> {
    let query = 'SELECT COALESCE(MAX(sort_order), -1) + 1 as next_order FROM directories WHERE ';
    const values: any[] = [];
    
    if (parentId === null) {
      query += 'parent_id IS NULL';
    } else {
      query += 'parent_id = ?';
      values.push(parentId);
    }
    
    const rows = await db.query(query, values) as any[];
    return rows[0].next_order;
  }

  /**
   * 重新排序同级目录
   */
  async reorderSiblings(parentId: number | null, orderedIds: number[]): Promise<void> {
    const connection = await db.getPool().getConnection();
    
    try {
      await connection.beginTransaction();
      
      const query = 'UPDATE directories SET sort_order = ?, updated_at = ? WHERE id = ?';
      const now = new Date();
      
      for (let i = 0; i < orderedIds.length; i++) {
        await connection.execute(query, [i, now, orderedIds[i]]);
      }
      
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}