import { FileStorageService } from '../../services/FileStorageService';
import fs from 'fs/promises';
import path from 'path';

// Mock fs模块
jest.mock('fs/promises');

describe('FileStorageService', () => {
  let storageService: FileStorageService;
  let mockFs: jest.Mocked<typeof fs>;

  beforeEach(() => {
    storageService = new FileStorageService({
      uploadPath: 'test-uploads',
      maxFileSize: 1024 * 1024 // 1MB
    });
    mockFs = fs as jest.Mocked<typeof fs>;
    jest.clearAllMocks();
  });

  describe('storeFile', () => {
    const testBuffer = Buffer.from('test file content');
    const originalFilename = 'test.jpg';
    const mimeType = 'image/jpeg';

    it('应该成功存储文件', async () => {
      // Mock文件系统操作
      mockFs.writeFile.mockResolvedValueOnce(undefined);
      mockFs.stat.mockResolvedValueOnce({
        size: testBuffer.length,
        isFile: () => true
      } as any);
      mockFs.chmod.mockResolvedValueOnce(undefined);

      const result = await storageService.storeFile(testBuffer, originalFilename, mimeType);

      expect(result.success).toBe(true);
      expect(result.filePath).toBeDefined();
      expect(result.filename).toBeDefined();
      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    it('应该在写入失败时返回错误', async () => {
      mockFs.writeFile.mockRejectedValueOnce(new Error('磁盘空间不足'));

      const result = await storageService.storeFile(testBuffer, originalFilename, mimeType);

      expect(result.success).toBe(false);
      expect(result.error).toContain('文件存储失败');
    });

    it('应该在文件验证失败时删除文件并返回错误', async () => {
      mockFs.writeFile.mockResolvedValueOnce(undefined);
      mockFs.stat.mockResolvedValueOnce({
        size: 0, // 错误的文件大小
        isFile: () => true
      } as any);
      mockFs.unlink.mockResolvedValueOnce(undefined);

      const result = await storageService.storeFile(testBuffer, originalFilename, mimeType);

      expect(result.success).toBe(false);
      expect(result.error).toBe('文件写入验证失败');
      expect(mockFs.unlink).toHaveBeenCalled();
    });
  });

  describe('readFile', () => {
    const testFilePath = 'test-uploads/2024/01/01/test.jpg';

    it('应该成功读取文件', async () => {
      const testBuffer = Buffer.from('file content');
      mockFs.access.mockResolvedValueOnce(undefined);
      mockFs.readFile.mockResolvedValueOnce(testBuffer);

      const result = await storageService.readFile(testFilePath);

      expect(result.success).toBe(true);
      expect(result.buffer).toBe(testBuffer);
    });

    it('应该在文件不存在时返回错误', async () => {
      mockFs.access.mockRejectedValueOnce(new Error('ENOENT'));

      const result = await storageService.readFile(testFilePath);

      expect(result.success).toBe(false);
      expect(result.error).toBe('文件不存在');
    });

    it('应该在路径不安全时返回错误', async () => {
      const unsafePath = '../../../etc/passwd';

      const result = await storageService.readFile(unsafePath);

      expect(result.success).toBe(false);
      expect(result.error).toContain('文件路径包含非法字符');
    });

    it('应该在读取失败时返回错误', async () => {
      mockFs.access.mockResolvedValueOnce(undefined);
      mockFs.readFile.mockRejectedValueOnce(new Error('权限不足'));

      const result = await storageService.readFile(testFilePath);

      expect(result.success).toBe(false);
      expect(result.error).toContain('文件读取失败');
    });
  });

  describe('deleteFile', () => {
    const testFilePath = 'test-uploads/2024/01/01/test.jpg';

    it('应该成功删除文件', async () => {
      mockFs.access.mockResolvedValueOnce(undefined);
      mockFs.unlink.mockResolvedValueOnce(undefined);

      const result = await storageService.deleteFile(testFilePath);

      expect(result.success).toBe(true);
      expect(mockFs.unlink).toHaveBeenCalledWith(testFilePath);
    });

    it('应该在文件不存在时仍然返回成功', async () => {
      mockFs.access.mockRejectedValueOnce(new Error('ENOENT'));

      const result = await storageService.deleteFile(testFilePath);

      expect(result.success).toBe(true);
      expect(mockFs.unlink).not.toHaveBeenCalled();
    });

    it('应该在路径不安全时返回错误', async () => {
      const unsafePath = '../../../important-file.txt';

      const result = await storageService.deleteFile(unsafePath);

      expect(result.success).toBe(false);
      expect(result.error).toContain('文件路径包含非法字符');
    });

    it('应该在删除失败时返回错误', async () => {
      mockFs.access.mockResolvedValueOnce(undefined);
      mockFs.unlink.mockRejectedValueOnce(new Error('权限不足'));

      const result = await storageService.deleteFile(testFilePath);

      expect(result.success).toBe(false);
      expect(result.error).toContain('文件删除失败');
    });
  });

  describe('getFileInfo', () => {
    const testFilePath = 'test-uploads/2024/01/01/test.jpg';

    it('应该成功获取文件信息', async () => {
      const mockStats = {
        size: 1024,
        mtime: new Date('2024-01-01T00:00:00Z'),
        isFile: () => true
      };
      mockFs.stat.mockResolvedValueOnce(mockStats as any);

      const result = await storageService.getFileInfo(testFilePath);

      expect(result.success).toBe(true);
      expect(result.info!.size).toBe(1024);
      expect(result.info!.mtime).toEqual(new Date('2024-01-01T00:00:00Z'));
      expect(result.info!.isFile).toBe(true);
    });

    it('应该在路径不安全时返回错误', async () => {
      const unsafePath = '../../../etc/passwd';

      const result = await storageService.getFileInfo(unsafePath);

      expect(result.success).toBe(false);
      expect(result.error).toContain('文件路径包含非法字符');
    });

    it('应该在获取信息失败时返回错误', async () => {
      mockFs.stat.mockRejectedValueOnce(new Error('文件不存在'));

      const result = await storageService.getFileInfo(testFilePath);

      expect(result.success).toBe(false);
      expect(result.error).toContain('获取文件信息失败');
    });
  });

  describe('路径处理方法', () => {
    it('应该正确获取相对路径', () => {
      const fullPath = path.resolve('test-uploads/2024/01/01/test.jpg');
      const relativePath = storageService.getRelativePath(fullPath);

      expect(relativePath).toContain('2024/01/01/test.jpg');
    });

    it('应该正确获取完整路径', () => {
      const relativePath = '2024/01/01/test.jpg';
      const fullPath = storageService.getFullPath(relativePath);

      expect(fullPath).toContain('test-uploads');
      expect(fullPath).toContain('2024/01/01/test.jpg');
    });
  });

  describe('私有方法测试（通过公共接口）', () => {
    it('应该正确验证文件路径安全性', async () => {
      // 测试路径遍历攻击
      const result = await storageService.readFile('../../../etc/passwd');
      expect(result.success).toBe(false);
      expect(result.error).toContain('文件路径包含非法字符');
    });

    it('应该正确检查文件是否存在', async () => {
      // 通过readFile方法间接测试fileExists
      mockFs.access.mockRejectedValueOnce(new Error('ENOENT'));
      
      const result = await storageService.readFile('nonexistent.txt');
      expect(result.success).toBe(false);
      expect(result.error).toBe('文件不存在');
    });
  });

  describe('目录管理', () => {
    it('应该在存储文件时自动创建目录', async () => {
      const testBuffer = Buffer.from('test');
      
      // Mock目录不存在的情况
      mockFs.access.mockRejectedValueOnce(new Error('ENOENT'));
      mockFs.mkdir.mockResolvedValueOnce(undefined);
      mockFs.writeFile.mockResolvedValueOnce(undefined);
      mockFs.stat.mockResolvedValueOnce({
        size: testBuffer.length,
        isFile: () => true
      } as any);

      const result = await storageService.storeFile(testBuffer, 'test.txt', 'text/plain');

      expect(result.success).toBe(true);
      expect(mockFs.mkdir).toHaveBeenCalledWith(
        expect.any(String),
        { recursive: true }
      );
    });
  });
});