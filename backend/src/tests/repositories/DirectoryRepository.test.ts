import mysql from 'mysql2/promise';
import { DirectoryRepository } from '@/repositories/DirectoryRepository';
import { Directory } from '@/models/Directory';
import { DirectoryEntity } from '@/types/directory';

// Mock mysql2/promise
jest.mock('mysql2/promise');

describe('DirectoryRepository', () => {
  let mockConnection: jest.Mocked<mysql.Connection>;
  let repository: DirectoryRepository;

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
    mockConnection = {
      execute: jest.fn(),
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn()
    } as any;

    repository = new DirectoryRepository(mockConnection);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('应该成功创建目录', async () => {
      const directoryData = {
        name: '新目录',
        description: '新目录描述',
        parent_id: null,
        path: '/新目录',
        sort_order: 0,
        created_at: new Date(),
        updated_at: new Date()
      };

      // Mock INSERT 操作
      mockConnection.execute
        .mockResolvedValueOnce([{ insertId: 1, affectedRows: 1 } as mysql.ResultSetHeader, []])
        // Mock 查询创建的目录
        .mockResolvedValueOnce([[mockDirectoryEntity], []]);

      const result = await repository.create(directoryData);

      expect(result).toBeInstanceOf(Directory);
      expect(result.id).toBe(1);
      expect(result.name).toBe('技术文档');
      expect(mockConnection.execute).toHaveBeenCalledTimes(2);
    });

    it('应该在创建后无法找到目录时抛出错误', async () => {
      const directoryData = {
        name: '新目录',
        path: '/新目录',
        created_at: new Date(),
        updated_at: new Date()
      };

      mockConnection.execute
        .mockResolvedValueOnce([{ insertId: 1, affectedRows: 1 } as mysql.ResultSetHeader, []])
        .mockResolvedValueOnce([[], []]); // 找不到创建的目录

      await expect(repository.create(directoryData)).rejects.toThrow('创建目录后无法找到该目录');
    });
  });

  describe('findById', () => {
    it('应该根据ID找到目录', async () => {
      mockConnection.execute.mockResolvedValueOnce([[mockDirectoryEntity], []]);

      const result = await repository.findById(1);

      expect(result).toBeInstanceOf(Directory);
      expect(result!.id).toBe(1);
      expect(result!.name).toBe('技术文档');
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'SELECT * FROM directories WHERE id = ?',
        [1]
      );
    });

    it('应该在找不到目录时返回null', async () => {
      mockConnection.execute.mockResolvedValueOnce([[], []]);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByPath', () => {
    it('应该根据路径找到目录', async () => {
      mockConnection.execute.mockResolvedValueOnce([[mockDirectoryEntity], []]);

      const result = await repository.findByPath('/技术文档');

      expect(result).toBeInstanceOf(Directory);
      expect(result!.path).toBe('/技术文档');
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'SELECT * FROM directories WHERE path = ?',
        ['/技术文档']
      );
    });

    it('应该在找不到目录时返回null', async () => {
      mockConnection.execute.mockResolvedValueOnce([[], []]);

      const result = await repository.findByPath('/不存在的目录');

      expect(result).toBeNull();
    });
  });

  describe('findByParentId', () => {
    it('应该找到指定父目录的子目录', async () => {
      const childDirectories = [
        { ...mockDirectoryEntity, id: 2, name: '子目录1', parent_id: 1, path: '/技术文档/子目录1' },
        { ...mockDirectoryEntity, id: 3, name: '子目录2', parent_id: 1, path: '/技术文档/子目录2' }
      ];

      mockConnection.execute.mockResolvedValueOnce([childDirectories, []]);

      const result = await repository.findByParentId(1);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Directory);
      expect(result[0].parent_id).toBe(1);
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'SELECT * FROM directories WHERE parent_id = ? ORDER BY sort_order ASC',
        [1]
      );
    });

    it('应该找到根目录（parent_id为null）', async () => {
      mockConnection.execute.mockResolvedValueOnce([[mockDirectoryEntity], []]);

      const result = await repository.findByParentId(null);

      expect(result).toHaveLength(1);
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'SELECT * FROM directories WHERE parent_id IS NULL ORDER BY sort_order ASC',
        []
      );
    });

    it('应该支持分页和排序选项', async () => {
      mockConnection.execute.mockResolvedValueOnce([[], []]);

      await repository.findByParentId(1, {
        sort_by: 'name',
        sort_order: 'DESC',
        limit: 10,
        offset: 5
      });

      expect(mockConnection.execute).toHaveBeenCalledWith(
        'SELECT * FROM directories WHERE parent_id = ? ORDER BY name DESC LIMIT ? OFFSET ?',
        [1, 10, 5]
      );
    });
  });

  describe('findAll', () => {
    it('应该找到所有目录', async () => {
      mockConnection.execute.mockResolvedValueOnce([[mockDirectoryEntity], []]);

      const result = await repository.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Directory);
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'SELECT * FROM directories ORDER BY sort_order ASC',
        []
      );
    });

    it('应该支持名称搜索', async () => {
      mockConnection.execute.mockResolvedValueOnce([[], []]);

      await repository.findAll({ name: '技术' });

      expect(mockConnection.execute).toHaveBeenCalledWith(
        'SELECT * FROM directories WHERE name LIKE ? ORDER BY sort_order ASC',
        ['%技术%']
      );
    });

    it('应该支持路径过滤', async () => {
      mockConnection.execute.mockResolvedValueOnce([[], []]);

      await repository.findAll({ path: '/技术文档' });

      expect(mockConnection.execute).toHaveBeenCalledWith(
        'SELECT * FROM directories WHERE path LIKE ? ORDER BY sort_order ASC',
        ['/技术文档%']
      );
    });

    it('应该支持多个查询条件', async () => {
      mockConnection.execute.mockResolvedValueOnce([[], []]);

      await repository.findAll({
        name: '技术',
        parent_id: 1,
        limit: 5
      });

      expect(mockConnection.execute).toHaveBeenCalledWith(
        'SELECT * FROM directories WHERE name LIKE ? AND parent_id = ? ORDER BY sort_order ASC LIMIT ?',
        ['%技术%', 1, 5]
      );
    });
  });

  describe('update', () => {
    it('应该成功更新目录', async () => {
      const updateData = {
        name: '更新的名称',
        description: '更新的描述'
      };

      mockConnection.execute
        .mockResolvedValueOnce([{ affectedRows: 1 } as mysql.ResultSetHeader, []])
        .mockResolvedValueOnce([[{ ...mockDirectoryEntity, ...updateData }], []]);

      const result = await repository.update(1, updateData);

      expect(result).toBeInstanceOf(Directory);
      expect(mockConnection.execute).toHaveBeenCalledTimes(2);
    });

    it('应该在没有更新字段时直接返回原目录', async () => {
      mockConnection.execute.mockResolvedValueOnce([[mockDirectoryEntity], []]);

      const result = await repository.update(1, {});

      expect(result).toBeInstanceOf(Directory);
      expect(mockConnection.execute).toHaveBeenCalledTimes(1);
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'SELECT * FROM directories WHERE id = ?',
        [1]
      );
    });
  });

  describe('delete', () => {
    it('应该成功删除目录', async () => {
      mockConnection.execute.mockResolvedValueOnce([{ affectedRows: 1 } as mysql.ResultSetHeader, []]);

      const result = await repository.delete(1);

      expect(result).toBe(true);
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'DELETE FROM directories WHERE id = ?',
        [1]
      );
    });

    it('应该在删除失败时返回false', async () => {
      mockConnection.execute.mockResolvedValueOnce([{ affectedRows: 0 } as mysql.ResultSetHeader, []]);

      const result = await repository.delete(999);

      expect(result).toBe(false);
    });
  });

  describe('exists', () => {
    it('应该正确检查目录是否存在', async () => {
      mockConnection.execute.mockResolvedValueOnce([[{ 1: 1 }], []]);

      const result = await repository.exists(1);

      expect(result).toBe(true);
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'SELECT 1 FROM directories WHERE id = ? LIMIT 1',
        [1]
      );
    });

    it('应该在目录不存在时返回false', async () => {
      mockConnection.execute.mockResolvedValueOnce([[], []]);

      const result = await repository.exists(999);

      expect(result).toBe(false);
    });
  });

  describe('pathExists', () => {
    it('应该正确检查路径是否存在', async () => {
      mockConnection.execute.mockResolvedValueOnce([[{ 1: 1 }], []]);

      const result = await repository.pathExists('/技术文档');

      expect(result).toBe(true);
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'SELECT 1 FROM directories WHERE path = ? LIMIT 1',
        ['/技术文档']
      );
    });

    it('应该支持排除指定ID', async () => {
      mockConnection.execute.mockResolvedValueOnce([[], []]);

      const result = await repository.pathExists('/技术文档', 1);

      expect(result).toBe(false);
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'SELECT 1 FROM directories WHERE path = ? AND id != ? LIMIT 1',
        ['/技术文档', 1]
      );
    });
  });

  describe('getDocumentCount', () => {
    it('应该返回目录的文档数量', async () => {
      mockConnection.execute.mockResolvedValueOnce([[{ count: 5 }], []]);

      const result = await repository.getDocumentCount(1);

      expect(result).toBe(5);
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM documents WHERE directory_id = ?',
        [1]
      );
    });
  });

  describe('getDocumentCounts', () => {
    it('应该返回多个目录的文档数量', async () => {
      const mockCounts = [
        { directory_id: 1, count: 5 },
        { directory_id: 2, count: 3 }
      ];
      mockConnection.execute.mockResolvedValueOnce([mockCounts, []]);

      const result = await repository.getDocumentCounts([1, 2, 3]);

      expect(result.get(1)).toBe(5);
      expect(result.get(2)).toBe(3);
      expect(result.get(3)).toBeUndefined();
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'SELECT directory_id, COUNT(*) as count FROM documents WHERE directory_id IN (?,?,?) GROUP BY directory_id',
        [1, 2, 3]
      );
    });

    it('应该处理空数组', async () => {
      const result = await repository.getDocumentCounts([]);

      expect(result.size).toBe(0);
      expect(mockConnection.execute).not.toHaveBeenCalled();
    });
  });

  describe('getDescendants', () => {
    it('应该返回目录的所有后代', async () => {
      const descendants = [
        { ...mockDirectoryEntity, id: 2, path: '/技术文档/前端' },
        { ...mockDirectoryEntity, id: 3, path: '/技术文档/后端' }
      ];

      mockConnection.execute
        .mockResolvedValueOnce([[mockDirectoryEntity], []])
        .mockResolvedValueOnce([descendants, []]);

      const result = await repository.getDescendants(1);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Directory);
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'SELECT * FROM directories WHERE path LIKE ? ORDER BY path',
        ['/技术文档/%']
      );
    });

    it('应该在目录不存在时返回空数组', async () => {
      mockConnection.execute.mockResolvedValueOnce([[], []]);

      const result = await repository.getDescendants(999);

      expect(result).toHaveLength(0);
    });
  });

  describe('updatePaths', () => {
    it('应该批量更新路径', async () => {
      const pathUpdates = [
        { id: 1, newPath: '/新路径1' },
        { id: 2, newPath: '/新路径2' }
      ];

      mockConnection.execute.mockResolvedValue([{ affectedRows: 1 } as mysql.ResultSetHeader, []]);

      await repository.updatePaths(pathUpdates);

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.execute).toHaveBeenCalledTimes(2);
      expect(mockConnection.commit).toHaveBeenCalled();
    });

    it('应该在出错时回滚事务', async () => {
      const pathUpdates = [{ id: 1, newPath: '/新路径' }];
      const error = new Error('数据库错误');

      mockConnection.execute.mockRejectedValueOnce(error);

      await expect(repository.updatePaths(pathUpdates)).rejects.toThrow(error);
      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.rollback).toHaveBeenCalled();
    });

    it('应该处理空更新数组', async () => {
      await repository.updatePaths([]);

      expect(mockConnection.beginTransaction).not.toHaveBeenCalled();
      expect(mockConnection.execute).not.toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('应该返回目录统计信息', async () => {
      const mockStats = [
        [[{ total_directories: 10 }], []],
        [[{ root_directories: 3 }], []],
        [[{ max_depth: 4 }], []],
        [[{ total_documents: 25 }], []]
      ];

      mockConnection.execute
        .mockResolvedValueOnce(mockStats[0])
        .mockResolvedValueOnce(mockStats[1])
        .mockResolvedValueOnce(mockStats[2])
        .mockResolvedValueOnce(mockStats[3]);

      const result = await repository.getStats();

      expect(result).toEqual({
        total_directories: 10,
        root_directories: 3,
        max_depth: 4,
        total_documents: 25
      });
      expect(mockConnection.execute).toHaveBeenCalledTimes(4);
    });
  });

  describe('checkDeleteStatus', () => {
    it('应该检查目录删除状态', async () => {
      const children = [
        { ...mockDirectoryEntity, id: 2, parent_id: 1 }
      ];
      const descendants = [
        { ...mockDirectoryEntity, id: 3, path: '/技术文档/子目录/孙目录' }
      ];

      mockConnection.execute
        .mockResolvedValueOnce([[mockDirectoryEntity], []]) // findById
        .mockResolvedValueOnce([children, []]) // findByParentId
        .mockResolvedValueOnce([[{ count: 2 }], []]) // getDocumentCount
        .mockResolvedValueOnce([descendants, []]) // getDescendants
        .mockResolvedValueOnce([[{ directory_id: 3, count: 1 }], []]); // getDocumentCounts

      const result = await repository.checkDeleteStatus(1);

      expect(result.can_delete).toBe(false);
      expect(result.has_children).toBe(true);
      expect(result.has_documents).toBe(true);
      expect(result.children_count).toBe(1);
      expect(result.document_count).toBe(2);
      expect(result.total_document_count).toBe(3);
      expect(result.warnings).toHaveLength(3);
    });

    it('应该在目录不存在时抛出错误', async () => {
      mockConnection.execute.mockResolvedValueOnce([[], []]);

      await expect(repository.checkDeleteStatus(999)).rejects.toThrow('目录不存在');
    });
  });

  describe('getNextSortOrder', () => {
    it('应该返回下一个排序顺序', async () => {
      mockConnection.execute.mockResolvedValueOnce([[{ next_order: 5 }], []]);

      const result = await repository.getNextSortOrder(1);

      expect(result).toBe(5);
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'SELECT COALESCE(MAX(sort_order), -1) + 1 as next_order FROM directories WHERE parent_id = ?',
        [1]
      );
    });

    it('应该处理根目录的排序顺序', async () => {
      mockConnection.execute.mockResolvedValueOnce([[{ next_order: 2 }], []]);

      const result = await repository.getNextSortOrder(null);

      expect(result).toBe(2);
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'SELECT COALESCE(MAX(sort_order), -1) + 1 as next_order FROM directories WHERE parent_id IS NULL',
        []
      );
    });
  });

  describe('reorderSiblings', () => {
    it('应该重新排序同级目录', async () => {
      const orderedIds = [3, 1, 2];
      mockConnection.execute.mockResolvedValue([{ affectedRows: 1 } as mysql.ResultSetHeader, []]);

      await repository.reorderSiblings(1, orderedIds);

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.execute).toHaveBeenCalledTimes(3);
      expect(mockConnection.commit).toHaveBeenCalled();
    });

    it('应该在出错时回滚事务', async () => {
      const orderedIds = [1, 2];
      const error = new Error('数据库错误');

      mockConnection.execute.mockRejectedValueOnce(error);

      await expect(repository.reorderSiblings(1, orderedIds)).rejects.toThrow(error);
      expect(mockConnection.rollback).toHaveBeenCalled();
    });
  });
});