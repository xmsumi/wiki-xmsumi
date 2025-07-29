import { Document } from '@/models/Document';
import { DocumentEntity, DocumentStatus, DocumentContentType } from '@/types/document';

describe('Document Model', () => {
  const mockDocumentEntity: DocumentEntity = {
    id: 1,
    title: '测试文档',
    slug: 'test-document',
    content: '# 测试标题\n\n这是测试内容。',
    content_type: DocumentContentType.MARKDOWN,
    directory_id: 1,
    author_id: 1,
    status: DocumentStatus.PUBLISHED,
    tags: '["测试", "文档"]',
    meta_data: '{"description": "测试描述"}',
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z')
  };

  describe('constructor', () => {
    it('应该正确创建Document实例', () => {
      const document = new Document(mockDocumentEntity);

      expect(document.id).toBe(1);
      expect(document.title).toBe('测试文档');
      expect(document.slug).toBe('test-document');
      expect(document.content).toBe('# 测试标题\n\n这是测试内容。');
      expect(document.content_type).toBe(DocumentContentType.MARKDOWN);
      expect(document.directory_id).toBe(1);
      expect(document.author_id).toBe(1);
      expect(document.status).toBe(DocumentStatus.PUBLISHED);
      expect(document.tags).toEqual(['测试', '文档']);
      expect(document.meta_data).toEqual({ description: '测试描述' });
    });

    it('应该正确解析空的tags和meta_data', () => {
      const entityWithEmptyData = {
        ...mockDocumentEntity,
        tags: undefined,
        meta_data: undefined
      };

      const document = new Document(entityWithEmptyData);

      expect(document.tags).toEqual([]);
      expect(document.meta_data).toEqual({});
    });

    it('应该处理无效的JSON数据', () => {
      const entityWithInvalidJson = {
        ...mockDocumentEntity,
        tags: 'invalid json',
        meta_data: 'invalid json'
      };

      const document = new Document(entityWithInvalidJson);

      expect(document.tags).toEqual([]);
      expect(document.meta_data).toEqual({});
    });
  });

  describe('fromCreateRequest', () => {
    it('应该从创建请求生成正确的实体数据', () => {
      const createRequest = {
        title: '新文档',
        content: '新文档内容',
        content_type: DocumentContentType.MARKDOWN,
        directory_id: 2,
        status: DocumentStatus.DRAFT,
        tags: ['新建', '测试'],
        meta_data: { author: '测试作者' }
      };

      const entityData = Document.fromCreateRequest(createRequest, 1);

      expect(entityData.title).toBe('新文档');
      expect(entityData.content).toBe('新文档内容');
      expect(entityData.content_type).toBe(DocumentContentType.MARKDOWN);
      expect(entityData.directory_id).toBe(2);
      expect(entityData.author_id).toBe(1);
      expect(entityData.status).toBe(DocumentStatus.DRAFT);
      expect(entityData.tags).toBe('["新建","测试"]');
      expect(entityData.meta_data).toBe('{"author":"测试作者"}');
      expect(entityData.created_at).toBeInstanceOf(Date);
      expect(entityData.updated_at).toBeInstanceOf(Date);
    });

    it('应该使用默认值', () => {
      const createRequest = {
        title: '简单文档',
        content: '简单内容'
      };

      const entityData = Document.fromCreateRequest(createRequest, 1);

      expect(entityData.content_type).toBe(DocumentContentType.MARKDOWN);
      expect(entityData.status).toBe(DocumentStatus.DRAFT);
      expect(entityData.tags).toBe('[]');
      expect(entityData.meta_data).toBe('{}');
    });
  });

  describe('fromUpdateRequest', () => {
    it('应该从更新请求生成正确的更新数据', () => {
      const updateRequest = {
        title: '更新后的标题',
        content: '更新后的内容',
        status: DocumentStatus.PUBLISHED,
        tags: ['更新', '测试']
      };

      const updateData = Document.fromUpdateRequest(updateRequest);

      expect(updateData.title).toBe('更新后的标题');
      expect(updateData.slug).toBe('更新后的标题'.toLowerCase().replace(/\s+/g, '-'));
      expect(updateData.content).toBe('更新后的内容');
      expect(updateData.status).toBe(DocumentStatus.PUBLISHED);
      expect(updateData.tags).toBe('["更新","测试"]');
      expect(updateData.updated_at).toBeInstanceOf(Date);
    });

    it('应该只包含提供的字段', () => {
      const updateRequest = {
        title: '仅更新标题'
      };

      const updateData = Document.fromUpdateRequest(updateRequest);

      expect(updateData.title).toBe('仅更新标题');
      expect(updateData.content).toBeUndefined();
      expect(updateData.status).toBeUndefined();
      expect(updateData.updated_at).toBeInstanceOf(Date);
    });
  });

  describe('toResponse', () => {
    it('应该转换为正确的响应格式', () => {
      const document = new Document(mockDocumentEntity);
      const response = document.toResponse('testuser', 2);

      expect(response.id).toBe(1);
      expect(response.title).toBe('测试文档');
      expect(response.author_username).toBe('testuser');
      expect(response.version_number).toBe(2);
      expect(response.tags).toEqual(['测试', '文档']);
      expect(response.meta_data).toEqual({ description: '测试描述' });
    });
  });

  describe('status methods', () => {
    it('isPublished应该正确判断发布状态', () => {
      const publishedDoc = new Document({ ...mockDocumentEntity, status: DocumentStatus.PUBLISHED });
      const draftDoc = new Document({ ...mockDocumentEntity, status: DocumentStatus.DRAFT });

      expect(publishedDoc.isPublished()).toBe(true);
      expect(draftDoc.isPublished()).toBe(false);
    });

    it('isDraft应该正确判断草稿状态', () => {
      const draftDoc = new Document({ ...mockDocumentEntity, status: DocumentStatus.DRAFT });
      const publishedDoc = new Document({ ...mockDocumentEntity, status: DocumentStatus.PUBLISHED });

      expect(draftDoc.isDraft()).toBe(true);
      expect(publishedDoc.isDraft()).toBe(false);
    });

    it('isArchived应该正确判断归档状态', () => {
      const archivedDoc = new Document({ ...mockDocumentEntity, status: DocumentStatus.ARCHIVED });
      const publishedDoc = new Document({ ...mockDocumentEntity, status: DocumentStatus.PUBLISHED });

      expect(archivedDoc.isArchived()).toBe(true);
      expect(publishedDoc.isArchived()).toBe(false);
    });
  });

  describe('getSummary', () => {
    it('应该生成正确的摘要', () => {
      const document = new Document({
        ...mockDocumentEntity,
        content: '# 标题\n\n这是一段**粗体**文本和*斜体*文本。还有`代码`和[链接](http://example.com)。\n\n这是第二段。'
      });

      const summary = document.getSummary(50);

      expect(summary).toBe('标题 这是一段粗体文本和斜体文本。还有代码和链接。 这是第二段。');
      expect(summary.length).toBeLessThanOrEqual(50);
    });

    it('应该在内容较长时添加省略号', () => {
      const longContent = '这是一段很长的内容。'.repeat(20);
      const document = new Document({
        ...mockDocumentEntity,
        content: longContent
      });

      const summary = document.getSummary(50);

      expect(summary.endsWith('...')).toBe(true);
      expect(summary.length).toBeLessThanOrEqual(53); // 50 + '...'
    });
  });

  describe('generateSlug', () => {
    it('应该生成正确的slug', () => {
      expect(Document.generateSlug('Hello World')).toBe('hello-world');
      expect(Document.generateSlug('测试文档 123')).toBe('测试文档-123');
      expect(Document.generateSlug('Special!@#$%Characters')).toBe('specialcharacters');
      expect(Document.generateSlug('  Multiple   Spaces  ')).toBe('multiple-spaces');
      expect(Document.generateSlug('Under_Score-Dash')).toBe('under-score-dash');
    });

    it('应该处理空字符串和特殊情况', () => {
      expect(Document.generateSlug('')).toBe('');
      expect(Document.generateSlug('   ')).toBe('');
      expect(Document.generateSlug('---')).toBe('');
    });
  });

  describe('validation methods', () => {
    it('validateTitle应该正确验证标题', () => {
      expect(Document.validateTitle('有效标题')).toBe(true);
      expect(Document.validateTitle('')).toBe(false);
      expect(Document.validateTitle('   ')).toBe(false);
      expect(Document.validateTitle('a'.repeat(256))).toBe(false);
    });

    it('validateContent应该正确验证内容', () => {
      expect(Document.validateContent('有效内容')).toBe(true);
      expect(Document.validateContent('')).toBe(true);
      expect(Document.validateContent(null as any)).toBe(false);
      expect(Document.validateContent(undefined as any)).toBe(false);
    });
  });

  describe('extractHeadings', () => {
    it('应该正确提取Markdown标题', () => {
      const document = new Document({
        ...mockDocumentEntity,
        content: `# 一级标题
## 二级标题
### 三级标题
普通文本
#### 四级标题`
      });

      const headings = document.extractHeadings();

      expect(headings).toHaveLength(4);
      expect(headings[0]).toEqual({ level: 1, text: '一级标题', id: '一级标题' });
      expect(headings[1]).toEqual({ level: 2, text: '二级标题', id: '二级标题' });
      expect(headings[2]).toEqual({ level: 3, text: '三级标题', id: '三级标题' });
      expect(headings[3]).toEqual({ level: 4, text: '四级标题', id: '四级标题' });
    });

    it('应该为非Markdown内容返回空数组', () => {
      const document = new Document({
        ...mockDocumentEntity,
        content_type: DocumentContentType.HTML,
        content: '<h1>HTML标题</h1>'
      });

      const headings = document.extractHeadings();

      expect(headings).toEqual([]);
    });
  });
});