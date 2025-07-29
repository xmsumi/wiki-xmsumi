import { FileRepository } from '../../repositories/FileRepository';
import { File } from '../../models/File';
import { FileMetadata } from '../../types/file';

// Mock数据库
jest.mock('../../config/database', () => ({
  db: {
    execute: jest.fn()
  }
}));

describe('FileRepository', () => {
  let repository: FileRepository;
  let mockDb: any;

  const mockFileData: Omit<FileMetadata, 'id' | 'createdAt'> = {
    filename: 'test_123456.jpg',
    originalName: 'photo.jpg',
    filePath: 'uploads/2024/01/01/test_123456.jpg',
    fileSize: 1024000,
    mimeType: 'image/jpeg',
    uploaderId: 1
  };

  const mockFileEntity = {
    id: 1,
    filename: 'test_123456.jpg',
    original_name: 'photo.jpg',
    file_path: 'uploads/2024/01/01/test_123456.jpg',
    file_size: 1024000,
    mime_type: 'image/jpeg',
    uploader_id: 1,
    created_at: new Date('2024-01-01T00:00:00Z')
  };

  beforeEach(() => {
    repository = new FileRepository();
    mockDb = require('../../config/database').db;
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('应该成功创建文件记录', async () => {
      // Mock插入操作
      mockDb.execute
        .mockResolvedValueOnce([{ insertId: 1 }, []])
        .mockResolvedValueOnce([[mockFileEntity], []]);

      const result = await repository.create(mockFileData);

      expect(result).toBeInstanceOf(File);
      expect(result.id).toBe(1);
      expect(result.filename).toBe(mockFileData.filename);
      expect(result.originalName).toBe(mockFileData.originalName);
      expect(mockDb.execute).toHaveBeenCalledTimes(2);
    });

    it('应该在创建失败时抛出错误', async () => {
      mockDb.execute.mockRejectedValueOnce(new Error('数据库错误'));

      await expect(repository.create(mockFileData)).rejects.toThrow('数据库错误');
    });
  });

  describe('findById', () => {
    it('应该根据ID找到文件', async () => {
      mockDb.execute.mockResolvedValueOnce([[mockFileEntity], []]);

      const result = await repository.findById(1);

      expect(result).toBeInstanceOf(File);
      expect(result!.id).toBe(1);
      expect(result!.filename).toBe('test_123456.jpg');
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [1]
      );
    });

    it('应该在文件不存在时返回null', async () => {
      mockDb.execute.mockResolvedValueOnce([[], []]);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });

    it('应该在查询失败时抛出错误', async () => {
      mockDb.execute.mockRejectedValueOnce(new Error('数据库错误'));

      await expect(repository.findById(1)).rejects.toThrow('数据库错误');
    });
  });

  describe('findByFilename', () => {
    it('应该根据文件名找到文件', async () => {
      mockDb.execute.mockResolvedValueOnce([[mockFileEntity], []]);

      const result = await repository.findByFilename('test_123456.jpg');

      expect(result).toBeInstanceOf(File);
      expect(result!.filename).toBe('test_123456.jpg');
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('WHERE filename = ?'),
        ['test_123456.jpg']
      );
    });

    it('应该在文件不存在时返回null', async () => {
      mockDb.execute.mockResolvedValueOnce([[], []]);

      const result = await repository.findByFilename('nonexistent.jpg');

      expect(result).toBeNull();
    });
  });

  describe('findByUploader', () => {
    it('应该获取用户上传的文件列表', async () => {
      const mockFiles = [mockFileEntity, { ...mockFileEntity, id: 2 }];
      mockDb.execute.mockResolvedValueOnce([mockFiles, []]);

      const result = await repository.findByUploader(1, 10, 0);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(File);
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('WHERE uploader_id = ?'),
        [1, 10, 0]
      );
    });

    it('应该支持分页参数', async () => {
      mockDb.execute.mockResolvedValueOnce([[], []]);

      await repository.findByUploader(1, 20, 40);

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT ? OFFSET ?'),
        [1, 20, 40]
      );
    });
  });

  describe('findAll', () => {
    it('应该获取所有文件列表', async () => {
      const mockFiles = [mockFileEntity];
      mockDb.execute.mockResolvedValueOnce([mockFiles, []]);

      const result = await repository.findAll(50, 0);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(File);
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY created_at DESC'),
        [50, 0]
      );
    });
  });

  describe('delete', () => {
    it('应该成功删除文件记录', async () => {
      mockDb.execute.mockResolvedValueOnce([{ affectedRows: 1 }, []]);

      const result = await repository.delete(1);

      expect(result).toBe(true);
      expect(mockDb.execute).toHaveBeenCalledWith(
        'DELETE FROM files WHERE id = ?',
        [1]
      );
    });

    it('应该在文件不存在时返回false', async () => {
      mockDb.execute.mockResolvedValueOnce([{ affectedRows: 0 }, []]);

      const result = await repository.delete(999);

      expect(result).toBe(false);
    });

    it('应该在删除失败时抛出错误', async () => {
      mockDb.execute.mockRejectedValueOnce(new Error('数据库错误'));

      await expect(repository.delete(1)).rejects.toThrow('数据库错误');
    });
  });

  describe('countByUploader', () => {
    it('应该获取用户上传文件总数', async () => {
      mockDb.execute.mockResolvedValueOnce([[{ count: 5 }], []]);

      const result = await repository.countByUploader(1);

      expect(result).toBe(5);
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('COUNT(*)'),
        [1]
      );
    });
  });

  describe('count', () => {
    it('应该获取文件总数', async () => {
      mockDb.execute.mockResolvedValueOnce([[{ count: 10 }], []]);

      const result = await repository.count();

      expect(result).toBe(10);
    });
  });

  describe('countUploadsInTimeRange', () => {
    it('应该获取时间段内的上传数量', async () => {
      const startTime = new Date('2024-01-01T00:00:00Z');
      const endTime = new Date('2024-01-01T23:59:59Z');
      mockDb.execute.mockResolvedValueOnce([[{ count: 3 }], []]);

      const result = await repository.countUploadsInTimeRange(1, startTime, endTime);

      expect(result).toBe(3);
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('BETWEEN ? AND ?'),
        [1, startTime, endTime]
      );
    });
  });

  describe('findByMimeType', () => {
    it('应该根据MIME类型查找文件', async () => {
      mockDb.execute.mockResolvedValueOnce([[mockFileEntity], []]);

      const result = await repository.findByMimeType('image/jpeg', 10, 0);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(File);
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('WHERE mime_type = ?'),
        ['image/jpeg', 10, 0]
      );
    });
  });

  describe('getStorageStats', () => {
    it('应该获取存储统计信息', async () => {
      const mockStats = {
        total_files: 100,
        total_size: 1024000000,
        average_size: 10240000,
        largest_file: 50000000
      };
      mockDb.execute.mockResolvedValueOnce([[mockStats], []]);

      const result = await repository.getStorageStats();

      expect(result).toEqual({
        totalFiles: 100,
        totalSize: 1024000000,
        averageSize: 10240000,
        largestFile: 50000000
      });
    });

    it('应该处理空数据库的情况', async () => {
      const mockStats = {
        total_files: null,
        total_size: null,
        average_size: null,
        largest_file: null
      };
      mockDb.execute.mockResolvedValueOnce([[mockStats], []]);

      const result = await repository.getStorageStats();

      expect(result).toEqual({
        totalFiles: 0,
        totalSize: 0,
        averageSize: 0,
        largestFile: 0
      });
    });
  });
});