import request from 'supertest';
import express from 'express';
import { SearchController } from '@/controllers/SearchController';
import { SearchService } from '@/services/SearchService';
import { DocumentRepository } from '@/repositories/DocumentRepository';
import { Document } from '@/models/Document';
import { DocumentContentType, DocumentStatus } from '@/types/document';

// Mock依赖
jest.mock('@/services/SearchService');
jest.mock('@/repositories/DocumentRepository');

const app = express();
app.use(express.json());

const searchController = new SearchController();

// 设置路由
app.get('/search/suggestions', searchController.getSuggestions.bind(searchController));
app.get('/search/status', searchController.getSearchStatus.bind(searchController));
app.post('/search/initialize', searchController.initializeSearch.bind(searchController));
app.post('/search/reindex', searchController.reindexDocuments.bind(searchController));
app.post('/search/documents/:id/index', searchController.indexDocument.bind(searchController));
app.delete('/search/documents/:id/index', searchController.deleteDocumentIndex.bind(searchController));

describe('SearchController', () => {
  let mockSearchService: jest.Mocked<SearchService>;
  let mockDocumentRepository: jest.Mocked<DocumentRepository>;

  beforeEach(() => {
    // 获取mock实例
    mockSearchService = (searchController as any).searchService;
    mockDocumentRepository = (searchController as any).documentRepository;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /search/suggestions', () => {
    it('应该返回搜索建议', async () => {
      const mockSuggestions = ['建议1', '建议2'];
      mockSearchService.getSuggestions.mockResolvedValue(mockSuggestions);

      const response = await request(app)
        .get('/search/suggestions')
        .query({ q: '测试' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.suggestions).toEqual(mockSuggestions);
      expect(response.body.data.query).toBe('测试');
      expect(mockSearchService.getSuggestions).toHaveBeenCalledWith('测试', 5);
    });

    it('应该支持自定义建议数量', async () => {
      const mockSuggestions = ['建议1'];
      mockSearchService.getSuggestions.mockResolvedValue(mockSuggestions);

      await request(app)
        .get('/search/suggestions')
        .query({ q: '测试', size: '3' })
        .expect(200);

      expect(mockSearchService.getSuggestions).toHaveBeenCalledWith('测试', 3);
    });

    it('当缺少搜索关键词时应返回400', async () => {
      const response = await request(app)
        .get('/search/suggestions')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('当搜索关键词为空时应返回400', async () => {
      const response = await request(app)
        .get('/search/suggestions')
        .query({ q: '   ' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('当获取建议失败时应返回500', async () => {
      mockSearchService.getSuggestions.mockRejectedValue(new Error('获取失败'));

      const response = await request(app)
        .get('/search/suggestions')
        .query({ q: '测试' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('GET /search/status', () => {
    it('应该返回搜索服务状态', async () => {
      const mockStatus = {
        elasticsearch: true,
        mysql: true,
        activeService: 'elasticsearch' as const
      };
      const mockIndexStats = { docs: { count: 100 } };

      mockSearchService.getSearchServiceStatus.mockReturnValue(mockStatus);
      mockSearchService.getIndexStats.mockResolvedValue(mockIndexStats);

      const response = await request(app)
        .get('/search/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toEqual(mockStatus);
      expect(response.body.data.indexStats).toEqual(mockIndexStats);
    });

    it('当获取状态失败时应返回500', async () => {
      mockSearchService.getSearchServiceStatus.mockImplementation(() => {
        throw new Error('获取状态失败');
      });

      const response = await request(app)
        .get('/search/status')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('POST /search/initialize', () => {
    it('应该成功初始化搜索服务', async () => {
      mockSearchService.initialize.mockResolvedValue();

      const response = await request(app)
        .post('/search/initialize')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('搜索服务初始化成功');
      expect(mockSearchService.initialize).toHaveBeenCalled();
    });

    it('当初始化失败时应返回500', async () => {
      mockSearchService.initialize.mockRejectedValue(new Error('初始化失败'));

      const response = await request(app)
        .post('/search/initialize')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('POST /search/reindex', () => {
    it('应该成功重建索引', async () => {
      mockSearchService.reindexAllDocuments.mockResolvedValue(true);

      const response = await request(app)
        .post('/search/reindex')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('搜索索引重建成功');
      expect(mockSearchService.reindexAllDocuments).toHaveBeenCalled();
    });

    it('当重建索引失败时应返回500', async () => {
      mockSearchService.reindexAllDocuments.mockResolvedValue(false);

      const response = await request(app)
        .post('/search/reindex')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('REINDEX_FAILED');
    });

    it('当重建索引抛出异常时应返回500', async () => {
      mockSearchService.reindexAllDocuments.mockRejectedValue(new Error('重建失败'));

      const response = await request(app)
        .post('/search/reindex')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('POST /search/documents/:id/index', () => {
    const mockDocument = new Document({
      id: 1,
      title: '测试文档',
      slug: 'test-doc',
      content: '测试内容',
      content_type: DocumentContentType.MARKDOWN,
      status: DocumentStatus.PUBLISHED,
      directory_id: 1,
      author_id: 1,
      created_at: new Date(),
      updated_at: new Date()
    });

    it('应该成功索引文档', async () => {
      mockDocumentRepository.findById.mockResolvedValue(mockDocument);
      mockSearchService.indexDocument.mockResolvedValue(true);

      const response = await request(app)
        .post('/search/documents/1/index')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('文档 1 索引成功');
      expect(mockDocumentRepository.findById).toHaveBeenCalledWith(1);
      expect(mockSearchService.indexDocument).toHaveBeenCalledWith(mockDocument);
    });

    it('当文档不存在时应返回404', async () => {
      mockDocumentRepository.findById.mockResolvedValue(null);

      const response = await request(app)
        .post('/search/documents/1/index')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('DOCUMENT_NOT_FOUND');
    });

    it('当索引失败时应返回500', async () => {
      mockDocumentRepository.findById.mockResolvedValue(mockDocument);
      mockSearchService.indexDocument.mockResolvedValue(false);

      const response = await request(app)
        .post('/search/documents/1/index')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INDEX_FAILED');
    });

    it('当索引抛出异常时应返回500', async () => {
      mockDocumentRepository.findById.mockResolvedValue(mockDocument);
      mockSearchService.indexDocument.mockRejectedValue(new Error('索引失败'));

      const response = await request(app)
        .post('/search/documents/1/index')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('DELETE /search/documents/:id/index', () => {
    it('应该成功删除文档索引', async () => {
      mockSearchService.deleteDocumentIndex.mockResolvedValue(true);

      const response = await request(app)
        .delete('/search/documents/1/index')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('文档 1 索引删除成功');
      expect(mockSearchService.deleteDocumentIndex).toHaveBeenCalledWith(1);
    });

    it('当删除索引失败时应返回500', async () => {
      mockSearchService.deleteDocumentIndex.mockResolvedValue(false);

      const response = await request(app)
        .delete('/search/documents/1/index')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('DELETE_INDEX_FAILED');
    });

    it('当删除索引抛出异常时应返回500', async () => {
      mockSearchService.deleteDocumentIndex.mockRejectedValue(new Error('删除失败'));

      const response = await request(app)
        .delete('/search/documents/1/index')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INTERNAL_ERROR');
    });
  });
});