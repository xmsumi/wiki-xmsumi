import { DocumentRepository } from '@/repositories/DocumentRepository';
import { Document } from '@/models/Document';
import { DocumentVersion } from '@/models/DocumentVersion';
import { DocumentStatus, DocumentContentType } from '@/types/document';
import { db } from '@/config/database';

// Mock数据库连接
jest.mock('@/config/database');
jest.mock('@/utils/logger');

const mockDb = db as jest.Mocked<typeof db>;

describe('DocumentRepository', () => {
  let repository: DocumentRepository;
  let mockConnection: any;

  beforeEach(() => {
    repository = new DocumentRepository();
    
    // Mock连接对象
    mockConnection = {
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
      execute: jest.fn()
    };

    // Mock连接池
    const mockPool = {
      getConnection: jest.fn().mockResolvedValue(mockConnection)
    };

    mockDb.getPool = jest.fn().mockReturnValue(mockPool);
    mockDb.query = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createRequest = {
      title: '测试文档',
      content: '测试内容',
      content_type: DocumentContentType.MARKDOWN,
      directory_id: 1,
      status: DocumentStatus.DRAFT,
      tags: ['测试'],
      meta_data: { description: '测试描述' }
    };

    it('应该成功创建文档和初始版本', async () => {
      // Mock slug检查
      mockDb.query.mockResolvedValueOnce([]); // slug不存在
      
      // Mock文档插入
      mockConnection.execute
        .mockResolvedValueOnce([{ insertId: 1 }]) // 文档插入
        .mockResolvedValueOnce([{ insertId: 1 }]); // 版本插入

      // Mock查找创建的文档
      const mockDocumentEntity = {
        id: 1,
        title: '测试文档',
        slug: '测试文档',
        content: '测试内容',
        content_type: DocumentContentType.MARKDOWN,
        directory_id: 1,
        author_id: 1,
        status: DocumentStatus.DRAFT,
        tags: '["测试"]',
        meta_data: '{"description":"测试描述"}',
        created_at: new Date(),
        updated_at: new Date()
      };
      
      mockDb.query.mockResolvedValueOnce([mockDocumentEntity]);

      const result = await repository.create(createRequest, 1);

      expect(result).toBeInstanceOf(Document);
      expect(result.title).toBe('测试文档');
      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it('应该在失败时回滚事务', async () => {
      mockConnection.execute.mockRejectedValueOnce(new Error('数据库错误'));

      await expect(repository.create(createRequest, 1)).rejects.toThrow('数据库错误');

      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('应该根据ID找到文档', async () => {
      const mockDocumentEntity = {
        id: 1,
        title: '测试文档',
        slug: 'test-document',
        content: '测试内容',
        content_type: DocumentContentType.MARKDOWN,
        directory_id: 1,
        author_id: 1,
        status: DocumentStatus.PUBLISHED,
        tags: '[]',
        meta_data: '{}',
        created_at: new Date(),
        updated_at: new Date()
      };

      mockDb.query.mockResolvedValueOnce([mockDocumentEntity]);

      const result = await repository.findById(1);

      expect(result).toBeInstanceOf(Document);
      expect(result?.id).toBe(1);
      expect(result?.title).toBe('测试文档');
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM documents WHERE id = ?',
        [1]
      );
    });

    it('应该在文档不存在时返回null', async () => {
      mockDb.query.mockResolvedValueOnce([]);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });

    it('应该处理数据库错误', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('数据库连接失败'));

      await expect(repository.findById(1)).rejects.toThrow('数据库连接失败');
    });
  });

  describe('findBySlug', () => {
    it('应该根据slug找到文档', async () => {
      const mockDocumentEntity = {
        id: 1,
        title: '测试文档',
        slug: 'test-document',
        content: '测试内容',
        content_type: DocumentContentType.MARKDOWN,
        directory_id: 1,
        author_id: 1,
        status: DocumentStatus.PUBLISHED,
        tags: '[]',
        meta_data: '{}',
        created_at: new Date(),
        updated_at: new Date()
      };

      mockDb.query.mockResolvedValueOnce([mockDocumentEntity]);

      const result = await repository.findBySlug('test-document');

      expect(result).toBeInstanceOf(Document);
      expect(result?.slug).toBe('test-document');
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM documents WHERE slug = ?',
        ['test-document']
      );
    });

    it('应该在slug不存在时返回null', async () => {
      mockDb.query.mockResolvedValueOnce([]);

      const result = await repository.findBySlug('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('应该返回文档列表和总数', async () => {
      const mockDocuments = [
        {
          id: 1,
          title: '文档1',
          slug: 'document-1',
          content: '内容1',
          content_type: DocumentContentType.MARKDOWN,
          directory_id: 1,
          author_id: 1,
          status: DocumentStatus.PUBLISHED,
          tags: '[]',
          meta_data: '{}',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          title: '文档2',
          slug: 'document-2',
          content: '内容2',
          content_type: DocumentContentType.MARKDOWN,
          directory_id: 1,
          author_id: 1,
          status: DocumentStatus.DRAFT,
          tags: '[]',
          meta_data: '{}',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      mockDb.query
        .mockResolvedValueOnce([{ total: 2 }]) // 总数查询
        .mockResolvedValueOnce(mockDocuments); // 数据查询

      const result = await repository.findAll({ limit: 10, offset: 0 });

      expect(result.total).toBe(2);
      expect(result.documents).toHaveLength(2);
      expect(result.documents[0]).toBeInstanceOf(Document);
      expect(result.documents[1]).toBeInstanceOf(Document);
    });

    it('应该支持搜索过滤', async () => {
      mockDb.query
        .mockResolvedValueOnce([{ total: 1 }])
        .mockResolvedValueOnce([]);

      await repository.findAll({ search: '测试关键词' });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('(title LIKE ? OR content LIKE ?)'),
        expect.arrayContaining(['%测试关键词%', '%测试关键词%', 10, 0])
      );
    });

    it('应该支持状态过滤', async () => {
      mockDb.query
        .mockResolvedValueOnce([{ total: 0 }])
        .mockResolvedValueOnce([]);

      await repository.findAll({ status: DocumentStatus.PUBLISHED });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('status = ?'),
        expect.arrayContaining([DocumentStatus.PUBLISHED, 10, 0])
      );
    });
  });

  describe('update', () => {
    const updateRequest = {
      title: '更新后的标题',
      content: '更新后的内容',
      status: DocumentStatus.PUBLISHED
    };

    it('应该成功更新文档并创建新版本', async () => {
      const mockCurrentDocument = new Document({
        id: 1,
        title: '原标题',
        slug: 'original-title',
        content: '原内容',
        content_type: DocumentContentType.MARKDOWN,
        directory_id: 1,
        author_id: 1,
        status: DocumentStatus.DRAFT,
        tags: '[]',
        meta_data: '{}',
        created_at: new Date(),
        updated_at: new Date()
      });

      // Mock查找当前文档
      mockDb.query.mockResolvedValueOnce([mockCurrentDocument]);
      
      // Mock更新操作
      mockConnection.execute
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // 文档更新
        .mockResolvedValueOnce([{ max_version: 1 }]) // 获取最新版本号
        .mockResolvedValueOnce([{ insertId: 2 }]); // 插入新版本

      // Mock查找更新后的文档
      const updatedDocument = {
        ...mockCurrentDocument,
        title: '更新后的标题',
        content: '更新后的内容',
        status: DocumentStatus.PUBLISHED
      };
      mockDb.query.mockResolvedValueOnce([updatedDocument]);

      const result = await repository.update(1, updateRequest, 1);

      expect(result).toBeInstanceOf(Document);
      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.commit).toHaveBeenCalled();
    });

    it('应该在文档不存在时返回null', async () => {
      mockDb.query.mockResolvedValueOnce([]); // 文档不存在

      const result = await repository.update(999, updateRequest, 1);

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('应该软删除文档', async () => {
      mockDb.query.mockResolvedValueOnce({ affectedRows: 1 });

      const result = await repository.delete(1);

      expect(result).toBe(true);
      expect(mockDb.query).toHaveBeenCalledWith(
        'UPDATE documents SET status = ?, updated_at = ? WHERE id = ?',
        [DocumentStatus.ARCHIVED, expect.any(Date), 1]
      );
    });

    it('应该在文档不存在时返回false', async () => {
      mockDb.query.mockResolvedValueOnce({ affectedRows: 0 });

      const result = await repository.delete(999);

      expect(result).toBe(false);
    });
  });

  describe('getVersions', () => {
    it('应该返回文档版本历史', async () => {
      const mockVersions = [
        {
          id: 2,
          document_id: 1,
          version_number: 2,
          title: '版本2',
          content: '版本2内容',
          author_id: 1,
          change_summary: '更新内容',
          created_at: new Date()
        },
        {
          id: 1,
          document_id: 1,
          version_number: 1,
          title: '版本1',
          content: '版本1内容',
          author_id: 1,
          change_summary: '初始版本',
          created_at: new Date()
        }
      ];

      mockDb.query
        .mockResolvedValueOnce([{ total: 2 }])
        .mockResolvedValueOnce(mockVersions);

      const result = await repository.getVersions(1);

      expect(result.total).toBe(2);
      expect(result.versions).toHaveLength(2);
      expect(result.versions[0]).toBeInstanceOf(DocumentVersion);
      expect(result.versions[0].version_number).toBe(2);
    });
  });

  describe('getVersionByNumber', () => {
    it('应该根据版本号获取文档版本', async () => {
      const mockVersion = {
        id: 1,
        document_id: 1,
        version_number: 1,
        title: '版本1',
        content: '版本1内容',
        author_id: 1,
        change_summary: '初始版本',
        created_at: new Date()
      };

      mockDb.query.mockResolvedValueOnce([mockVersion]);

      const result = await repository.getVersionByNumber(1, 1);

      expect(result).toBeInstanceOf(DocumentVersion);
      expect(result?.version_number).toBe(1);
    });

    it('应该在版本不存在时返回null', async () => {
      mockDb.query.mockResolvedValueOnce([]);

      const result = await repository.getVersionByNumber(1, 999);

      expect(result).toBeNull();
    });
  });

  describe('existsBySlug', () => {
    it('应该检查slug是否存在', async () => {
      mockDb.query.mockResolvedValueOnce([{ count: 1 }]);

      const result = await repository.existsBySlug('existing-slug');

      expect(result).toBe(true);
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM documents WHERE slug = ?',
        ['existing-slug']
      );
    });

    it('应该排除指定ID', async () => {
      mockDb.query.mockResolvedValueOnce([{ count: 0 }]);

      const result = await repository.existsBySlug('existing-slug', 1);

      expect(result).toBe(false);
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM documents WHERE slug = ? AND id != ?',
        ['existing-slug', 1]
      );
    });
  });

  describe('getStats', () => {
    it('应该返回文档统计信息', async () => {
      mockDb.query
        .mockResolvedValueOnce([{ count: 10 }]) // 总文档数
        .mockResolvedValueOnce([{ count: 7 }])  // 已发布文档数
        .mockResolvedValueOnce([{ count: 2 }])  // 草稿文档数
        .mockResolvedValueOnce([{ count: 1 }])  // 归档文档数
        .mockResolvedValueOnce([{ count: 25 }]); // 总版本数

      const stats = await repository.getStats();

      expect(stats).toEqual({
        total_documents: 10,
        published_documents: 7,
        draft_documents: 2,
        archived_documents: 1,
        total_versions: 25
      });
    });
  });
});