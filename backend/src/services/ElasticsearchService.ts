import { Client } from '@elastic/elasticsearch';
import { ElasticsearchConfig, ELASTICSEARCH_CONFIG } from '../config/elasticsearch';
import { Document } from '../models/Document';
import { logger } from '../utils/logger';

/**
 * Elasticsearch搜索结果接口
 */
export interface ElasticsearchResult {
  documents: Document[];
  total: number;
  took: number;
  highlights?: { [key: string]: string[] };
}

/**
 * 搜索选项接口
 */
export interface SearchOptions {
  limit?: number;
  offset?: number;
  directory_id?: number;
  status?: string;
  content_type?: string;
  tags?: string[];
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

/**
 * Elasticsearch服务类
 */
export class ElasticsearchService {
  private client: Client | null;
  
  constructor() {
    this.client = ElasticsearchConfig.getClient();
  }
  
  /**
   * 检查Elasticsearch是否可用
   */
  public isAvailable(): boolean {
    return this.client !== null;
  }
  
  /**
   * 初始化索引
   */
  public async initializeIndex(): Promise<boolean> {
    if (!this.client) {
      logger.warn('Elasticsearch客户端不可用，跳过索引初始化');
      return false;
    }
    
    try {
      const indexName = ELASTICSEARCH_CONFIG.DOCUMENT_INDEX;
      
      // 检查索引是否存在
      const exists = await this.client.indices.exists({ index: indexName });
      
      if (!exists) {
        // 创建索引
        await this.client.indices.create({
          index: indexName,
          body: {
            settings: ELASTICSEARCH_CONFIG.DOCUMENT_SETTINGS,
            mappings: ELASTICSEARCH_CONFIG.DOCUMENT_MAPPING
          }
        });
        
        logger.info(`Elasticsearch索引 ${indexName} 创建成功`);
      } else {
        logger.info(`Elasticsearch索引 ${indexName} 已存在`);
      }
      
      return true;
    } catch (error) {
      logger.error('初始化Elasticsearch索引失败:', error);
      return false;
    }
  }
  
  /**
   * 索引单个文档
   */
  public async indexDocument(document: Document): Promise<boolean> {
    if (!this.client) {
      return false;
    }
    
    try {
      const indexData = {
        id: document.id,
        title: document.title,
        content: document.content,
        slug: document.slug,
        content_type: document.content_type,
        status: document.status,
        tags: document.tags || [],
        directory_id: document.directory_id,
        directory_path: '', // 暂时设为空字符串，后续可以从目录服务获取
        author_id: document.author_id,
        author_name: '', // 暂时设为空字符串，后续可以从用户服务获取
        created_at: document.created_at,
        updated_at: document.updated_at
      };
      
      await this.client.index({
        index: ELASTICSEARCH_CONFIG.DOCUMENT_INDEX,
        id: document.id.toString(),
        body: indexData
      });
      
      logger.debug(`文档 ${document.id} 已索引到Elasticsearch`);
      return true;
    } catch (error) {
      logger.error(`索引文档 ${document.id} 失败:`, error);
      return false;
    }
  }
  
  /**
   * 批量索引文档
   */
  public async bulkIndexDocuments(documents: Document[]): Promise<boolean> {
    if (!this.client || documents.length === 0) {
      return false;
    }
    
    try {
      const body = documents.flatMap(doc => [
        { index: { _index: ELASTICSEARCH_CONFIG.DOCUMENT_INDEX, _id: doc.id.toString() } },
        {
          id: doc.id,
          title: doc.title,
          content: doc.content,
          slug: doc.slug,
          content_type: doc.content_type,
          status: doc.status,
          tags: doc.tags || [],
          directory_id: doc.directory_id,
          directory_path: '', // 暂时设为空字符串，后续可以从目录服务获取
          author_id: doc.author_id,
          author_name: '', // 暂时设为空字符串，后续可以从用户服务获取
          created_at: doc.created_at,
          updated_at: doc.updated_at
        }
      ]);
      
      const response = await this.client.bulk({ body });
      
      if (response.errors) {
        logger.error('批量索引文档时出现错误:', response.items);
        return false;
      }
      
      logger.info(`成功批量索引 ${documents.length} 个文档`);
      return true;
    } catch (error) {
      logger.error('批量索引文档失败:', error);
      return false;
    }
  }
  
  /**
   * 删除文档索引
   */
  public async deleteDocument(documentId: number): Promise<boolean> {
    if (!this.client) {
      return false;
    }
    
    try {
      await this.client.delete({
        index: ELASTICSEARCH_CONFIG.DOCUMENT_INDEX,
        id: documentId.toString()
      });
      
      logger.debug(`文档 ${documentId} 的索引已删除`);
      return true;
    } catch (error: any) {
      if (error.meta?.statusCode === 404) {
        logger.debug(`文档 ${documentId} 的索引不存在，跳过删除`);
        return true;
      }
      logger.error(`删除文档 ${documentId} 索引失败:`, error);
      return false;
    }
  }
  
  /**
   * 搜索文档
   */
  public async searchDocuments(query: string, options: SearchOptions = {}): Promise<ElasticsearchResult> {
    if (!this.client) {
      throw new Error('Elasticsearch客户端不可用');
    }
    
    try {
      const {
        limit = 20,
        offset = 0,
        directory_id,
        status = 'published',
        content_type,
        tags,
        sort_by = 'updated_at',
        sort_order = 'DESC'
      } = options;
      
      // 构建搜索查询
      const searchBody: any = {
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query: query,
                  fields: ['title^2', 'content'],
                  type: 'best_fields',
                  fuzziness: 'AUTO'
                }
              }
            ],
            filter: [
              { term: { status } }
            ]
          }
        },
        highlight: {
          fields: {
            title: {},
            content: {
              fragment_size: 150,
              number_of_fragments: 3
            }
          },
          pre_tags: ['<mark>'],
          post_tags: ['</mark>']
        },
        from: offset,
        size: limit
      };
      
      // 添加过滤条件
      if (directory_id) {
        searchBody.query.bool.filter.push({ term: { directory_id } });
      }
      
      if (content_type) {
        searchBody.query.bool.filter.push({ term: { content_type } });
      }
      
      if (tags && tags.length > 0) {
        searchBody.query.bool.filter.push({ terms: { tags } });
      }
      
      // 添加排序
      if (sort_by === '_score') {
        searchBody.sort = [{ _score: { order: sort_order.toLowerCase() } }];
      } else {
        searchBody.sort = [{ [sort_by]: { order: sort_order.toLowerCase() } }];
      }
      
      const response = await this.client.search({
        index: ELASTICSEARCH_CONFIG.DOCUMENT_INDEX,
        body: searchBody
      });
      
      const documents: Document[] = response.hits.hits.map((hit: any) => ({
        ...hit._source,
        score: hit._score
      }));
      
      const highlights: { [key: string]: string[] } = {};
      response.hits.hits.forEach((hit: any) => {
        if (hit.highlight) {
          highlights[hit._id] = hit.highlight;
        }
      });
      
      return {
        documents,
        total: typeof response.hits.total === 'number' ? response.hits.total : (response.hits.total?.value || 0),
        took: response.took,
        highlights
      };
    } catch (error) {
      logger.error('Elasticsearch搜索失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取搜索建议
   */
  public async getSuggestions(query: string, size: number = 5): Promise<string[]> {
    if (!this.client) {
      return [];
    }
    
    try {
      const response = await this.client.search({
        index: ELASTICSEARCH_CONFIG.DOCUMENT_INDEX,
        body: {
          suggest: {
            title_suggest: {
              text: query,
              term: {
                field: 'title',
                size: size
              }
            }
          },
          _source: false,
          size: 0
        }
      });
      
      const suggestions: string[] = [];
      if (response.suggest?.title_suggest) {
        response.suggest.title_suggest.forEach((suggest: any) => {
          suggest.options.forEach((option: any) => {
            if (!suggestions.includes(option.text)) {
              suggestions.push(option.text);
            }
          });
        });
      }
      
      return suggestions;
    } catch (error) {
      logger.error('获取搜索建议失败:', error);
      return [];
    }
  }
  
  /**
   * 重建索引
   */
  public async reindexAllDocuments(documents: Document[]): Promise<boolean> {
    if (!this.client) {
      return false;
    }
    
    try {
      const indexName = ELASTICSEARCH_CONFIG.DOCUMENT_INDEX;
      
      // 删除现有索引
      const exists = await this.client.indices.exists({ index: indexName });
      if (exists) {
        await this.client.indices.delete({ index: indexName });
        logger.info(`已删除现有索引 ${indexName}`);
      }
      
      // 重新创建索引
      await this.initializeIndex();
      
      // 批量索引所有文档
      if (documents.length > 0) {
        await this.bulkIndexDocuments(documents);
      }
      
      logger.info('索引重建完成');
      return true;
    } catch (error) {
      logger.error('重建索引失败:', error);
      return false;
    }
  }
  
  /**
   * 获取索引统计信息
   */
  public async getIndexStats(): Promise<any> {
    if (!this.client) {
      return null;
    }
    
    try {
      const response = await this.client.indices.stats({
        index: ELASTICSEARCH_CONFIG.DOCUMENT_INDEX
      });
      
      return response.indices?.[ELASTICSEARCH_CONFIG.DOCUMENT_INDEX];
    } catch (error) {
      logger.error('获取索引统计信息失败:', error);
      return null;
    }
  }
}