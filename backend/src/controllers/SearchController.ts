import { Request, Response } from 'express';
import { SearchService } from '@/services/SearchService';
import { DocumentRepository } from '@/repositories/DocumentRepository';
import { AuthenticatedRequest } from '@/middleware/auth';
import { logger } from '@/utils/logger';

/**
 * 搜索管理控制器
 */
export class SearchController {
  private searchService: SearchService;
  private documentRepository: DocumentRepository;

  constructor() {
    this.documentRepository = new DocumentRepository();
    this.searchService = new SearchService(this.documentRepository);
  }

  /**
   * 初始化搜索服务
   */
  async initializeSearch(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      await this.searchService.initialize();

      res.json({
        success: true,
        data: {
          message: '搜索服务初始化成功'
        }
      });

      logger.info('搜索服务初始化成功');
    } catch (error) {
      logger.error('搜索服务初始化失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '搜索服务初始化失败'
        }
      });
    }
  }

  /**
   * 获取搜索建议
   */
  async getSuggestions(req: Request, res: Response): Promise<void> {
    try {
      const query = req.query.q as string;
      if (!query || query.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '搜索关键词不能为空'
          }
        });
        return;
      }

      const size = parseInt(req.query.size as string) || 5;
      const suggestions = await this.searchService.getSuggestions(query, size);

      res.json({
        success: true,
        data: {
          query,
          suggestions
        }
      });

      logger.debug(`获取搜索建议成功: 关键词"${query}", 返回${suggestions.length}个建议`);
    } catch (error) {
      logger.error('获取搜索建议失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '获取搜索建议失败'
        }
      });
    }
  }

  /**
   * 重建搜索索引
   */
  async reindexDocuments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const success = await this.searchService.reindexAllDocuments();

      if (success) {
        res.json({
          success: true,
          data: {
            message: '搜索索引重建成功'
          }
        });
        logger.info('搜索索引重建成功');
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'REINDEX_FAILED',
            message: '搜索索引重建失败'
          }
        });
      }
    } catch (error) {
      logger.error('重建搜索索引失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '重建搜索索引失败'
        }
      });
    }
  }

  /**
   * 获取搜索服务状态
   */
  async getSearchStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = this.searchService.getSearchServiceStatus();
      const indexStats = await this.searchService.getIndexStats();

      res.json({
        success: true,
        data: {
          status,
          indexStats
        }
      });

      logger.debug('获取搜索服务状态成功');
    } catch (error) {
      logger.error('获取搜索服务状态失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '获取搜索服务状态失败'
        }
      });
    }
  }

  /**
   * 索引单个文档
   */
  async indexDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const documentId = parseInt(req.params.id);
      
      // 获取文档
      const document = await this.documentRepository.findById(documentId);
      if (!document) {
        res.status(404).json({
          success: false,
          error: {
            code: 'DOCUMENT_NOT_FOUND',
            message: '文档不存在'
          }
        });
        return;
      }

      // 索引文档
      const success = await this.searchService.indexDocument(document);

      if (success) {
        res.json({
          success: true,
          data: {
            message: `文档 ${documentId} 索引成功`
          }
        });
        logger.info(`文档 ${documentId} 索引成功`);
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'INDEX_FAILED',
            message: '文档索引失败'
          }
        });
      }
    } catch (error) {
      logger.error('索引文档失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '索引文档失败'
        }
      });
    }
  }

  /**
   * 删除文档索引
   */
  async deleteDocumentIndex(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const documentId = parseInt(req.params.id);
      
      // 删除文档索引
      const success = await this.searchService.deleteDocumentIndex(documentId);

      if (success) {
        res.json({
          success: true,
          data: {
            message: `文档 ${documentId} 索引删除成功`
          }
        });
        logger.info(`文档 ${documentId} 索引删除成功`);
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'DELETE_INDEX_FAILED',
            message: '删除文档索引失败'
          }
        });
      }
    } catch (error) {
      logger.error('删除文档索引失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '删除文档索引失败'
        }
      });
    }
  }
}