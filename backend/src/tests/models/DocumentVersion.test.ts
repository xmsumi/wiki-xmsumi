import { DocumentVersion } from '@/models/DocumentVersion';
import { DocumentVersionEntity } from '@/types/document';

describe('DocumentVersion Model', () => {
  const mockVersionEntity: DocumentVersionEntity = {
    id: 1,
    document_id: 1,
    version_number: 2,
    title: '测试文档版本',
    content: '# 版本内容\n\n这是版本2的内容。',
    author_id: 1,
    change_summary: '更新了内容',
    created_at: new Date('2024-01-01T00:00:00Z')
  };

  describe('constructor', () => {
    it('应该正确创建DocumentVersion实例', () => {
      const version = new DocumentVersion(mockVersionEntity);

      expect(version.id).toBe(1);
      expect(version.document_id).toBe(1);
      expect(version.version_number).toBe(2);
      expect(version.title).toBe('测试文档版本');
      expect(version.content).toBe('# 版本内容\n\n这是版本2的内容。');
      expect(version.author_id).toBe(1);
      expect(version.change_summary).toBe('更新了内容');
      expect(version.created_at).toEqual(new Date('2024-01-01T00:00:00Z'));
    });
  });

  describe('create', () => {
    it('应该创建正确的版本实体数据', () => {
      const versionData = DocumentVersion.create(
        1,
        3,
        '新版本标题',
        '新版本内容',
        2,
        '添加了新功能'
      );

      expect(versionData.document_id).toBe(1);
      expect(versionData.version_number).toBe(3);
      expect(versionData.title).toBe('新版本标题');
      expect(versionData.content).toBe('新版本内容');
      expect(versionData.author_id).toBe(2);
      expect(versionData.change_summary).toBe('添加了新功能');
      expect(versionData.created_at).toBeInstanceOf(Date);
    });

    it('应该处理可选的change_summary', () => {
      const versionData = DocumentVersion.create(
        1,
        1,
        '初始版本',
        '初始内容',
        1
      );

      expect(versionData.change_summary).toBeUndefined();
    });
  });

  describe('toResponse', () => {
    it('应该转换为正确的响应格式', () => {
      const version = new DocumentVersion(mockVersionEntity);
      const response = version.toResponse('testuser');

      expect(response.id).toBe(1);
      expect(response.document_id).toBe(1);
      expect(response.version_number).toBe(2);
      expect(response.title).toBe('测试文档版本');
      expect(response.content).toBe('# 版本内容\n\n这是版本2的内容。');
      expect(response.author_id).toBe(1);
      expect(response.author_username).toBe('testuser');
      expect(response.change_summary).toBe('更新了内容');
      expect(response.created_at).toEqual(new Date('2024-01-01T00:00:00Z'));
    });

    it('应该处理没有作者用户名的情况', () => {
      const version = new DocumentVersion(mockVersionEntity);
      const response = version.toResponse();

      expect(response.author_username).toBeUndefined();
    });
  });

  describe('getSummary', () => {
    it('应该生成正确的内容摘要', () => {
      const version = new DocumentVersion({
        ...mockVersionEntity,
        content: '# 标题\n\n这是一段**粗体**文本和*斜体*文本。还有`代码`和[链接](http://example.com)。\n\n这是第二段。'
      });

      const summary = version.getSummary(50);

      expect(summary).toBe('标题 这是一段粗体文本和斜体文本。还有代码和链接。 这是第二段。');
      expect(summary.length).toBeLessThanOrEqual(50);
    });

    it('应该在内容较长时添加省略号', () => {
      const longContent = '这是一段很长的内容。'.repeat(20);
      const version = new DocumentVersion({
        ...mockVersionEntity,
        content: longContent
      });

      const summary = version.getSummary(50);

      expect(summary.endsWith('...')).toBe(true);
      expect(summary.length).toBeLessThanOrEqual(53); // 50 + '...'
    });
  });

  describe('compareVersions', () => {
    it('应该正确比较版本差异', () => {
      const oldContent = 'line1\nline2\nline3';
      const newContent = 'line1\nmodified line2\nline3\nline4';

      const diff = DocumentVersion.compareVersions(oldContent, newContent);

      expect(diff.changed).toBe(true);
      expect(diff.added).toBeGreaterThan(0);
      expect(diff.removed).toBeGreaterThan(0);
    });

    it('应该识别相同内容', () => {
      const content = 'same content\nline2';

      const diff = DocumentVersion.compareVersions(content, content);

      expect(diff.changed).toBe(false);
      expect(diff.added).toBe(0);
      expect(diff.removed).toBe(0);
    });

    it('应该处理新增行', () => {
      const oldContent = 'line1\nline2';
      const newContent = 'line1\nline2\nline3\nline4';

      const diff = DocumentVersion.compareVersions(oldContent, newContent);

      expect(diff.changed).toBe(true);
      expect(diff.added).toBe(2);
      expect(diff.removed).toBe(0);
    });

    it('应该处理删除行', () => {
      const oldContent = 'line1\nline2\nline3\nline4';
      const newContent = 'line1\nline2';

      const diff = DocumentVersion.compareVersions(oldContent, newContent);

      expect(diff.changed).toBe(true);
      expect(diff.added).toBe(0);
      expect(diff.removed).toBe(2);
    });
  });

  describe('generateChangeSummary', () => {
    it('应该生成标题变更摘要', () => {
      const summary = DocumentVersion.generateChangeSummary(
        '相同内容',
        '相同内容',
        '旧标题',
        '新标题'
      );

      expect(summary).toBe('标题从"旧标题"更改为"新标题"');
    });

    it('应该生成内容变更摘要', () => {
      const summary = DocumentVersion.generateChangeSummary(
        '旧内容\n第二行',
        '新内容\n第二行\n第三行',
        '相同标题',
        '相同标题'
      );

      expect(summary).toContain('新增');
      expect(summary).toContain('处内容');
    });

    it('应该生成标题和内容都变更的摘要', () => {
      const summary = DocumentVersion.generateChangeSummary(
        '旧内容',
        '新内容',
        '旧标题',
        '新标题'
      );

      expect(summary).toContain('标题从"旧标题"更改为"新标题"');
      expect(summary).toContain('内容');
    });

    it('应该为无变更返回默认摘要', () => {
      const summary = DocumentVersion.generateChangeSummary(
        '相同内容',
        '相同内容',
        '相同标题',
        '相同标题'
      );

      expect(summary).toBe('内容更新');
    });
  });

  describe('validateVersionNumber', () => {
    it('应该验证有效的版本号', () => {
      expect(DocumentVersion.validateVersionNumber(1)).toBe(true);
      expect(DocumentVersion.validateVersionNumber(100)).toBe(true);
    });

    it('应该拒绝无效的版本号', () => {
      expect(DocumentVersion.validateVersionNumber(0)).toBe(false);
      expect(DocumentVersion.validateVersionNumber(-1)).toBe(false);
      expect(DocumentVersion.validateVersionNumber(1.5)).toBe(false);
      expect(DocumentVersion.validateVersionNumber(NaN)).toBe(false);
    });
  });

  describe('isInitialVersion', () => {
    it('应该正确识别初始版本', () => {
      const initialVersion = new DocumentVersion({
        ...mockVersionEntity,
        version_number: 1
      });

      const laterVersion = new DocumentVersion({
        ...mockVersionEntity,
        version_number: 2
      });

      expect(initialVersion.isInitialVersion()).toBe(true);
      expect(laterVersion.isInitialVersion()).toBe(false);
    });
  });
});