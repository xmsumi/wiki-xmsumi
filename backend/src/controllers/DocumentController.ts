import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { DocumentRepository } from '@/repositories/DocumentRepository';
import { UserRepository } from '@/repositories/UserRepository';
import { SearchService } from '@/services/SearchService';
import { 
  CreateDocumentRequest, 
  UpdateDocumentRequest, 
  DocumentQueryOptions,
  DocumentVersionQueryOptions 
} from '@/types/document';
import { AuthenticatedRequest } from '@/middleware/auth';
import { logger } from '@/utils/logger';

/**
 * 文档控制器
 */
export class DocumentController {
  private documentRepository: DocumentRepository;
  private userRepository: UserRepository;
  private searchService: SearchService;

  constructor() {
    this.documentRepository = new DocumentRepository();
    this.userRepository = new UserRepository();
    this.searchService = new SearchService(this.documentRepository);
  }

  /**
   * 获取文档列表
   */
  async getDocuments(req: Request, res: Response): Promise<void> {
    try {
      // 验证请求参数
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '请求参数验证失败',
            details: errors.array()
          }
        });
        return;
      }

      // 构建查询选项
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      const queryOptions: DocumentQueryOptions = {
        limit,
        offset,
        title: req.query.title as string,
        directory_id: req.query.directory_id ? parseInt(req.query.directory_id as string) : undefined,
        author_id: req.query.author_id ? parseInt(req.query.author_id as string) : undefined,
        status: req.query.status as any,
        content_type: req.query.content_type as any,
        search: req.query.search as string,
        sort_by: (req.query.sort_by as any) || 'updated_at',
        sort_order: (req.query.sort_order as any) || 'DESC'
      };

      // 查询文档
      const { documents, total } = await this.documentRepository.findAll(queryOptions);

      // 获取作者信息
      const documentsWithAuthors = await Promise.all(
        documents.map(async (doc) => {
          const author = await this.userRepository.findById(doc.author_id);
          return doc.toResponse(author?.username);
        })
      );

      res.json({
        success: true,
        data: {
          documents: documentsWithAuthors,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

      logger.info(`获取文档列表成功: 返回${documents.length}个文档`);
    } catch (error) {
      logger.error('获取文档列表失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '获取文档列表失败'
        }
      });
    }
  }

  /**
   * 根据ID获取文档
   */
  async getDocument(req: Request, res: Response): Promise<void> {
    try {
      // 验证请求参数
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '请求参数验证失败',
            details: errors.array()
          }
        });
        return;
      }

      const documentId = parseInt(req.params.id);
      
      // 查找文档
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

      // 获取作者信息和最新版本号
      const [author, latestVersion] = await Promise.all([
        this.userRepository.findById(document.author_id),
        this.documentRepository.getLatestVersionNumber(documentId)
      ]);

      res.json({
        success: true,
        data: {
          document: document.toResponse(author?.username, latestVersion)
        }
      });

      logger.info(`获取文档成功: ${document.title} (ID: ${documentId})`);
    } catch (error) {
      logger.error('获取文档失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '获取文档失败'
        }
      });
    }
  }

  /**
   * 创建文档
   */
  async createDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // 验证请求参数
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '请求参数验证失败',
            details: errors.array()
          }
        });
        return;
      }

      const userId = req.user!.id;
      const documentData: CreateDocumentRequest = req.body;

      // 创建文档
      const document = await this.documentRepository.create(documentData, userId);

      // 异步索引文档到Elasticsearch（不阻塞响应）
      this.searchService.indexDocument(document).catch(error => {
        logger.error(`索引新文档失败 (ID: ${document.id}):`, error);
      });

      // 获取作者信息
      const author = await this.userRepository.findById(userId);

      res.status(201).json({
        success: true,
        data: {
          message: '文档创建成功',
          document: document.toResponse(author?.username, 1)
        }
      });

      logger.info(`文档创建成功: ${document.title} (ID: ${document.id})`);
    } catch (error) {
      logger.error('创建文档失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '创建文档失败'
        }
      });
    }
  }

  /**
   * 更新文档
   */
  async updateDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // 验证请求参数
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '请求参数验证失败',
            details: errors.array()
          }
        });
        return;
      }

      const documentId = parseInt(req.params.id);
      const userId = req.user!.id;
      const updateData: UpdateDocumentRequest = req.body;

      // 检查文档是否存在
      const existingDocument = await this.documentRepository.findById(documentId);
      if (!existingDocument) {
        res.status(404).json({
          success: false,
          error: {
            code: 'DOCUMENT_NOT_FOUND',
            message: '文档不存在'
          }
        });
        return;
      }

      // 检查权限（只有作者或管理员可以编辑）
      const user = await this.userRepository.findById(userId);
      if (!user || (existingDocument.author_id !== userId && !user.isAdmin())) {
        res.status(403).json({
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: '没有权限编辑此文档'
          }
        });
        return;
      }

      // 更新文档
      const updatedDocument = await this.documentRepository.update(documentId, updateData, userId);
      if (!updatedDocument) {
        res.status(404).json({
          success: false,
          error: {
            code: 'DOCUMENT_NOT_FOUND',
            message: '文档不存在'
          }
        });
        return;
      }

      // 异步更新Elasticsearch索引（不阻塞响应）
      this.searchService.indexDocument(updatedDocument).catch(error => {
        logger.error(`更新文档索引失败 (ID: ${documentId}):`, error);
      });

      // 获取最新版本号
      const latestVersion = await this.documentRepository.getLatestVersionNumber(documentId);

      res.json({
        success: true,
        data: {
          message: '文档更新成功',
          document: updatedDocument.toResponse(user.username, latestVersion)
        }
      });

      logger.info(`文档更新成功: ${updatedDocument.title} (ID: ${documentId})`);
    } catch (error) {
      logger.error('更新文档失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '更新文档失败'
        }
      });
    }
  }

  /**
   * 删除文档
   */
  async deleteDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // 验证请求参数
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '请求参数验证失败',
            details: errors.array()
          }
        });
        return;
      }

      const documentId = parseInt(req.params.id);
      const userId = req.user!.id;

      // 检查文档是否存在
      const existingDocument = await this.documentRepository.findById(documentId);
      if (!existingDocument) {
        res.status(404).json({
          success: false,
          error: {
            code: 'DOCUMENT_NOT_FOUND',
            message: '文档不存在'
          }
        });
        return;
      }

      // 检查权限（只有作者或管理员可以删除）
      const user = await this.userRepository.findById(userId);
      if (!user || (existingDocument.author_id !== userId && !user.isAdmin())) {
        res.status(403).json({
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: '没有权限删除此文档'
          }
        });
        return;
      }

      // 删除文档（软删除）
      const deleted = await this.documentRepository.delete(documentId);
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: {
            code: 'DOCUMENT_NOT_FOUND',
            message: '文档不存在'
          }
        });
        return;
      }

      // 异步删除Elasticsearch索引（不阻塞响应）
      this.searchService.deleteDocumentIndex(documentId).catch(error => {
        logger.error(`删除文档索引失败 (ID: ${documentId}):`, error);
      });

      res.json({
        success: true,
        data: {
          message: '文档删除成功'
        }
      });

      logger.info(`文档删除成功: ${existingDocument.title} (ID: ${documentId})`);
    } catch (error) {
      logger.error('删除文档失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '删除文档失败'
        }
      });
    }
  }  
/**
   * 获取文档版本历史
   */
  async getDocumentVersions(req: Request, res: Response): Promise<void> {
    try {
      // 验证请求参数
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '请求参数验证失败',
            details: errors.array()
          }
        });
        return;
      }

      const documentId = parseInt(req.params.id);
      
      // 检查文档是否存在
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

      // 构建查询选项
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      const queryOptions: DocumentVersionQueryOptions = {
        document_id: documentId,
        limit,
        offset
      };

      // 查询版本历史
      const { versions, total } = await this.documentRepository.getVersions(documentId, queryOptions);

      // 获取作者信息
      const versionsWithAuthors = await Promise.all(
        versions.map(async (version) => {
          const author = await this.userRepository.findById(version.author_id);
          return version.toResponse(author?.username);
        })
      );

      res.json({
        success: true,
        data: {
          versions: versionsWithAuthors,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

      logger.info(`获取文档版本历史成功: 文档ID ${documentId}, 返回${versions.length}个版本`);
    } catch (error) {
      logger.error('获取文档版本历史失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '获取文档版本历史失败'
        }
      });
    }
  }

  /**
   * 获取特定版本的文档
   */
  async getDocumentVersion(req: Request, res: Response): Promise<void> {
    try {
      // 验证请求参数
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '请求参数验证失败',
            details: errors.array()
          }
        });
        return;
      }

      const documentId = parseInt(req.params.id);
      const versionNumber = parseInt(req.params.version);
      
      // 检查文档是否存在
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

      // 查找特定版本
      const version = await this.documentRepository.getVersionByNumber(documentId, versionNumber);
      if (!version) {
        res.status(404).json({
          success: false,
          error: {
            code: 'VERSION_NOT_FOUND',
            message: '文档版本不存在'
          }
        });
        return;
      }

      // 获取作者信息
      const author = await this.userRepository.findById(version.author_id);

      res.json({
        success: true,
        data: {
          version: version.toResponse(author?.username)
        }
      });

      logger.info(`获取文档版本成功: 文档ID ${documentId}, 版本 ${versionNumber}`);
    } catch (error) {
      logger.error('获取文档版本失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '获取文档版本失败'
        }
      });
    }
  }

  /**
   * 获取文档统计信息
   */
  async getDocumentStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.documentRepository.getStats();

      res.json({
        success: true,
        data: {
          stats
        }
      });

      logger.info('获取文档统计信息成功');
    } catch (error) {
      logger.error('获取文档统计信息失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '获取文档统计信息失败'
        }
      });
    }
  }

  /**
   * 搜索文档
   */
  async searchDocuments(req: Request, res: Response): Promise<void> {
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

      // 构建查询选项
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      const searchOptions = {
        limit,
        offset,
        directory_id: req.query.directory_id ? parseInt(req.query.directory_id as string) : undefined,
        status: (req.query.status as any) || 'published',
        content_type: req.query.content_type as any,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
        sort_by: (req.query.sort_by as any) || '_score',
        sort_order: (req.query.sort_order as any) || 'DESC'
      };

      // 使用统一搜索服务进行搜索
      const searchResult = await this.searchService.searchDocuments(query, searchOptions);

      // 获取作者信息
      const documentsWithAuthors = await Promise.all(
        searchResult.documents.map(async (doc) => {
          const author = await this.userRepository.findById(doc.author_id);
          return doc.toResponse(author?.username);
        })
      );

      res.json({
        success: true,
        data: {
          documents: documentsWithAuthors,
          query,
          total: searchResult.total,
          took: searchResult.took,
          source: searchResult.source,
          highlights: searchResult.highlights,
          pagination: {
            page,
            limit,
            total: searchResult.total,
            pages: Math.ceil(searchResult.total / limit)
          }
        }
      });

      logger.info(`搜索文档成功: 关键词"${query}", 使用${searchResult.source}搜索, 返回${searchResult.documents.length}个结果, 耗时${searchResult.took}ms`);
    } catch (error) {
      logger.error('搜索文档失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '搜索文档失败'
        }
      });
    }
  }

  /**
   * 获取热门标签
   */
  async getPopularTags(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const tags = await this.documentRepository.getPopularTags(limit);

      res.json({
        success: true,
        data: {
          tags
        }
      });

      logger.info(`获取热门标签成功: 返回${tags.length}个标签`);
    } catch (error) {
      logger.error('获取热门标签失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '获取热门标签失败'
        }
      });
    }
  }
}