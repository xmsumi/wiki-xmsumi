import mysql from 'mysql2/promise';
import { logger } from '@/utils/logger';

/**
 * 数据库配置接口
 */
export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit: number;
  acquireTimeout: number;
  timeout: number;
}

/**
 * 获取数据库配置
 */
export const getDatabaseConfig = (): DatabaseConfig => ({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'wiki_xmsumi',
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
});

/**
 * 数据库连接池
 */
export class DatabaseConnection {
  private pool: mysql.Pool | null = null;

  /**
   * 初始化数据库连接池
   */
  async initialize(): Promise<void> {
    try {
      const config = getDatabaseConfig();
      this.pool = mysql.createPool(config);
      
      // 测试连接
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();
      
      logger.info('数据库连接池初始化成功');
    } catch (error) {
      logger.error('数据库连接失败:', error);
      throw error;
    }
  }

  /**
   * 获取数据库连接
   */
  getPool(): mysql.Pool {
    if (!this.pool) {
      throw new Error('数据库连接池未初始化');
    }
    return this.pool;
  }

  /**
   * 执行查询
   */
  async query(sql: string, params?: any[]): Promise<any> {
    if (!this.pool) {
      throw new Error('数据库连接池未初始化');
    }
    
    try {
      const [results] = await this.pool.execute(sql, params);
      return results;
    } catch (error) {
      logger.error('数据库查询错误:', { sql, params, error });
      throw error;
    }
  }

  /**
   * 关闭连接池
   */
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      logger.info('数据库连接池已关闭');
    }
  }
}

export const db = new DatabaseConnection();