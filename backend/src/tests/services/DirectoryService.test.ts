import { DirectoryService } from '@/services/DirectoryService';
import { DirectoryRepository } from '@/repositories/DirectoryRepository';
import { DocumentRepository } from '@/repositories/DocumentRepository';
import { Directory } from '@/models/Directory';
import { DirectoryEntity } from '@/types/directory';

// Mock dependencies
jest.mock('@/repositories/DirectoryRepository');
jest.mock('@/repositories/DocumentRepository');
jest.mock('@/config/database');

describe('DirectoryService', () => {
  let directoryService: DirectoryService;
  let mockDirectoryRepository: jest.Mocked<DirectoryRepository>;
  let mockDocumentRepository: jest.Mocked<DocumentRepository>;

  const mockDirectoryEntity: DirectoryEntity = {
    id: 1,
    name: '技术文档',
    description: '技术相关的文档目录',
    parent_id: null,
    path: '/技术文档',
    sort_order: 0,
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z')
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock instances
    mockDirectoryRepository = new DirectoryRepository({} as any) as jest.Mocked<DirectoryRepository>;
    mockDocumentRepository = new DocumentRepository({} as any) as jest.Mocked<DocumentRepository>;

    // Mock constructor calls
    (DirectoryRepository as jest.Mock).mockImplementation(() => mockDirectoryRepository);
    (DocumentRepository as jest.Mock).mockImplementation(() => mockDocumentRepository);

    directoryService = new DirectoryService();
  });

  describe('checkDeleteStatus', () => {
    it('应该返回可以删除的空目录状态', async () => {
      const directory = new Directory(mockDirectoryEntity);
      
      mockDirectoryRepository.findById.mockResolvedValue(directory);
      mockDirectoryRepository.findByParentId.mockResolvedValue([]);
      mockDirectoryRepository.getDocumentCount.mockResolvedValue(0);
      mockDirectoryRepository.getDescendants.mockResolvedValue([]);
      mockDirectoryRepository.getDocumentCounts.mockResolvedValue(new Map());

      const result = await directoryService.checkDeleteStatus(1);

      expect(result.can_delete).toBe(true);
      expect(result.has_children).toBe(false);
      expect(result.has_documents).toBe(false);
      expect(result.children_count).toBe(0);
      expect(result.document_count).toBe(0);
      expect(result.total_document_count).toBe(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('应该返回不能删除的非空目录状态', async () => {
      const directory = new Directory(mockDirectoryEntity);
      const childDirectory = new Directory({
        ...mockDirectoryEntity,
        id: 2,
        name: '子目录',
        parent_id: 1,
        path: '/技术文档/子目录'
      });

      mockDirectoryRepository.findById.mockResolvedValue(directory);
      mockDirectoryRepository.findByParentId.mockResolvedValue([childDirectory]);
      mockDirectoryRepository.getDocumentCount.mockResolvedValue(3);
      mockDirectoryRepository.getDescendants.mockResolvedValue([childDirectory]);
      mockDirectoryRepository.getDocumentCounts.mockResolvedValue(new Map([[2, 2]]));

      const result = await directoryService.checkDeleteStatus(1);

      expect(result.can_delete).toBe(false);
      expect(result.has_children).toBe(true);
      expect(result.has_documents).toBe(true);
      expect(result.children_count).toBe(1);
      expect(result.document_count).toBe(3);
      expect(result.total_document_count).toBe(5);
      expect(result.warnings).toContain('该目录包含 1 个子目录');
      expect(result.warnings).toContain('该目录包含 3 个文档');
      expect(result.warnings).toContain('子目录中包含 2 个文档');
    });

    it('应该在目录不存在时抛出错误', async () => {
      mockDirectoryRepository.findById.mockResolvedValue(null);

      await expect(directoryService.checkDeleteStatus(999)).rejects.toThrow('目录不存在');
    });
  });

  describe('moveDirectoryWithChildren', () => {
    it('应该成功移动目录到新位置', async () => {
      const sourceDirectory = new Directory(mockDirectoryEntity);
      const targetParent = new Directory({
        ...mockDirectoryEntity,
        id: 2,
        name: '目标目录',
        path: '/目标目录'
      });
      const updatedDirectory = new Directory({
        ...mockDirectoryEntity,
        parent_id: 2,
        path: '/目标目录/技术文档'
      });

      mockDirectoryRepository.findById
        .mockResolvedValueOnce(sourceDirectory)
        .mockResolvedValueOnce(targetParent);
      mockDirectoryRepository.pathExists.mockResolvedValue(false);
      mockDirectoryRepository.getDescendants.mockResolvedValue([]);
      mockDirectoryRepository.getNextSortOrder.mockResolvedValue(0);
      mockDirectoryRepository.update.mockResolvedValue(updatedDirectory);
      mockDirectoryRepository.updatePaths.mockResolvedValue();

      const result = await directoryService.moveDirectoryWithChildren(1, 2);

      expect(result.moved_directory.id).toBe(1);
      expect(result.moved_directory.parent_id).toBe(2);
      expect(result.moved_directory.path).toBe('/目标目录/技术文档');
      expect(result.affected_paths).toHaveLength(0);
    });

    it('应该移动目录及其子目录', async () => {
      const sourceDirectory = new Directory(mockDirectoryEntity);
      const childDirectory = new Directory({
        ...mockDirectoryEntity,
        id: 3,
        name: '子目录',
        parent_id: 1,
        path: '/技术文档/子目录'
      });
      const updatedDirectory = new Directory({
        ...mockDirectoryEntity,
        parent_id: null,
        path: '/技术文档'
      });

      mockDirectoryRepository.findById.mockResolvedValue(sourceDirectory);
      mockDirectoryRepository.pathExists.mockResolvedValue(false);
      mockDirectoryRepository.getDescendants.mockResolvedValue([childDirectory]);
      mockDirectoryRepository.getNextSortOrder.mockResolvedValue(0);
      mockDirectoryRepository.update.mockResolvedValue(updatedDirectory);
      mockDirectoryRepository.updatePaths.mockResolvedValue();

      const result = await directoryService.moveDirectoryWithChildren(1);

      expect(result.moved_directory.id).toBe(1);
      expect(result.affected_paths).toHaveLength(1);
      expect(result.affected_paths[0]).toEqual({
        id: 3,
        old_path: '/技术文档/子目录',
        new_path: '/技术文档/子目录'
      });
    });

    it('应该在源目录不存在时抛出错误', async () => {
      mockDirectoryRepository.findById.mockResolvedValue(null);

      await expect(directoryService.moveDirectoryWithChildren(999)).rejects.toThrow('源目录不存在');
    });

    it('应该在目标父目录不存在时抛出错误', async () => {
      const sourceDirectory = new Directory(mockDirectoryEntity);
      
      mockDirectoryRepository.findById
        .mockResolvedValueOnce(sourceDirectory)
        .mockResolvedValueOnce(null);

      await expect(directoryService.moveDirectoryWithChildren(1, 999)).rejects.toThrow('目标父目录不存在');
    });

    it('应该在检测到循环引用时抛出错误', async () => {
      const sourceDirectory = new Directory(mockDirectoryEntity);
      const targetParent = new Directory({
        ...mockDirectoryEntity,
        id: 2,
        name: '子目录',
        parent_id: 1,
        path: '/技术文档/子目录'
      });

      mockDirectoryRepository.findById
        .mockResolvedValueOnce(sourceDirectory)
        .mockResolvedValueOnce(targetParent);

      await expect(directoryService.moveDirectoryWithChildren(1, 2)).rejects.toThrow('不能将目录移动到其子目录下');
    });

    it('应该在路径冲突时抛出错误', async () => {
      const sourceDirectory = new Directory(mockDirectoryEntity);
      const targetParent = new Directory({
        ...mockDirectoryEntity,
        id: 2,
        name: '目标目录',
        path: '/目标目录'
      });

      mockDirectoryRepository.findById
        .mockResolvedValueOnce(sourceDirectory)
        .mockResolvedValueOnce(targetParent);
      mockDirectoryRepository.pathExists.mockResolvedValue(true);

      await expect(directoryService.moveDirectoryWithChildren(1, 2)).rejects.toThrow('目标位置已存在同名目录');
    });
  });

  describe('batchMoveDirectories', () => {
    it('应该成功批量移动目录', async () => {
      const moves = [
        { source_id: 1, target_parent_id: 2 },
        { source_id: 3, target_parent_id: 2 }
      ];

      const mockMoveResult = {
        moved_directory: new Directory(mockDirectoryEntity).toResponse(),
        affected_paths: []
      };

      // Mock moveDirectoryWithChildren to succeed for both calls
      jest.spyOn(directoryService, 'moveDirectoryWithChildren')
        .mockResolvedValue(mockMoveResult);

      const result = await directoryService.batchMoveDirectories(moves);

      expect(result.successful_moves).toHaveLength(2);
      expect(result.failed_moves).toHaveLength(0);
      expect(directoryService.moveDirectoryWithChildren).toHaveBeenCalledTimes(2);
    });

    it('应该处理部分失败的批量移动', async () => {
      const moves = [
        { source_id: 1, target_parent_id: 2 },
        { source_id: 999, target_parent_id: 2 }
      ];

      const mockMoveResult = {
        moved_directory: new Directory(mockDirectoryEntity).toResponse(),
        affected_paths: []
      };

      jest.spyOn(directoryService, 'moveDirectoryWithChildren')
        .mockResolvedValueOnce(mockMoveResult)
        .mockRejectedValueOnce(new Error('源目录不存在'));

      const result = await directoryService.batchMoveDirectories(moves);

      expect(result.successful_moves).toHaveLength(1);
      expect(result.failed_moves).toHaveLength(1);
      expect(result.failed_moves[0]).toEqual({
        source_id: 999,
        error: '源目录不存在'
      });
    });
  });

  describe('copyDirectoryStructure', () => {
    it('应该成功复制目录结构', async () => {
      const sourceDirectory = new Directory(mockDirectoryEntity);
      const copiedDirectory = new Directory({
        ...mockDirectoryEntity,
        id: 2,
        name: '技术文档_副本',
        path: '/技术文档_副本'
      });

      mockDirectoryRepository.findById.mockResolvedValue(sourceDirectory);
      mockDirectoryRepository.pathExists.mockResolvedValue(false);
      mockDirectoryRepository.getNextSortOrder.mockResolvedValue(0);
      mockDirectoryRepository.create.mockResolvedValue(copiedDirectory);
      mockDirectoryRepository.getDescendants.mockResolvedValue([]);

      const result = await directoryService.copyDirectoryStructure(1);

      expect(result.copied_directory.name).toBe('技术文档_副本');
      expect(result.copied_directory.path).toBe('/技术文档_副本');
      expect(result.copied_children).toHaveLength(0);
    });

    it('应该使用自定义名称复制目录', async () => {
      const sourceDirectory = new Directory(mockDirectoryEntity);
      const copiedDirectory = new Directory({
        ...mockDirectoryEntity,
        id: 2,
        name: '自定义名称',
        path: '/自定义名称'
      });

      mockDirectoryRepository.findById.mockResolvedValue(sourceDirectory);
      mockDirectoryRepository.pathExists.mockResolvedValue(false);
      mockDirectoryRepository.getNextSortOrder.mockResolvedValue(0);
      mockDirectoryRepository.create.mockResolvedValue(copiedDirectory);
      mockDirectoryRepository.getDescendants.mockResolvedValue([]);

      const result = await directoryService.copyDirectoryStructure(1, undefined, '自定义名称');

      expect(result.copied_directory.name).toBe('自定义名称');
    });

    it('应该在源目录不存在时抛出错误', async () => {
      mockDirectoryRepository.findById.mockResolvedValue(null);

      await expect(directoryService.copyDirectoryStructure(999)).rejects.toThrow('源目录不存在');
    });

    it('应该在路径冲突时抛出错误', async () => {
      const sourceDirectory = new Directory(mockDirectoryEntity);

      mockDirectoryRepository.findById.mockResolvedValue(sourceDirectory);
      mockDirectoryRepository.pathExists.mockResolvedValue(true);

      await expect(directoryService.copyDirectoryStructure(1)).rejects.toThrow('目标位置已存在同名目录');
    });
  });

  describe('getDirectoryPathInfo', () => {
    it('应该返回完整的目录路径信息', async () => {
      const directory = new Directory(mockDirectoryEntity);
      const ancestor = new Directory({
        ...mockDirectoryEntity,
        id: 0,
        name: '根目录',
        path: '/'
      });
      const child = new Directory({
        ...mockDirectoryEntity,
        id: 2,
        name: '子目录',
        parent_id: 1,
        path: '/技术文档/子目录'
      });

      mockDirectoryRepository.findById.mockResolvedValue(directory);
      mockDirectoryRepository.getAncestors.mockResolvedValue([ancestor]);
      mockDirectoryRepository.findByParentId.mockResolvedValue([child]);

      const result = await directoryService.getDirectoryPathInfo(1);

      expect(result.directory.id).toBe(1);
      expect(result.ancestors).toHaveLength(1);
      expect(result.children).toHaveLength(1);
      expect(result.breadcrumb).toHaveLength(3);
      expect(result.breadcrumb[0]).toEqual({
        id: 0,
        name: '根目录',
        path: '/'
      });
      expect(result.breadcrumb[2]).toEqual({
        id: 1,
        name: '技术文档',
        path: '/技术文档'
      });
    });

    it('应该在目录不存在时抛出错误', async () => {
      mockDirectoryRepository.findById.mockResolvedValue(null);

      await expect(directoryService.getDirectoryPathInfo(999)).rejects.toThrow('目录不存在');
    });
  });

  describe('validateDirectoryOperation', () => {
    it('应该验证有效的创建操作', async () => {
      mockDirectoryRepository.exists.mockResolvedValue(true);

      const result = await directoryService.validateDirectoryOperation('create', undefined, 1);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该验证删除操作', async () => {
      const directory = new Directory(mockDirectoryEntity);
      
      mockDirectoryRepository.findById.mockResolvedValue(directory);
      mockDirectoryRepository.findByParentId.mockResolvedValue([]);
      mockDirectoryRepository.getDocumentCount.mockResolvedValue(0);
      mockDirectoryRepository.getDescendants.mockResolvedValue([]);
      mockDirectoryRepository.getDocumentCounts.mockResolvedValue(new Map());

      const result = await directoryService.validateDirectoryOperation('delete', 1);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该拒绝删除非空目录', async () => {
      const directory = new Directory(mockDirectoryEntity);
      const child = new Directory({
        ...mockDirectoryEntity,
        id: 2,
        parent_id: 1
      });
      
      mockDirectoryRepository.findById.mockResolvedValue(directory);
      mockDirectoryRepository.findByParentId.mockResolvedValue([child]);
      mockDirectoryRepository.getDocumentCount.mockResolvedValue(0);
      mockDirectoryRepository.getDescendants.mockResolvedValue([]);
      mockDirectoryRepository.getDocumentCounts.mockResolvedValue(new Map());

      const result = await directoryService.validateDirectoryOperation('delete', 1);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('目录不为空，无法删除');
    });

    it('应该验证移动操作', async () => {
      const sourceDirectory = new Directory(mockDirectoryEntity);
      const targetDirectory = new Directory({
        ...mockDirectoryEntity,
        id: 2,
        name: '目标目录',
        path: '/目标目录'
      });

      mockDirectoryRepository.findById
        .mockResolvedValueOnce(sourceDirectory)
        .mockResolvedValueOnce(targetDirectory);
      mockDirectoryRepository.exists.mockResolvedValue(true);

      const result = await directoryService.validateDirectoryOperation('move', 1, 2);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该拒绝循环引用的移动操作', async () => {
      const sourceDirectory = new Directory(mockDirectoryEntity);
      const targetDirectory = new Directory({
        ...mockDirectoryEntity,
        id: 2,
        name: '子目录',
        parent_id: 1,
        path: '/技术文档/子目录'
      });

      mockDirectoryRepository.findById
        .mockResolvedValueOnce(sourceDirectory)
        .mockResolvedValueOnce(targetDirectory);
      mockDirectoryRepository.exists.mockResolvedValue(true);

      const result = await directoryService.validateDirectoryOperation('move', 1, 2);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('不能将目录移动到其子目录下');
    });

    it('应该拒绝移动到自己', async () => {
      const directory = new Directory(mockDirectoryEntity);

      mockDirectoryRepository.findById.mockResolvedValue(directory);

      const result = await directoryService.validateDirectoryOperation('move', 1, 1);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('不能将目录移动到自己下面');
    });

    it('应该在目录不存在时返回错误', async () => {
      mockDirectoryRepository.findById.mockResolvedValue(null);

      const result = await directoryService.validateDirectoryOperation('update', 999);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('目录不存在');
    });
  });
});