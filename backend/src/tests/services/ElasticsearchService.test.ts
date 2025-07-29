import { ElasticsearchService } from '@/services/ElasticsearchService';
import { ElasticsearchConfig } from '@/config/elasticsearch';
import { Document } from '@/models/Document';
import { DocumentContentType, DocumentStatus } from '@/types/document';

// Mock Elasticsearch客户端
jest.mock('@/config/elasticsearch');

describe('ElasticsearchService', () => {
  let elasticsearchService: ElasticsearchService;
  let mockClient: any;

  beforeEach(() => {
    // 创建模拟的Elasticsearch客户端
    mockClient = {
      indices: {
        exists: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        stats: jest.fn()
      },
      index: jest.fn(),
      bulk: jest.fn(),
      delete: jest.fn(),
      search: jest.fn()
    };

    // Mock ElasticsearchConfig.getClient
    (ElasticsearchConfig.getClient as jest.Mock).mockReturnValue(mockClient);

    elasticsearchService = new ElasticsearchService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isAvailable', () => {
    it('当Elasticsearch客户端存在时应返回true', () => {
      expect(elasticsearchService.isAvailable()).toBe(true);
    });

    it('当Elasticsearch客户端不存在时应返回false', () => {
      (ElasticsearchConfig.getClient as jest.Mock).mockReturnValue(null);
      elasticsearchService = new ElasticsearchService();
      expect(elasticsearchService.isAvailable()).toBe(false);
    });
  });

  describe('initializeIndex', () => {
    it('应该成功创建新索引', async () => {
      mockClient.indices.exists.mockResolvedValue(false);
      mockClient.indices.create.mockResolvedValue({ acknowledged: true });

      const result = await elasticsearchService.initializeIndex();

      expect(result).toBe(true);
      expect(mockClient.indices.exists).toHaveBeenCalled();
      expect(mockClient.indices.create).toHaveBeenCalled();
    });

    it('当索引已存在时应跳过创建', async () => {
      mockClient.indices.exists.mockResolvedValue(true);

      const result = await elasticsearchService.initializeIndex();

      expect(result).toBe(true);
      expect(mockClient.indices.exists).toHaveBeenCalled();
      expect(mockClient.indices.create).not.toHaveBeenCalled();
    });

    it('当Elasticsearch不可用时应返回false', async () => {
      (ElasticsearchConfig.getClient as jest.Mock).mockReturnValue(null);
      elasticsearchService = new ElasticsearchService();

      const result = await elasticsearchService.initializeIndex();

      expect(result).toBe(false);
    });

    it('当创建索引失败时应返回false', async () => {
      mockClient.indices.exists.mockResolvedValue(false);
      mockClient.indices.create.mockRejectedValue(new Error('创建失败'));

      const result = await elasticsearchService.initializeIndex();

      expect(result).toBe(false);
    });
  });

  describe('indexDocument', () => {
    const mockDocument = new Document({
      id: 1,
      title: '测试文档',
      slug: 'test-document',
      content: '这是测试内容',
      content_type: DocumentContentType.MARKDOWN,
      status: DocumentStatus.PUBLISHED,
      directory_id: 1,
      author_id: 1,
      tags: JSON.stringify(['测试', '文档']),
      created_at: new Date(),
      updated_at: new Date()
    });

    it('应该成功索引文档', async () => {
      mockClient.index.mockResolvedValue({ _id: '1' });

      const result = await elasticsearchService.indexDocument(mockDocument);

      expect(result).toBe(true);
      expect(mockClient.index).toHaveBeenCalledWith({
        index: 'wiki_documents',
        id: '1',
        body: expect.objectContaining({
          id: 1,
          title: '测试文档',
          content: '这是测试内容'
        })
      });
    });

    it('当Elasticsearch不可用时应返回false', async () => {
      (ElasticsearchConfig.getClient as jest.Mock).mockReturnValue(null);
      elasticsearchService = new ElasticsearchService();

      const result = await elasticsearchService.indexDocument(mockDocument);

      expect(result).toBe(false);
    });

    it('当索引失败时应返回false', async () => {
      mockClient.index.mockRejectedValue(new Error('索引失败'));

      const result = await elasticsearchService.indexDocument(mockDocument);

      expect(result).toBe(false);
    });
  });

  describe('searchDocuments', () => {
    it('应该成功搜索文档', async () => {
      const mockSearchResponse = {
        hits: {
          hits: [
            {
              _source: {
                id: 1,
                title: '测试文档',
                content: '测试内容'
              },
              _score: 1.5,
              highlight: {
                title: ['<mark>测试</mark>文档']
              }
            }
          ],
          total: { value: 1 }
        },
        took: 10
      };

      mockClient.search.mockResolvedValue(mockSearchResponse);

      const result = await elasticsearchService.searchDocuments('测试');

      expect(result.documents).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.took).toBe(10);
      expect(result.highlights).toBeDefined();
      expect(mockClient.search).toHaveBeenCalled();
    });

    it('当Elasticsearch不可用时应抛出错误', async () => {
      (ElasticsearchConfig.getClient as jest.Mock).mockReturnValue(null);
      elasticsearchService = new ElasticsearchService();

      await expect(elasticsearchService.searchDocuments('测试'))
        .rejects.toThrow('Elasticsearch客户端不可用');
    });

    it('应该正确处理搜索选项', async () => {
      const mockSearchResponse = {
        hits: { hits: [], total: { value: 0 } },
        took: 5
      };

      mockClient.search.mockResolvedValue(mockSearchResponse);

      await elasticsearchService.searchDocuments('测试', {
        limit: 5,
        offset: 10,
        directory_id: 1,
        status: 'published',
        content_type: 'markdown',
        tags: ['标签1', '标签2']
      });

      const searchCall = mockClient.search.mock.calls[0][0];
      expect(searchCall.body.size).toBe(5);
      expect(searchCall.body.from).toBe(10);
      expect(searchCall.body.query.bool.filter).toContainEqual({ term: { directory_id: 1 } });
      expect(searchCall.body.query.bool.filter).toContainEqual({ term: { status: 'published' } });
      expect(searchCall.body.query.bool.filter).toContainEqual({ term: { content_type: 'markdown' } });
      expect(searchCall.body.query.bool.filter).toContainEqual({ terms: { tags: ['标签1', '标签2'] } });
    });
  });

  describe('deleteDocument', () => {
    it('应该成功删除文档索引', async () => {
      mockClient.delete.mockResolvedValue({ _id: '1' });

      const result = await elasticsearchService.deleteDocument(1);

      expect(result).toBe(true);
      expect(mockClient.delete).toHaveBeenCalledWith({
        index: 'wiki_documents',
        id: '1'
      });
    });

    it('当文档不存在时应返回true', async () => {
      const error = new Error('Not Found');
      (error as any).meta = { statusCode: 404 };
      mockClient.delete.mockRejectedValue(error);

      const result = await elasticsearchService.deleteDocument(1);

      expect(result).toBe(true);
    });

    it('当Elasticsearch不可用时应返回false', async () => {
      (ElasticsearchConfig.getClient as jest.Mock).mockReturnValue(null);
      elasticsearchService = new ElasticsearchService();

      const result = await elasticsearchService.deleteDocument(1);

      expect(result).toBe(false);
    });
  });

  describe('bulkIndexDocuments', () => {
    it('应该成功批量索引文档', async () => {
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
        }),
        new Document({
          id: 2,
          title: '文档2',
          slug: 'doc2',
          content: '内容2',
          content_type: DocumentContentType.MARKDOWN,
          status: DocumentStatus.PUBLISHED,
          directory_id: 1,
          author_id: 1,
          created_at: new Date(),
          updated_at: new Date()
        })
      ];

      mockClient.bulk.mockResolvedValue({ errors: false });

      const result = await elasticsearchService.bulkIndexDocuments(mockDocuments);

      expect(result).toBe(true);
      expect(mockClient.bulk).toHaveBeenCalled();
    });

    it('当批量操作有错误时应返回false', async () => {
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

      mockClient.bulk.mockResolvedValue({ errors: true, items: [] });

      const result = await elasticsearchService.bulkIndexDocuments(mockDocuments);

      expect(result).toBe(false);
    });

    it('当文档数组为空时应返回false', async () => {
      const result = await elasticsearchService.bulkIndexDocuments([]);

      expect(result).toBe(false);
      expect(mockClient.bulk).not.toHaveBeenCalled();
    });
  });

  describe('getSuggestions', () => {
    it('应该返回搜索建议', async () => {
      const mockSuggestResponse = {
        suggest: {
          title_suggest: [
            {
              options: [
                { text: '测试文档' },
                { text: '测试指南' }
              ]
            }
          ]
        }
      };

      mockClient.search.mockResolvedValue(mockSuggestResponse);

      const suggestions = await elasticsearchService.getSuggestions('测试');

      expect(suggestions).toEqual(['测试文档', '测试指南']);
      expect(mockClient.search).toHaveBeenCalled();
    });

    it('当Elasticsearch不可用时应返回空数组', async () => {
      (ElasticsearchConfig.getClient as jest.Mock).mockReturnValue(null);
      elasticsearchService = new ElasticsearchService();

      const suggestions = await elasticsearchService.getSuggestions('测试');

      expect(suggestions).toEqual([]);
    });

    it('当获取建议失败时应返回空数组', async () => {
      mockClient.search.mockRejectedValue(new Error('搜索失败'));

      const suggestions = await elasticsearchService.getSuggestions('测试');

      expect(suggestions).toEqual([]);
    });
  });
});