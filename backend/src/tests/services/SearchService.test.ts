import { SearchService } from '@/services/SearchService';
import { ElasticsearchService } from '@/services/ElasticsearchService';
import { DocumentRepository } from '@/repositories/DocumentRepository';
import { Document } from '@/models/Document';
import { DocumentContentType, DocumentStatus } from '@/types/document';

// Mock依赖
jest.mock('@/services/ElasticsearchService');
jest.mock('@/repositories/DocumentRepository');

describe('SearchService', () => {
  let searchService: SearchService;
  let mockElasticsearchService: jest.Mocked<ElasticsearchService>;
  let mockDocumentRepository: jest.Mocked<DocumentRepository>;

  beforeEach(() => {
    mockDocumentRepository = new DocumentRepository() as jest.Mocked<DocumentRepository>;
    searchService = new SearchService(mockDocumentRepository);
    
    // 获取ElasticsearchService的mock实例
    mockElasticsearchService = (searchService as any).elasticsearchService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('当Elasticsearch可用时应初始化Elasticsearch服务', async () => {
      mockElasticsearchService.isAvailable.mockReturnValue(true);
      mockElasticsearchService.initializeIndex.mockResolvedValue(true);

      await searchService.initialize();

      expect(mockElasticsearchService.initializeIndex).toHaveBeenCalled();
    });

    it('当Elasticsearch不可用时应跳过初始化', async () => {
      mockElasticsearchService.isAvailable.mockReturnValue(false);

      await searchService.initialize();

      expect(mockElasticsearchService.initializeIndex).not.toHaveBeenCalled();
    });

    it('当Elasticsearch初始化失败时应处理错误', async () => {
      mockElasticsearchService.isAvailable.mockReturnValue(true);
      mockElasticsearchService.initializeIndex.mockRejectedValue(new Error('初始化失败'));

      // 不应该抛出错误
      await expect(searchService.initialize()).resolves.toBeUndefined();
    });
  });

  describe('searchDocuments', () => {
    const mockDocuments = [
      new Document({
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
      })
    ];

    it('当Elasticsearch可用时应使用Elasticsearch搜索', async () => {
      mockElasticsearchService.isAvailable.mockReturnValue(true);
      mockElasticsearchService.searchDocuments.mockResolvedValue({
        documents: mockDocuments,
        total: 1,
        took: 10,
        highlights: {}
      });

      const result = await searchService.searchDocuments('测试');

      expect(result.source).toBe('elasticsearch');
      expect(result.documents).toEqual(mockDocuments);
      expect(result.total).toBe(1);
      expect(mockElasticsearchService.searchDocuments).toHaveBeenCalledWith('测试', {});
    });

    it('当Elasticsearch不可用时应回退到MySQL搜索', async () => {
      mockElasticsearchService.isAvailable.mockReturnValue(false);
      mockDocumentRepository.findAll.mockResolvedValue({
        documents: mockDocuments,
        total: 1
      });

      const result = await searchService.searchDocuments('测试');

      expect(result.source).toBe('mysql');
      expect(result.documents).toEqual(mockDocuments);
      expect(result.total).toBe(1);
      expect(mockDocumentRepository.findAll).toHaveBeenCalledWith({
        search: '测试',
        limit: 20,
        offset: 0,
        status: 'published',
        sort_by: 'updated_at',
        sort_order: 'DESC'
      });
    });

    it('当Elasticsearch搜索失败时应回退到MySQL搜索', async () => {
      mockElasticsearchService.isAvailable.mockReturnValue(true);
      mockElasticsearchService.searchDocuments.mockRejectedValue(new Error('搜索失败'));
      mockDocumentRepository.findAll.mockResolvedValue({
        documents: mockDocuments,
        total: 1
      });

      const result = await searchService.searchDocuments('测试');

      expect(result.source).toBe('mysql');
      expect(result.documents).toEqual(mockDocuments);
      expect(mockDocumentRepository.findAll).toHaveBeenCalled();
    });

    it('应该正确传递搜索选项', async () => {
      mockElasticsearchService.isAvailable.mockReturnValue(true);
      mockElasticsearchService.searchDocuments.mockResolvedValue({
        documents: mockDocuments,
        total: 1,
        took: 10,
        highlights: {}
      });

      const searchOptions = {
        limit: 10,
        offset: 20,
        directory_id: 1,
        status: 'published' as const,
        content_type: 'markdown' as const,
        tags: ['标签1'],
        sort_by: 'title' as const,
        sort_order: 'ASC' as const
      };

      await searchService.searchDocuments('测试', searchOptions);

      expect(mockElasticsearchService.searchDocuments).toHaveBeenCalledWith('测试', searchOptions);
    });
  });

  describe('getSuggestions', () => {
    it('当Elasticsearch可用时应返回建议', async () => {
      mockElasticsearchService.isAvailable.mockReturnValue(true);
      mockElasticsearchService.getSuggestions.mockResolvedValue(['建议1', '建议2']);

      const suggestions = await searchService.getSuggestions('测试');

      expect(suggestions).toEqual(['建议1', '建议2']);
      expect(mockElasticsearchService.getSuggestions).toHaveBeenCalledWith('测试', 5);
    });

    it('当Elasticsearch不可用时应返回空数组', async () => {
      mockElasticsearchService.isAvailable.mockReturnValue(false);

      const suggestions = await searchService.getSuggestions('测试');

      expect(suggestions).toEqual([]);
    });

    it('当获取建议失败时应返回空数组', async () => {
      mockElasticsearchService.isAvailable.mockReturnValue(true);
      mockElasticsearchService.getSuggestions.mockRejectedValue(new Error('获取失败'));

      const suggestions = await searchService.getSuggestions('测试');

      expect(suggestions).toEqual([]);
    });
  });

  describe('indexDocument', () => {
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

    it('当Elasticsearch可用时应索引文档', async () => {
      mockElasticsearchService.isAvailable.mockReturnValue(true);
      mockElasticsearchService.indexDocument.mockResolvedValue(true);

      const result = await searchService.indexDocument(mockDocument);

      expect(result).toBe(true);
      expect(mockElasticsearchService.indexDocument).toHaveBeenCalledWith(mockDocument);
    });

    it('当Elasticsearch不可用时应返回true', async () => {
      mockElasticsearchService.isAvailable.mockReturnValue(false);

      const result = await searchService.indexDocument(mockDocument);

      expect(result).toBe(true);
      expect(mockElasticsearchService.indexDocument).not.toHaveBeenCalled();
    });
  });

  describe('deleteDocumentIndex', () => {
    it('当Elasticsearch可用时应删除文档索引', async () => {
      mockElasticsearchService.isAvailable.mockReturnValue(true);
      mockElasticsearchService.deleteDocument.mockResolvedValue(true);

      const result = await searchService.deleteDocumentIndex(1);

      expect(result).toBe(true);
      expect(mockElasticsearchService.deleteDocument).toHaveBeenCalledWith(1);
    });

    it('当Elasticsearch不可用时应返回true', async () => {
      mockElasticsearchService.isAvailable.mockReturnValue(false);

      const result = await searchService.deleteDocumentIndex(1);

      expect(result).toBe(true);
      expect(mockElasticsearchService.deleteDocument).not.toHaveBeenCalled();
    });
  });

  describe('reindexAllDocuments', () => {
    const mockDocuments = [
      new Document({
        id: 1,
        title: '文档1',
        slug: 'doc1',
        content: '内容1',
        content_type: DocumentContentType.MARKDOWN,
        status: DocumentStatus.PUBLISHED,
        directory_id: 1,
        author_id: 1,
        created_at: new Date(),
        updated_at: new Date()
      })
    ];

    it('当Elasticsearch可用时应重建索引', async () => {
      mockElasticsearchService.isAvailable.mockReturnValue(true);
      mockDocumentRepository.findAll.mockResolvedValue({
        documents: mockDocuments,
        total: 1
      });
      mockElasticsearchService.reindexAllDocuments.mockResolvedValue(true);

      const result = await searchService.reindexAllDocuments();

      expect(result).toBe(true);
      expect(mockDocumentRepository.findAll).toHaveBeenCalledWith({
        status: 'published',
        limit: 10000
      });
      expect(mockElasticsearchService.reindexAllDocuments).toHaveBeenCalledWith(mockDocuments);
    });

    it('当Elasticsearch不可用时应返回true', async () => {
      mockElasticsearchService.isAvailable.mockReturnValue(false);

      const result = await searchService.reindexAllDocuments();

      expect(result).toBe(true);
      expect(mockElasticsearchService.reindexAllDocuments).not.toHaveBeenCalled();
    });

    it('当获取文档失败时应返回false', async () => {
      mockElasticsearchService.isAvailable.mockReturnValue(true);
      mockDocumentRepository.findAll.mockRejectedValue(new Error('获取失败'));

      const result = await searchService.reindexAllDocuments();

      expect(result).toBe(false);
    });
  });

  describe('getSearchServiceStatus', () => {
    it('当Elasticsearch可用时应返回正确状态', () => {
      mockElasticsearchService.isAvailable.mockReturnValue(true);

      const status = searchService.getSearchServiceStatus();

      expect(status).toEqual({
        elasticsearch: true,
        mysql: true,
        activeService: 'elasticsearch'
      });
    });

    it('当Elasticsearch不可用时应返回MySQL状态', () => {
      mockElasticsearchService.isAvailable.mockReturnValue(false);

      const status = searchService.getSearchServiceStatus();

      expect(status).toEqual({
        elasticsearch: false,
        mysql: true,
        activeService: 'mysql'
      });
    });
  });

  describe('getIndexStats', () => {
    it('当Elasticsearch可用时应返回索引统计', async () => {
      const mockStats = { docs: { count: 100 } };
      mockElasticsearchService.isAvailable.mockReturnValue(true);
      mockElasticsearchService.getIndexStats.mockResolvedValue(mockStats);

      const stats = await searchService.getIndexStats();

      expect(stats).toEqual(mockStats);
      expect(mockElasticsearchService.getIndexStats).toHaveBeenCalled();
    });

    it('当Elasticsearch不可用时应返回null', async () => {
      mockElasticsearchService.isAvailable.mockReturnValue(false);

      const stats = await searchService.getIndexStats();

      expect(stats).toBeNull();
      expect(mockElasticsearchService.getIndexStats).not.toHaveBeenCalled();
    });
  });
});