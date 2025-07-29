import { ElasticsearchService, ElasticsearchResult, SearchOptions } from './ElasticsearchService';
import { DocumentRepository } from '../repositories/DocumentRepository';
import { Document } from '../models/Document';
import { logger } from '../utils/logger';

/**
 * 统一搜索结果接口
 */
export interface SearchResult {
  documents: Document[];
  total: number;
  took?: number;
  highlights?: { [key: string]: string[] };
  source: 'elasticsearch' | 'mysql';
}

/**
 * 搜索服务管理器
 * 自动选择使用Elasticsearch或MySQL进行搜索
 */
export class SearchService {
  private elasticsearchService: ElasticsearchService;
  private documentRepository: DocumentRepository;
  
  constructor(documentRepository: DocumentRepository) {
    this.elasticsearchService = new ElasticsearchService();
    this.documentRepository = documentRepository;
  }
  
  /**
   * 初始化搜索服务
   */
  public async initialize(): Promise<void> {
    if (this.elasticsearchService.isAvailable()) {
      try {
        await this.elasticsearchService.initializeIndex();
        logger.info('Elasticsearch搜索服务初始化成功');
      } catch (error) {
        logger.error('Elasticsearch搜索服务初始化失败:', error);
      }
    } else {
      logger.info('使用MySQL全文搜索服务');
    }
  }
  
  /**
   * 搜索文档
   * 优先使用Elasticsearch，如果不可用则回退到MySQL
   */
  public async searchDocuments(query: string, options: SearchOptions = {}): Promise<SearchResult> {
    // 尝试使用Elasticsearch搜索
    if (this.elasticsearchService.isAvailable()) {
      try {
        const result = await this.elasticsearchService.searchDocuments(query, options);
        return {
          ...result,
          source: 'elasticsearch'
        };
      } catch (error) {
        logger.error('Elasticsearch搜索失败，回退到MySQL搜索:', error);
      }
    }
    
    // 回退到MySQL搜索
    return await this.searchWithMySQL(query, options);
  }
  
  /**
   * 使用MySQL进行搜索
   */
  private async searchWithMySQL(query: string, options: SearchOptions = {}): Promise<SearchResult> {
    const startTime = Date.now();
    
    try {
      // 验证并转换sort_by参数，确保符合DocumentQueryOptions的类型要求
      const validSortFields = ['created_at', 'updated_at', 'title'] as const;
      const sortBy = options.sort_by && validSortFields.includes(options.sort_by as any) 
        ? options.sort_by as 'created_at' | 'updated_at' | 'title'
        : 'updated_at';
      
      const searchOptions = {
        search: query,
        limit: options.limit || 20,
        offset: options.offset || 0,
        directory_id: options.directory_id,
        status: (options.status as any) || 'published',
        content_type: options.content_type as any,
        tags: options.tags,
        sort_by: sortBy,
        sort_order: options.sort_order || 'DESC'
      };
      
      const { documents, total } = await this.documentRepository.findAll(searchOptions);
      const took = Date.now() - startTime;
      
      return {
        documents,
        total,
        took,
        source: 'mysql'
      };
    } catch (error) {
      logger.error('MySQL搜索失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取搜索建议
   */
  public async getSuggestions(query: string, size: number = 5): Promise<string[]> {
    if (this.elasticsearchService.isAvailable()) {
      try {
        return await this.elasticsearchService.getSuggestions(query, size);
      } catch (error) {
        logger.error('获取Elasticsearch搜索建议失败:', error);
      }
    }
    
    // MySQL不支持搜索建议，返回空数组
    return [];
  }
  
  /**
   * 索引文档（仅在Elasticsearch可用时）
   */
  public async indexDocument(document: Document): Promise<boolean> {
    if (this.elasticsearchService.isAvailable()) {
      return await this.elasticsearchService.indexDocument(document);
    }
    return true; // MySQL不需要额外索引
  }
  
  /**
   * 批量索引文档（仅在Elasticsearch可用时）
   */
  public async bulkIndexDocuments(documents: Document[]): Promise<boolean> {
    if (this.elasticsearchService.isAvailable()) {
      return await this.elasticsearchService.bulkIndexDocuments(documents);
    }
    return true; // MySQL不需要额外索引
  }
  
  /**
   * 删除文档索引（仅在Elasticsearch可用时）
   */
  public async deleteDocumentIndex(documentId: number): Promise<boolean> {
    if (this.elasticsearchService.isAvailable()) {
      return await this.elasticsearchService.deleteDocument(documentId);
    }
    return true; // MySQL不需要额外删除索引
  }
  
  /**
   * 重建所有索引
   */
  public async reindexAllDocuments(): Promise<boolean> {
    if (!this.elasticsearchService.isAvailable()) {
      logger.info('Elasticsearch不可用，跳过重建索引');
      return true;
    }
    
    try {
      // 获取所有已发布的文档
      const { documents } = await this.documentRepository.findAll({
        status: 'published' as any,
        limit: 10000 // 获取大量文档用于重建索引
      });
      
      return await this.elasticsearchService.reindexAllDocuments(documents);
    } catch (error) {
      logger.error('重建索引失败:', error);
      return false;
    }
  }
  
  /**
   * 获取搜索服务状态
   */
  public getSearchServiceStatus(): {
    elasticsearch: boolean;
    mysql: boolean;
    activeService: 'elasticsearch' | 'mysql';
  } {
    const elasticsearchAvailable = this.elasticsearchService.isAvailable();
    
    return {
      elasticsearch: elasticsearchAvailable,
      mysql: true, // MySQL总是可用的
      activeService: elasticsearchAvailable ? 'elasticsearch' : 'mysql'
    };
  }
  
  /**
   * 获取索引统计信息
   */
  public async getIndexStats(): Promise<any> {
    if (this.elasticsearchService.isAvailable()) {
      return await this.elasticsearchService.getIndexStats();
    }
    return null;
  }
}