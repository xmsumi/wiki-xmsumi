import { FileService } from '../../services/FileService';
import { FileRepository } from '../../repositories/FileRepository';
import { FileSecurityService } from '../../services/FileSecurityService';
import { FileStorageService } from '../../services/FileStorageService';
import { File } from '../../models/File';

// Mock依赖
jest.mock('../../repositories/FileRepository');
jest.mock('../../services/FileSecurityService');
jest.mock('../../services/FileStorageService');

describe('FileService', () => {
  let fileService: FileService;
  let mockFileRepository: jest.Mocked<FileRepository>;
  let mockSecurityService: jest.Mocked<FileSecurityService>;
  let mockStorageService: jest.Mocked<FileStorageService>;

  const mockFile = new File({
    id: 1,
    filename: 'test_123456.jpg',
    originalName: 'photo.jpg',
    filePath: 'uploads/2024/01/01/test_123456.jpg',
    fileSize: 1024000,
    mimeType: 'image/jpeg',
    uploaderId: 1,
    createdAt: new Date('2024-01-01T00:00:00Z')
  });

  beforeEach(() => {
    // 创建mock实例
    mockFileRepository = new FileRepository() as jest.Mocked<FileRepository>;
    mockSecurityService = new FileSecurityService() as jest.Mocked<FileSecurityService>;
    mockStorageService = new FileStorageService() as jest.Mocked<FileStorageService>;

    // 创建服务实例
    fileService = new FileService();

    // 替换私有属性（通过类型断言）
    (fileService as any).fileRepository = mockFileRepository;
    (fileService as any).securityService = mockSecurityService;
    (fileService as any).storageService = mockStorageService;

    jest.clearAllMocks();
  });

  describe('uploadFile', () => {
    const testBuffer = Buffer.from('test file content');
    const originalFilename = 'test.jpg';
    const mimeType = 'image/jpeg';
    const uploaderId = 1;

    it('应该成功上传文件', async () => {
      // Mock各个步骤的返回值
      mockSecurityService.checkUploadRateLimit.mockResolvedValueOnce({
        isAllowed: true
      });

      mockSecurityService.scanFile.mockResolvedValueOnce({
        isSafe: true,
        threats: [],
        scanTime: new Date()
      });

      mockStorageService.storeFile.mockResolvedValueOnce({
        success: true,
        filePath: '/full/path/to/file.jpg',
        filename: 'secure_filename.jpg'
      });

      mockStorageService.getRelativePath.mockReturnValueOnce('uploads/2024/01/01/secure_filename.jpg');

      mockFileRepository.create.mockResolvedValueOnce(mockFile);

      const result = await fileService.uploadFile(testBuffer, originalFilename, mimeType, uploaderId);

      expect(result.success).toBe(true);
      expect(result.fileId).toBe(1);
      expect(result.filename).toBe('test_123456.jpg');
      expect(mockSecurityService.checkUploadRateLimit).toHaveBeenCalledWith(uploaderId, 50);
      expect(mockSecurityService.scanFile).toHaveBeenCalledWith(testBuffer, originalFilename, mimeType);
      expect(mockStorageService.storeFile).toHaveBeenCalledWith(testBuffer, originalFilename, mimeType);
      expect(mockFileRepository.create).toHaveBeenCalled();
    });

    it('应该在频率限制检查失败时返回错误', async () => {
      mockSecurityService.checkUploadRateLimit.mockResolvedValueOnce({
        isAllowed: false,
        error: '上传频率超限'
      });

      const result = await fileService.uploadFile(testBuffer, originalFilename, mimeType, uploaderId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('上传频率超限');
      expect(mockSecurityService.scanFile).not.toHaveBeenCalled();
    });

    it('应该在安全扫描失败时返回错误', async () => {
      mockSecurityService.checkUploadRateLimit.mockResolvedValueOnce({
        isAllowed: true
      });

      mockSecurityService.scanFile.mockResolvedValueOnce({
        isSafe: false,
        threats: ['恶意脚本', '病毒'],
        scanTime: new Date()
      });

      const result = await fileService.uploadFile(testBuffer, originalFilename, mimeType, uploaderId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('文件安全检查失败');
      expect(result.error).toContain('恶意脚本');
      expect(mockStorageService.storeFile).not.toHaveBeenCalled();
    });

    it('应该在文件存储失败时返回错误', async () => {
      mockSecurityService.checkUploadRateLimit.mockResolvedValueOnce({
        isAllowed: true
      });

      mockSecurityService.scanFile.mockResolvedValueOnce({
        isSafe: true,
        threats: [],
        scanTime: new Date()
      });

      mockStorageService.storeFile.mockResolvedValueOnce({
        success: false,
        error: '磁盘空间不足'
      });

      const result = await fileService.uploadFile(testBuffer, originalFilename, mimeType, uploaderId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('磁盘空间不足');
      expect(mockFileRepository.create).not.toHaveBeenCalled();
    });

    it('应该处理异常情况', async () => {
      mockSecurityService.checkUploadRateLimit.mockRejectedValueOnce(new Error('服务异常'));

      const result = await fileService.uploadFile(testBuffer, originalFilename, mimeType, uploaderId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('服务异常');
    });
  });

  describe('getFileInfo', () => {
    it('应该成功获取文件信息', async () => {
      mockFileRepository.findById.mockResolvedValueOnce(mockFile);

      const result = await fileService.getFileInfo(1);

      expect(result).toBe(mockFile);
      expect(mockFileRepository.findById).toHaveBeenCalledWith(1);
    });

    it('应该在文件不存在时返回null', async () => {
      mockFileRepository.findById.mockResolvedValueOnce(null);

      const result = await fileService.getFileInfo(999);

      expect(result).toBeNull();
    });

    it('应该在查询失败时抛出错误', async () => {
      mockFileRepository.findById.mockRejectedValueOnce(new Error('数据库错误'));

      await expect(fileService.getFileInfo(1)).rejects.toThrow('数据库错误');
    });
  });

  describe('downloadFile', () => {
    it('应该成功下载文件', async () => {
      const testBuffer = Buffer.from('file content');
      
      mockFileRepository.findById.mockResolvedValueOnce(mockFile);
      mockStorageService.getFullPath.mockReturnValueOnce('/full/path/to/file.jpg');
      mockStorageService.readFile.mockResolvedValueOnce({
        success: true,
        buffer: testBuffer
      });

      const result = await fileService.downloadFile(1);

      expect(result.success).toBe(true);
      expect(result.buffer).toBe(testBuffer);
      expect(result.file).toBe(mockFile);
    });

    it('应该在文件不存在时返回错误', async () => {
      mockFileRepository.findById.mockResolvedValueOnce(null);

      const result = await fileService.downloadFile(999);

      expect(result.success).toBe(false);
      expect(result.error).toBe('文件不存在');
    });

    it('应该在文件读取失败时返回错误', async () => {
      mockFileRepository.findById.mockResolvedValueOnce(mockFile);
      mockStorageService.getFullPath.mockReturnValueOnce('/full/path/to/file.jpg');
      mockStorageService.readFile.mockResolvedValueOnce({
        success: false,
        error: '文件已损坏'
      });

      const result = await fileService.downloadFile(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('文件已损坏');
    });
  });

  describe('deleteFile', () => {
    it('应该成功删除文件', async () => {
      mockFileRepository.findById.mockResolvedValueOnce(mockFile);
      mockStorageService.getFullPath.mockReturnValueOnce('/full/path/to/file.jpg');
      mockStorageService.deleteFile.mockResolvedValueOnce({
        success: true
      });
      mockFileRepository.delete.mockResolvedValueOnce(true);

      const result = await fileService.deleteFile(1, 1);

      expect(result.success).toBe(true);
      expect(mockStorageService.deleteFile).toHaveBeenCalled();
      expect(mockFileRepository.delete).toHaveBeenCalledWith(1);
    });

    it('应该在文件不存在时返回错误', async () => {
      mockFileRepository.findById.mockResolvedValueOnce(null);

      const result = await fileService.deleteFile(999, 1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('文件不存在');
    });

    it('应该在无权限时返回错误', async () => {
      mockFileRepository.findById.mockResolvedValueOnce(mockFile);

      const result = await fileService.deleteFile(1, 2); // 不同的用户ID

      expect(result.success).toBe(false);
      expect(result.error).toBe('无权限删除此文件');
    });

    it('应该在物理文件删除失败时仍然删除数据库记录', async () => {
      mockFileRepository.findById.mockResolvedValueOnce(mockFile);
      mockStorageService.getFullPath.mockReturnValueOnce('/full/path/to/file.jpg');
      mockStorageService.deleteFile.mockResolvedValueOnce({
        success: false,
        error: '文件不存在'
      });
      mockFileRepository.delete.mockResolvedValueOnce(true);

      const result = await fileService.deleteFile(1, 1);

      expect(result.success).toBe(true);
      expect(mockFileRepository.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('getUserFiles', () => {
    it('应该获取用户文件列表', async () => {
      const mockFiles = [mockFile];
      mockFileRepository.findByUploader.mockResolvedValueOnce(mockFiles);
      mockFileRepository.countByUploader.mockResolvedValueOnce(10);

      const result = await fileService.getUserFiles(1, 1, 20);

      expect(result.files).toBe(mockFiles);
      expect(result.total).toBe(10);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(mockFileRepository.findByUploader).toHaveBeenCalledWith(1, 20, 0);
      expect(mockFileRepository.countByUploader).toHaveBeenCalledWith(1);
    });
  });

  describe('getAllFiles', () => {
    it('应该获取所有文件列表', async () => {
      const mockFiles = [mockFile];
      mockFileRepository.findAll.mockResolvedValueOnce(mockFiles);
      mockFileRepository.count.mockResolvedValueOnce(50);

      const result = await fileService.getAllFiles(2, 10);

      expect(result.files).toBe(mockFiles);
      expect(result.total).toBe(50);
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(10);
      expect(mockFileRepository.findAll).toHaveBeenCalledWith(10, 10);
      expect(mockFileRepository.count).toHaveBeenCalled();
    });
  });

  describe('getStorageStats', () => {
    it('应该获取存储统计信息', async () => {
      const mockStats = {
        totalFiles: 100,
        totalSize: 1024000000,
        averageSize: 10240000,
        largestFile: 50000000
      };
      mockFileRepository.getStorageStats.mockResolvedValueOnce(mockStats);

      const result = await fileService.getStorageStats();

      expect(result.totalFiles).toBe(100);
      expect(result.formattedTotalSize).toContain('MB');
      expect(result.formattedAverageSize).toContain('MB');
      expect(result.formattedLargestFile).toContain('MB');
    });
  });

  describe('checkUploadPermission', () => {
    it('应该允许正常的上传', async () => {
      mockFileRepository.countUploadsInTimeRange.mockResolvedValueOnce(10);

      const result = await fileService.checkUploadPermission(1);

      expect(result.allowed).toBe(true);
      expect(mockFileRepository.countUploadsInTimeRange).toHaveBeenCalled();
    });

    it('应该在超过每日限制时拒绝上传', async () => {
      // 假设每小时50个，每天1200个
      mockFileRepository.countUploadsInTimeRange.mockResolvedValueOnce(1200);

      const result = await fileService.checkUploadPermission(1);

      expect(result.allowed).toBe(false);
      expect(result.error).toBe('今日上传次数已达上限');
    });

    it('应该在检查失败时返回错误', async () => {
      mockFileRepository.countUploadsInTimeRange.mockRejectedValueOnce(new Error('数据库错误'));

      const result = await fileService.checkUploadPermission(1);

      expect(result.allowed).toBe(false);
      expect(result.error).toBe('权限检查失败');
    });
  });
});