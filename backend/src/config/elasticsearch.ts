import { Client } from '@elastic/elasticsearch';
import { logger } from '../utils/logger';

/**
 * Elasticsearch配置类
 */
export class ElasticsearchConfig {
  private static instance: Client | null = null;
  
  /**
   * 获取Elasticsearch客户端实例
   */
  public static getClient(): Client | null {
    if (!this.instance) {
      this.instance = this.createClient();
    }
    return this.instance;
  }
  
  /**
   * 创建Elasticsearch客户端
   */
  private static createClient(): Client | null {
    try {
      const esUrl = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
      
      // 如果没有配置Elasticsearch URL或者设置为禁用，返回null
      if (!esUrl || esUrl === 'disabled') {
        logger.info('Elasticsearch未配置或已禁用，将使用MySQL全文搜索');
        return null;
      }
      
      const client = new Client({
        node: esUrl,
        auth: process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD ? {
          username: process.env.ELASTICSEARCH_USERNAME,
          password: process.env.ELASTICSEARCH_PASSWORD
        } : undefined,
        // 开发环境下忽略SSL证书验证
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production'
        }
      });
      
      logger.info(`Elasticsearch客户端已创建，连接到: ${esUrl}`);
      return client;
    } catch (error) {
      logger.error('创建Elasticsearch客户端失败:', error);
      return null;
    }
  }
  
  /**
   * 测试Elasticsearch连接
   */
  public static async testConnection(): Promise<boolean> {
    const client = this.getClient();
    if (!client) {
      return false;
    }
    
    try {
      const response = await client.ping();
      logger.info('Elasticsearch连接测试成功');
      return true;
    } catch (error) {
      logger.error('Elasticsearch连接测试失败:', error);
      return false;
    }
  }
  
  /**
   * 关闭Elasticsearch连接
   */
  public static async close(): Promise<void> {
    if (this.instance) {
      try {
        await this.instance.close();
        this.instance = null;
        logger.info('Elasticsearch连接已关闭');
      } catch (error) {
        logger.error('关闭Elasticsearch连接失败:', error);
      }
    }
  }
}

/**
 * Elasticsearch索引配置
 */
export const ELASTICSEARCH_CONFIG = {
  // 文档索引名称
  DOCUMENT_INDEX: process.env.ELASTICSEARCH_INDEX || 'wiki_documents',
  
  // 索引映射配置
  DOCUMENT_MAPPING: {
    properties: {
      id: { type: 'integer' as const },
      title: { 
        type: 'text' as const,
        analyzer: 'standard',
        fields: {
          keyword: { type: 'keyword' as const }
        }
      },
      content: { 
        type: 'text' as const,
        analyzer: 'standard'
      },
      slug: { type: 'keyword' as const },
      content_type: { type: 'keyword' as const },
      status: { type: 'keyword' as const },
      tags: { type: 'keyword' as const },
      directory_id: { type: 'integer' as const },
      directory_path: { type: 'text' as const },
      author_id: { type: 'integer' as const },
      author_name: { type: 'keyword' as const },
      created_at: { type: 'date' as const },
      updated_at: { type: 'date' as const }
    }
  },
  
  // 索引设置
  DOCUMENT_SETTINGS: {
    number_of_shards: 1,
    number_of_replicas: 0,
    analysis: {
      analyzer: {
        standard_analyzer: {
          type: 'standard' as const
        }
      }
    }
  }
};