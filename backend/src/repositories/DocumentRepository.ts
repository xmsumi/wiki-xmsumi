import { db } from '@/config/database';
import { Document } from '@/models/Document';
import { DocumentVersion } from '@/models/DocumentVersion';
import { 
  DocumentEntity, 
  DocumentVersionEntity,
  CreateDocumentRequest, 
  UpdateDocumentRequest, 
  DocumentQueryOptions,
  DocumentVersionQueryOptions,
  DocumentStats,
  DocumentStatus
} from '@/types/document';
import { logger } from '@/utils/logger';

/**
 * 文档数据访问层
 */
export class DocumentRepository {
  private tableName = 'documents';
  private versionTableName = 'document_versions';

  /**
   * 创建文档
   */
  async create(documentData: CreateDocumentRequest, authorId: number): Promise<Document> {
    const connection = await db.getPool().getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 生成唯一的slug
      const slug = await Document.generateUniqueSlug(
        documentData.title, 
        async (slug: string) => await this.existsBySlug(slug)
      );
      
      const documentEntity = Document.fromCreateRequest(documentData, authorId);
      documentEntity.slug = slug;
      
      // 插入文档
      const documentSql = `
        INSERT INTO ${this.tableName} 
        (title, slug, content, content_type, directory_id, author_id, status, tags, meta_data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const documentParams = [
        documentEntity.title,
        documentEntity.slug,
        documentEntity.content,
        documentEntity.content_type,
        documentEntity.directory_id || null,
        documentEntity.author_id,
        documentEntity.status,
        documentEntity.tags,
        documentEntity.meta_data,
        documentEntity.created_at,
        documentEntity.updated_at
      ];

      const documentResult = await connection.execute(documentSql, documentParams);
      const documentId = (documentResult[0] as any).insertId;

      // 创建初始版本
      const versionEntity = DocumentVersion.create(
        documentId,
        1,
        documentData.title,
        documentData.content,
        authorId,
        '初始版本'
      );

      const versionSql = `
        INSERT INTO ${this.versionTableName}
        (document_id, version_number, title, content, author_id, change_summary, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      const versionParams = [
        versionEntity.document_id,
        versionEntity.version_number,
        versionEntity.title,
        versionEntity.content,
        versionEntity.author_id,
        versionEntity.change_summary,
        versionEntity.created_at
      ];

      await connection.execute(versionSql, versionParams);
      
      await connection.commit();
      
      logger.info(`文档创建成功: ${documentData.title} (ID: ${documentId})`);
      
      // 返回创建的文档
      const createdDocument = await this.findById(documentId);
      if (!createdDocument) {
        throw new Error('创建文档后无法找到文档记录');
      }
      
      return createdDocument;
    } catch (error) {
      await connection.rollback();
      logger.error('创建文档失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 根据ID查找文档
   */
  async findById(id: number): Promise<Document | null> {
    try {
      const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
      const results = await db.query(sql, [id]);
      
      if (results.length === 0) {
        return null;
      }
      
      return new Document(results[0] as DocumentEntity);
    } catch (error) {
      logger.error(`根据ID查找文档失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 根据slug查找文档
   */
  async findBySlug(slug: string): Promise<Document | null> {
    try {
      const sql = `SELECT * FROM ${this.tableName} WHERE slug = ?`;
      const results = await db.query(sql, [slug]);
      
      if (results.length === 0) {
        return null;
      }
      
      return new Document(results[0] as DocumentEntity);
    } catch (error) {
      logger.error(`根据slug查找文档失败 (slug: ${slug}):`, error);
      throw error;
    }
  }

  /**
   * 查找所有文档（支持分页和筛选）
   */
  async findAll(options: DocumentQueryOptions = {}): Promise<{ documents: Document[]; total: number }> {
    try {
      const { limit = 10, offset = 0, sort_by = 'updated_at', sort_order = 'DESC' } = options;
      
      // 构建WHERE条件
      const conditions: string[] = [];
      const params: any[] = [];
      
      if (options.id) {
        conditions.push('id = ?');
        params.push(options.id);
      }
      
      if (options.title) {
        conditions.push('title LIKE ?');
        params.push(`%${options.title}%`);
      }
      
      if (options.slug) {
        conditions.push('slug = ?');
        params.push(options.slug);
      }
      
      if (options.directory_id !== undefined) {
        if (options.directory_id === null) {
          conditions.push('directory_id IS NULL');
        } else {
          conditions.push('directory_id = ?');
          params.push(options.directory_id);
        }
      }
      
      if (options.author_id) {
        conditions.push('author_id = ?');
        params.push(options.author_id);
      }
      
      if (options.status) {
        conditions.push('status = ?');
        params.push(options.status);
      }
      
      if (options.content_type) {
        conditions.push('content_type = ?');
        params.push(options.content_type);
      }
      
      if (options.search) {
        conditions.push('(title LIKE ? OR content LIKE ?)');
        params.push(`%${options.search}%`, `%${options.search}%`);
      }
      
      if (options.tags && options.tags.length > 0) {
        const tagConditions = options.tags.map(() => 'JSON_CONTAINS(tags, ?)').join(' AND ');
        conditions.push(`(${tagConditions})`);
        options.tags.forEach(tag => {
          params.push(JSON.stringify(tag));
        });
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      
      // 查询总数
      const countSql = `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}`;
      const countResult = await db.query(countSql, params);
      const total = countResult[0].total;
      
      // 查询数据
      const dataSql = `
        SELECT * FROM ${this.tableName} 
        ${whereClause} 
        ORDER BY ${sort_by} ${sort_order}
        LIMIT ? OFFSET ?
      `;
      const dataParams = [...params, limit, offset];
      const results = await db.query(dataSql, dataParams);
      
      const documents = results.map((row: DocumentEntity) => new Document(row));
      
      return { documents, total };
    } catch (error) {
      logger.error('查找文档列表失败:', error);
      throw error;
    }
  }

  /**
   * 更新文档
   */
  async update(id: number, documentData: UpdateDocumentRequest, authorId: number): Promise<Document | null> {
    const connection = await db.getPool().getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 获取当前文档
      const currentDocument = await this.findById(id);
      if (!currentDocument) {
        return null;
      }
      
      const updateData = Document.fromUpdateRequest(documentData);
      
      // 如果标题改变，需要重新生成slug
      if (documentData.title && documentData.title !== currentDocument.title) {
        updateData.slug = await Document.generateUniqueSlug(
          documentData.title,
          async (slug: string) => {
            const existing = await this.findBySlug(slug);
            return existing !== null && existing.id !== id;
          }
        );
      }
      
      // 构建更新字段
      const fields: string[] = [];
      const params: any[] = [];
      
      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          fields.push(`${key} = ?`);
          params.push(value);
        }
      });
      
      if (fields.length === 0) {
        throw new Error('没有要更新的字段');
      }
      
      params.push(id);
      
      const documentSql = `UPDATE ${this.tableName} SET ${fields.join(', ')} WHERE id = ?`;
      const result = await connection.execute(documentSql, params);
      
      if ((result[0] as any).affectedRows === 0) {
        await connection.rollback();
        return null;
      }
      
      // 如果内容或标题有变化，创建新版本
      const contentChanged = documentData.content && documentData.content !== currentDocument.content;
      const titleChanged = documentData.title && documentData.title !== currentDocument.title;
      
      if (contentChanged || titleChanged) {
        // 获取最新版本号
        const latestVersionSql = `
          SELECT MAX(version_number) as max_version 
          FROM ${this.versionTableName} 
          WHERE document_id = ?
        `;
        const versionResult = await connection.execute(latestVersionSql, [id]);
        const maxVersion = (versionResult[0] as any)[0]?.max_version || 0;
        
        // 生成变更摘要
        const changeSummary = documentData.change_summary || 
          DocumentVersion.generateChangeSummary(
            currentDocument.content,
            documentData.content || currentDocument.content,
            currentDocument.title,
            documentData.title || currentDocument.title
          );
        
        // 创建新版本
        const versionEntity = DocumentVersion.create(
          id,
          maxVersion + 1,
          documentData.title || currentDocument.title,
          documentData.content || currentDocument.content,
          authorId,
          changeSummary
        );

        const versionSql = `
          INSERT INTO ${this.versionTableName}
          (document_id, version_number, title, content, author_id, change_summary, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const versionParams = [
          versionEntity.document_id,
          versionEntity.version_number,
          versionEntity.title,
          versionEntity.content,
          versionEntity.author_id,
          versionEntity.change_summary,
          versionEntity.created_at
        ];

        await connection.execute(versionSql, versionParams);
      }
      
      await connection.commit();
      
      logger.info(`文档更新成功 (ID: ${id})`);
      
      // 返回更新后的文档
      return await this.findById(id);
    } catch (error) {
      await connection.rollback();
      logger.error(`更新文档失败 (ID: ${id}):`, error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 删除文档（软删除）
   */
  async delete(id: number): Promise<boolean> {
    try {
      const sql = `UPDATE ${this.tableName} SET status = ?, updated_at = ? WHERE id = ?`;
      const params = [DocumentStatus.ARCHIVED, new Date(), id];
      
      const result = await db.query(sql, params);
      
      if (result.affectedRows === 0) {
        return false;
      }
      
      logger.info(`文档软删除成功 (ID: ${id})`);
      return true;
    } catch (error) {
      logger.error(`删除文档失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 物理删除文档
   */
  async hardDelete(id: number): Promise<boolean> {
    const connection = await db.getPool().getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 删除所有版本
      const deleteVersionsSql = `DELETE FROM ${this.versionTableName} WHERE document_id = ?`;
      await connection.execute(deleteVersionsSql, [id]);
      
      // 删除文档
      const deleteDocumentSql = `DELETE FROM ${this.tableName} WHERE id = ?`;
      const result = await connection.execute(deleteDocumentSql, [id]);
      
      if ((result[0] as any).affectedRows === 0) {
        await connection.rollback();
        return false;
      }
      
      await connection.commit();
      
      logger.info(`文档物理删除成功 (ID: ${id})`);
      return true;
    } catch (error) {
      await connection.rollback();
      logger.error(`物理删除文档失败 (ID: ${id}):`, error);
      throw error;
    } finally {
      connection.release();
    }
  }  /**
 
  * 获取文档版本历史
   */
  async getVersions(documentId: number, options: DocumentVersionQueryOptions = {}): Promise<{ versions: DocumentVersion[]; total: number }> {
    try {
      const { limit = 10, offset = 0 } = options;
      
      // 构建WHERE条件
      const conditions: string[] = ['document_id = ?'];
      const params: any[] = [documentId];
      
      if (options.author_id) {
        conditions.push('author_id = ?');
        params.push(options.author_id);
      }

      const whereClause = `WHERE ${conditions.join(' AND ')}`;
      
      // 查询总数
      const countSql = `SELECT COUNT(*) as total FROM ${this.versionTableName} ${whereClause}`;
      const countResult = await db.query(countSql, params);
      const total = countResult[0].total;
      
      // 查询数据
      const dataSql = `
        SELECT * FROM ${this.versionTableName} 
        ${whereClause} 
        ORDER BY version_number DESC
        LIMIT ? OFFSET ?
      `;
      const dataParams = [...params, limit, offset];
      const results = await db.query(dataSql, dataParams);
      
      const versions = results.map((row: DocumentVersionEntity) => new DocumentVersion(row));
      
      return { versions, total };
    } catch (error) {
      logger.error(`获取文档版本历史失败 (document_id: ${documentId}):`, error);
      throw error;
    }
  }

  /**
   * 根据版本号获取文档版本
   */
  async getVersionByNumber(documentId: number, versionNumber: number): Promise<DocumentVersion | null> {
    try {
      const sql = `SELECT * FROM ${this.versionTableName} WHERE document_id = ? AND version_number = ?`;
      const results = await db.query(sql, [documentId, versionNumber]);
      
      if (results.length === 0) {
        return null;
      }
      
      return new DocumentVersion(results[0] as DocumentVersionEntity);
    } catch (error) {
      logger.error(`根据版本号获取文档版本失败 (document_id: ${documentId}, version: ${versionNumber}):`, error);
      throw error;
    }
  }

  /**
   * 获取文档的最新版本号
   */
  async getLatestVersionNumber(documentId: number): Promise<number> {
    try {
      const sql = `SELECT MAX(version_number) as max_version FROM ${this.versionTableName} WHERE document_id = ?`;
      const results = await db.query(sql, [documentId]);
      
      return results[0]?.max_version || 0;
    } catch (error) {
      logger.error(`获取文档最新版本号失败 (document_id: ${documentId}):`, error);
      throw error;
    }
  }

  /**
   * 检查slug是否存在
   */
  async existsBySlug(slug: string, excludeId?: number): Promise<boolean> {
    try {
      let sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE slug = ?`;
      const params: any[] = [slug];
      
      if (excludeId) {
        sql += ' AND id != ?';
        params.push(excludeId);
      }
      
      const result = await db.query(sql, params);
      return result[0].count > 0;
    } catch (error) {
      logger.error(`检查slug是否存在失败 (slug: ${slug}):`, error);
      throw error;
    }
  }

  /**
   * 根据目录ID获取文档数量
   */
  async countByDirectoryId(directoryId: number | null): Promise<number> {
    try {
      let sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE `;
      const params: any[] = [];
      
      if (directoryId === null) {
        sql += 'directory_id IS NULL';
      } else {
        sql += 'directory_id = ?';
        params.push(directoryId);
      }
      
      const result = await db.query(sql, params);
      return result[0].count;
    } catch (error) {
      logger.error(`根据目录ID统计文档数量失败 (directory_id: ${directoryId}):`, error);
      throw error;
    }
  }

  /**
   * 根据作者ID获取文档数量
   */
  async countByAuthorId(authorId: number): Promise<number> {
    try {
      const sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE author_id = ?`;
      const result = await db.query(sql, [authorId]);
      return result[0].count;
    } catch (error) {
      logger.error(`根据作者ID统计文档数量失败 (author_id: ${authorId}):`, error);
      throw error;
    }
  }

  /**
   * 根据状态获取文档数量
   */
  async countByStatus(status: DocumentStatus): Promise<number> {
    try {
      const sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE status = ?`;
      const result = await db.query(sql, [status]);
      return result[0].count;
    } catch (error) {
      logger.error(`根据状态统计文档数量失败 (status: ${status}):`, error);
      throw error;
    }
  }

  /**
   * 获取文档统计信息
   */
  async getStats(): Promise<DocumentStats> {
    try {
      const totalSql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
      const publishedSql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE status = ?`;
      const draftSql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE status = ?`;
      const archivedSql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE status = ?`;
      const versionsSql = `SELECT COUNT(*) as count FROM ${this.versionTableName}`;
      
      const [totalResult, publishedResult, draftResult, archivedResult, versionsResult] = await Promise.all([
        db.query(totalSql),
        db.query(publishedSql, [DocumentStatus.PUBLISHED]),
        db.query(draftSql, [DocumentStatus.DRAFT]),
        db.query(archivedSql, [DocumentStatus.ARCHIVED]),
        db.query(versionsSql)
      ]);
      
      return {
        total_documents: totalResult[0].count,
        published_documents: publishedResult[0].count,
        draft_documents: draftResult[0].count,
        archived_documents: archivedResult[0].count,
        total_versions: versionsResult[0].count
      };
    } catch (error) {
      logger.error('获取文档统计信息失败:', error);
      throw error;
    }
  }

  /**
   * 搜索文档（全文搜索）
   */
  async search(query: string, options: Omit<DocumentQueryOptions, 'search'> = {}): Promise<{ documents: Document[]; total: number }> {
    try {
      const searchOptions: DocumentQueryOptions = {
        ...options,
        search: query
      };
      
      return await this.findAll(searchOptions);
    } catch (error) {
      logger.error(`搜索文档失败 (query: ${query}):`, error);
      throw error;
    }
  }

  /**
   * 获取热门标签
   */
  async getPopularTags(limit: number = 10): Promise<Array<{ tag: string; count: number }>> {
    try {
      // 这是一个简化的实现，实际生产环境中可能需要更复杂的标签统计逻辑
      const sql = `
        SELECT tags FROM ${this.tableName} 
        WHERE tags IS NOT NULL AND tags != '[]' AND status = ?
      `;
      const results = await db.query(sql, [DocumentStatus.PUBLISHED]);
      
      const tagCounts: Map<string, number> = new Map();
      
      results.forEach((row: any) => {
        try {
          const tags = JSON.parse(row.tags);
          if (Array.isArray(tags)) {
            tags.forEach((tag: string) => {
              tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
            });
          }
        } catch {
          // 忽略JSON解析错误
        }
      });
      
      return Array.from(tagCounts.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    } catch (error) {
      logger.error('获取热门标签失败:', error);
      throw error;
    }
  }

  /**
   * 批量更新文档状态
   */
  async batchUpdateStatus(ids: number[], status: DocumentStatus): Promise<number> {
    try {
      if (ids.length === 0) {
        return 0;
      }
      
      const placeholders = ids.map(() => '?').join(',');
      const sql = `UPDATE ${this.tableName} SET status = ?, updated_at = ? WHERE id IN (${placeholders})`;
      const params = [status, new Date(), ...ids];
      
      const result = await db.query(sql, params);
      
      logger.info(`批量更新文档状态成功: ${result.affectedRows}个文档更新为${status}`);
      return result.affectedRows;
    } catch (error) {
      logger.error(`批量更新文档状态失败 (ids: ${ids.join(',')}, status: ${status}):`, error);
      throw error;
    }
  }
}