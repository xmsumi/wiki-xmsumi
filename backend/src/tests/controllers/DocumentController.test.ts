import request from 'supertest';
import express from 'express';
import { DocumentController } from '@/controllers/DocumentController';
import { DocumentRepository } from '@/repositories/DocumentRepository';
import { UserRepository } from '@/repositories/UserRepository';
import { Document } from '@/models/Document';
import { DocumentVersion } from '@/models/DocumentVersion';
import { User } from '@/models/User';
import { DocumentStatus, DocumentContentType } from '@/types/document';
import { UserRole } from '@/types/user';

// Mock依赖
jest.mock('@/repositories/DocumentRepository');
jest.mock('@/repositories/UserRepository');
jest.mock('@/utils/logger');

const MockDocumentRepository = DocumentRepository as jest.MockedClass<typeof DocumentRepository>;
const MockUserRepository = UserRepository as jest.MockedClass<typeof UserRepository>;

const app = express();
app.use(express.json());

// 模拟认证中间件
app.use((req: any, res, next) => {
  req.user = { userId: 1, username: 'testuser', role: UserRole.EDITOR };
  next();
});

const documentController = new DocumentController();

// 设置路由
app.get('/documents', documentController.getDocuments.bind(documentController));
app.get('/documents/search', documentController.searchDocuments.bind(documentController));
app.get('/documents/stats', documentController.getDocumentStats.bind(documentController));
app.get('/documents/tags/popular', documentController.getPopularTags.bind(documentController));
app.get('/documents/:id', documentController.getDocument.bind(documentController));
app.get('/documents/:id/versions', documentController.getDocumentVersions.bind(documentController));
app.get('/documents/:id/versions/:version', documentController.getDocumentVersion.bind(documentController));
app.post('/documents', documentController.createDocument.bind(documentController));
app.put('/documents/:id', documentController.updateDocument.bind(documentController));
app.delete('/documents/:id', documentController.deleteDocument.bind(documentController));

describe('DocumentController', () => {
  let mockDocumentRepo: jest.Mocked<DocumentRepository>;
  let mockUserRepo: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockDocumentRepo = new MockDocumentRepository() as jest.Mocked<DocumentRepository>;
    mockUserRepo = new MockUserRepository() as jest.Mocked<UserRepository>;
    
    // 替换控制器中的仓库实例
    (documentController as any).documentRepository = mockDocumentRepo;
    (documentController as any).userRepository = mockUserRepo;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /documents', () => {
    it('应该返回文档列表', async () => {
      const mockDocuments = [
        new Document({
          id: 1,
          title: '文档1',
          slug: 'document-1',
          content: '内容1',
          content_type: DocumentContentType.MARKDOWN,
          directory_id: 1,
          author_id: 1,
          status: DocumentStatus.PUBLISHED,
          tags: '["测试"]',
          meta_data: '{}',
          created_at: new Date(),
          updated_at: new Date()
        })
      ];

      const mockUser = new User({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash',
        role: UserRole.EDITOR,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });

      mockDocumentRepo.findAll.mockResolvedValueOnce({
        documents: mockDocuments,
        total: 1
      });
      mockUserRepo.findById.mockResolvedValueOnce(mockUser);

      const response = await request(app)
        .get('/documents')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.documents).toHaveLength(1);
      expect(response.body.data.pagination.total).toBe(1);
      expect(mockDocumentRepo.findAll).toHaveBeenCalled();
    });

    it('应该处理查询参数', async () => {
      mockDocumentRepo.findAll.mockResolvedValueOnce({
        documents: [],
        total: 0
      });

      await request(app)
        .get('/documents')
        .query({
          page: '2',
          limit: '5',
          title: '测试',
          status: DocumentStatus.PUBLISHED
        })
        .expect(200);

      expect(mockDocumentRepo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 5,
          offset: 5,
          title: '测试',
          status: DocumentStatus.PUBLISHED
        })
      );
    });
  });

  describe('GET /documents/:id', () => {
    it('应该返回单个文档', async () => {
      const mockDocument = new Document({
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
      });

      const mockUser = new User({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash',
        role: UserRole.EDITOR,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });

      mockDocumentRepo.findById.mockResolvedValueOnce(mockDocument);
      mockUserRepo.findById.mockResolvedValueOnce(mockUser);
      mockDocumentRepo.getLatestVersionNumber.mockResolvedValueOnce(2);

      const response = await request(app)
        .get('/documents/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.document.id).toBe(1);
      expect(response.body.data.document.author_username).toBe('testuser');
      expect(response.body.data.document.version_number).toBe(2);
    });

    it('应该在文档不存在时返回404', async () => {
      mockDocumentRepo.findById.mockResolvedValueOnce(null);

      const response = await request(app)
        .get('/documents/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('DOCUMENT_NOT_FOUND');
    });
  });

  describe('POST /documents', () => {
    it('应该成功创建文档', async () => {
      const createData = {
        title: '新文档',
        content: '新文档内容',
        content_type: DocumentContentType.MARKDOWN,
        status: DocumentStatus.DRAFT
      };

      const mockDocument = new Document({
        id: 1,
        title: '新文档',
        slug: 'new-document',
        content: '新文档内容',
        content_type: DocumentContentType.MARKDOWN,
        directory_id: undefined,
        author_id: 1,
        status: DocumentStatus.DRAFT,
        tags: '[]',
        meta_data: '{}',
        created_at: new Date(),
        updated_at: new Date()
      });

      const mockUser = new User({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash',
        role: UserRole.EDITOR,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });

      mockDocumentRepo.create.mockResolvedValueOnce(mockDocument);
      mockUserRepo.findById.mockResolvedValueOnce(mockUser);

      const response = await request(app)
        .post('/documents')
        .send(createData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.document.title).toBe('新文档');
      expect(mockDocumentRepo.create).toHaveBeenCalledWith(createData, 1);
    });
  });

  describe('PUT /documents/:id', () => {
    it('应该成功更新文档', async () => {
      const updateData = {
        title: '更新后的标题',
        content: '更新后的内容'
      };

      const mockExistingDocument = new Document({
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

      const mockUpdatedDocument = new Document({
        ...mockExistingDocument,
        title: '更新后的标题',
        content: '更新后的内容'
      });

      const mockUser = new User({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash',
        role: UserRole.EDITOR,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });

      mockDocumentRepo.findById.mockResolvedValueOnce(mockExistingDocument);
      mockUserRepo.findById.mockResolvedValueOnce(mockUser);
      mockDocumentRepo.update.mockResolvedValueOnce(mockUpdatedDocument);
      mockDocumentRepo.getLatestVersionNumber.mockResolvedValueOnce(2);

      const response = await request(app)
        .put('/documents/1')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.document.title).toBe('更新后的标题');
      expect(mockDocumentRepo.update).toHaveBeenCalledWith(1, updateData, 1);
    });

    it('应该在没有权限时返回403', async () => {
      const mockDocument = new Document({
        id: 1,
        title: '他人文档',
        slug: 'others-document',
        content: '内容',
        content_type: DocumentContentType.MARKDOWN,
        directory_id: 1,
        author_id: 2, // 不同的作者ID
        status: DocumentStatus.DRAFT,
        tags: '[]',
        meta_data: '{}',
        created_at: new Date(),
        updated_at: new Date()
      });

      const mockUser = new User({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash',
        role: UserRole.VIEWER, // 非管理员
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });

      mockDocumentRepo.findById.mockResolvedValueOnce(mockDocument);
      mockUserRepo.findById.mockResolvedValueOnce(mockUser);

      const response = await request(app)
        .put('/documents/1')
        .send({ title: '尝试更新' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PERMISSION_DENIED');
    });
  });

  describe('DELETE /documents/:id', () => {
    it('应该成功删除文档', async () => {
      const mockDocument = new Document({
        id: 1,
        title: '要删除的文档',
        slug: 'document-to-delete',
        content: '内容',
        content_type: DocumentContentType.MARKDOWN,
        directory_id: 1,
        author_id: 1,
        status: DocumentStatus.DRAFT,
        tags: '[]',
        meta_data: '{}',
        created_at: new Date(),
        updated_at: new Date()
      });

      const mockUser = new User({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash',
        role: UserRole.EDITOR,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });

      mockDocumentRepo.findById.mockResolvedValueOnce(mockDocument);
      mockUserRepo.findById.mockResolvedValueOnce(mockUser);
      mockDocumentRepo.delete.mockResolvedValueOnce(true);

      const response = await request(app)
        .delete('/documents/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('文档删除成功');
      expect(mockDocumentRepo.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('GET /documents/:id/versions', () => {
    it('应该返回文档版本历史', async () => {
      const mockDocument = new Document({
        id: 1,
        title: '测试文档',
        slug: 'test-document',
        content: '内容',
        content_type: DocumentContentType.MARKDOWN,
        directory_id: 1,
        author_id: 1,
        status: DocumentStatus.PUBLISHED,
        tags: '[]',
        meta_data: '{}',
        created_at: new Date(),
        updated_at: new Date()
      });

      const mockVersions = [
        new DocumentVersion({
          id: 1,
          document_id: 1,
          version_number: 1,
          title: '版本1',
          content: '版本1内容',
          author_id: 1,
          change_summary: '初始版本',
          created_at: new Date()
        })
      ];

      const mockUser = new User({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash',
        role: UserRole.EDITOR,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });

      mockDocumentRepo.findById.mockResolvedValueOnce(mockDocument);
      mockDocumentRepo.getVersions.mockResolvedValueOnce({
        versions: mockVersions,
        total: 1
      });
      mockUserRepo.findById.mockResolvedValueOnce(mockUser);

      const response = await request(app)
        .get('/documents/1/versions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.versions).toHaveLength(1);
      expect(response.body.data.pagination.total).toBe(1);
    });
  });

  describe('GET /documents/search', () => {
    it('应该搜索文档', async () => {
      const mockDocuments = [
        new Document({
          id: 1,
          title: '搜索结果',
          slug: 'search-result',
          content: '包含关键词的内容',
          content_type: DocumentContentType.MARKDOWN,
          directory_id: 1,
          author_id: 1,
          status: DocumentStatus.PUBLISHED,
          tags: '[]',
          meta_data: '{}',
          created_at: new Date(),
          updated_at: new Date()
        })
      ];

      const mockUser = new User({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash',
        role: UserRole.EDITOR,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });

      mockDocumentRepo.search.mockResolvedValueOnce({
        documents: mockDocuments,
        total: 1
      });
      mockUserRepo.findById.mockResolvedValueOnce(mockUser);

      const response = await request(app)
        .get('/documents/search')
        .query({ q: '关键词' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.documents).toHaveLength(1);
      expect(response.body.data.query).toBe('关键词');
      expect(mockDocumentRepo.search).toHaveBeenCalledWith('关键词', expect.any(Object));
    });

    it('应该在缺少搜索关键词时返回400', async () => {
      const response = await request(app)
        .get('/documents/search')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /documents/stats', () => {
    it('应该返回文档统计信息', async () => {
      const mockStats = {
        total_documents: 10,
        published_documents: 7,
        draft_documents: 2,
        archived_documents: 1,
        total_versions: 25
      };

      mockDocumentRepo.getStats.mockResolvedValueOnce(mockStats);

      const response = await request(app)
        .get('/documents/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toEqual(mockStats);
    });
  });

  describe('GET /documents/tags/popular', () => {
    it('应该返回热门标签', async () => {
      const mockTags = [
        { tag: '测试', count: 5 },
        { tag: '文档', count: 3 }
      ];

      mockDocumentRepo.getPopularTags.mockResolvedValueOnce(mockTags);

      const response = await request(app)
        .get('/documents/tags/popular')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tags).toEqual(mockTags);
      expect(mockDocumentRepo.getPopularTags).toHaveBeenCalledWith(10);
    });
  });
});