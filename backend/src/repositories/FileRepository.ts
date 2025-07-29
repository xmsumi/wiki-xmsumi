import { File } from '../models/File';
import { FileMetadata } from '../types/file';
import { db } from '../config/database';
import { logger } from '../utils/logger';

/**
 * 文件数据访问层
 * 处理文件元数据的数据库操作
 */
export class FileRepository {
  /**
   * 创建文件记录
   */
  async create(fileData: Omit<FileMetadata, 'id' | 'createdAt'>): Promise<File> {
    const sql = `
      INSERT INTO files (filename, original_name, file_path, file_size, mime_type, uploader_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;

    try {
      const result = await db.query(sql, [
        fileData.filename,
        fileData.originalName,
        fileData.filePath,
        fileData.fileSize,
        fileData.mimeType,
        fileData.uploaderId
      ]);

      const insertResult = result as any;
      const fileId = insertResult.insertId;

      // 获取创建的文件记录
      const createdFile = await this.findById(fileId);
      if (!createdFile) {
        throw new Error('创建文件记录后无法找到该记录');
      }

      return createdFile;
    } catch (error) {
      logger.error('创建文件记录失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID查找文件
   */
  async findById(id: number): Promise<File | null> {
    const sql = `
      SELECT id, filename, original_name, file_path, file_size, mime_type, uploader_id, created_at
      FROM files
      WHERE id = ?
    `;

    try {
      const results = await db.query(sql, [id]);

      if (results.length === 0) {
        return null;
      }

      const row = results[0];
      return new File({
        id: row.id,
        filename: row.filename,
        originalName: row.original_name,
        filePath: row.file_path,
        fileSize: row.file_size,
        mimeType: row.mime_type,
        uploaderId: row.uploader_id,
        createdAt: row.created_at
      });
    } catch (error) {
      logger.error(`根据ID查找文件失败 (id: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 根据文件名查找文件
   */
  async findByFilename(filename: string): Promise<File | null> {
    const sql = `
      SELECT id, filename, original_name, file_path, file_size, mime_type, uploader_id, created_at
      FROM files
      WHERE filename = ?
    `;

    try {
      const results = await db.query(sql, [filename]);

      if (results.length === 0) {
        return null;
      }

      const row = results[0];
      return new File({
        id: row.id,
        filename: row.filename,
        originalName: row.original_name,
        filePath: row.file_path,
        fileSize: row.file_size,
        mimeType: row.mime_type,
        uploaderId: row.uploader_id,
        createdAt: row.created_at
      });
    } catch (error) {
      logger.error(`根据文件名查找文件失败 (filename: ${filename}):`, error);
      throw error;
    }
  }

  /**
   * 获取用户上传的文件列表
   */
  async findByUploader(uploaderId: number, limit: number = 50, offset: number = 0): Promise<File[]> {
    const sql = `
      SELECT id, filename, original_name, file_path, file_size, mime_type, uploader_id, created_at
      FROM files
      WHERE uploader_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    try {
      const results = await db.query(sql, [uploaderId, limit, offset]);

      return results.map((row: any) => new File({
        id: row.id,
        filename: row.filename,
        originalName: row.original_name,
        filePath: row.file_path,
        fileSize: row.file_size,
        mimeType: row.mime_type,
        uploaderId: row.uploader_id,
        createdAt: row.created_at
      }));
    } catch (error) {
      logger.error(`获取用户文件列表失败 (uploaderId: ${uploaderId}):`, error);
      throw error;
    }
  }

  /**
   * 获取文件列表（分页）
   */
  async findAll(limit: number = 50, offset: number = 0): Promise<File[]> {
    const sql = `
      SELECT id, filename, original_name, file_path, file_size, mime_type, uploader_id, created_at
      FROM files
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    try {
      const results = await db.query(sql, [limit, offset]);

      return results.map((row: any) => new File({
        id: row.id,
        filename: row.filename,
        originalName: row.original_name,
        filePath: row.file_path,
        fileSize: row.file_size,
        mimeType: row.mime_type,
        uploaderId: row.uploader_id,
        createdAt: row.created_at
      }));
    } catch (error) {
      logger.error('获取文件列表失败:', error);
      throw error;
    }
  }

  /**
   * 删除文件记录
   */
  async delete(id: number): Promise<boolean> {
    const sql = 'DELETE FROM files WHERE id = ?';

    try {
      const result = await db.query(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error(`删除文件记录失败 (id: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 获取用户上传文件总数
   */
  async countByUploader(uploaderId: number): Promise<number> {
    const sql = 'SELECT COUNT(*) as count FROM files WHERE uploader_id = ?';

    try {
      const results = await db.query(sql, [uploaderId]);
      return results[0].count;
    } catch (error) {
      logger.error(`获取用户文件总数失败 (uploaderId: ${uploaderId}):`, error);
      throw error;
    }
  }

  /**
   * 获取文件总数
   */
  async count(): Promise<number> {
    const sql = 'SELECT COUNT(*) as count FROM files';

    try {
      const results = await db.query(sql);
      return results[0].count;
    } catch (error) {
      logger.error('获取文件总数失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户在指定时间段内的上传数量
   */
  async countUploadsInTimeRange(uploaderId: number, startTime: Date, endTime: Date): Promise<number> {
    const sql = `
      SELECT COUNT(*) as count 
      FROM files 
      WHERE uploader_id = ? AND created_at BETWEEN ? AND ?
    `;

    try {
      const results = await db.query(sql, [uploaderId, startTime, endTime]);
      return results[0].count;
    } catch (error) {
      logger.error(`获取时间段内上传数量失败 (uploaderId: ${uploaderId}):`, error);
      throw error;
    }
  }

  /**
   * 根据MIME类型查找文件
   */
  async findByMimeType(mimeType: string, limit: number = 50, offset: number = 0): Promise<File[]> {
    const sql = `
      SELECT id, filename, original_name, file_path, file_size, mime_type, uploader_id, created_at
      FROM files
      WHERE mime_type = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    try {
      const results = await db.query(sql, [mimeType, limit, offset]);

      return results.map((row: any) => new File({
        id: row.id,
        filename: row.filename,
        originalName: row.original_name,
        filePath: row.file_path,
        fileSize: row.file_size,
        mimeType: row.mime_type,
        uploaderId: row.uploader_id,
        createdAt: row.created_at
      }));
    } catch (error) {
      logger.error(`根据MIME类型查找文件失败 (mimeType: ${mimeType}):`, error);
      throw error;
    }
  }

  /**
   * 获取存储统计信息
   */
  async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    averageSize: number;
    largestFile: number;
  }> {
    const sql = `
      SELECT 
        COUNT(*) as total_files,
        SUM(file_size) as total_size,
        AVG(file_size) as average_size,
        MAX(file_size) as largest_file
      FROM files
    `;

    try {
      const results = await db.query(sql);
      const stats = results[0];

      return {
        totalFiles: stats.total_files || 0,
        totalSize: stats.total_size || 0,
        averageSize: Math.round(stats.average_size || 0),
        largestFile: stats.largest_file || 0
      };
    } catch (error) {
      logger.error('获取存储统计信息失败:', error);
      throw error;
    }
  }
}