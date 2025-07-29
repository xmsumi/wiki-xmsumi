import { File } from '../../models/File';
import { FileMetadata } from '../../types/file';

describe('File Model', () => {
  const mockFileData: FileMetadata = {
    id: 1,
    filename: 'test_123456.jpg',
    originalName: 'photo.jpg',
    filePath: '/uploads/2024/01/01/test_123456.jpg',
    fileSize: 1024000,
    mimeType: 'image/jpeg',
    uploaderId: 1,
    createdAt: new Date('2024-01-01T00:00:00Z')
  };

  describe('构造函数', () => {
    it('应该正确初始化文件对象', () => {
      const file = new File(mockFileData);

      expect(file.id).toBe(1);
      expect(file.filename).toBe('test_123456.jpg');
      expect(file.originalName).toBe('photo.jpg');
      expect(file.filePath).toBe('/uploads/2024/01/01/test_123456.jpg');
      expect(file.fileSize).toBe(1024000);
      expect(file.mimeType).toBe('image/jpeg');
      expect(file.uploaderId).toBe(1);
      expect(file.createdAt).toEqual(new Date('2024-01-01T00:00:00Z'));
    });

    it('应该使用默认值初始化空对象', () => {
      const file = new File({});

      expect(file.id).toBe(0);
      expect(file.filename).toBe('');
      expect(file.originalName).toBe('');
      expect(file.filePath).toBe('');
      expect(file.fileSize).toBe(0);
      expect(file.mimeType).toBe('');
      expect(file.uploaderId).toBe(0);
      expect(file.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('validate', () => {
    it('应该验证有效的文件数据', () => {
      const file = new File(mockFileData);
      const result = file.validate();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该检测空文件名', () => {
      const file = new File({ ...mockFileData, filename: '' });
      const result = file.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('文件名不能为空');
    });

    it('应该检测空原始文件名', () => {
      const file = new File({ ...mockFileData, originalName: '' });
      const result = file.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('原始文件名不能为空');
    });

    it('应该检测空文件路径', () => {
      const file = new File({ ...mockFileData, filePath: '' });
      const result = file.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('文件路径不能为空');
    });

    it('应该检测无效文件大小', () => {
      const file = new File({ ...mockFileData, fileSize: 0 });
      const result = file.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('文件大小必须大于0');
    });

    it('应该检测空MIME类型', () => {
      const file = new File({ ...mockFileData, mimeType: '' });
      const result = file.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('文件类型不能为空');
    });

    it('应该检测无效上传者ID', () => {
      const file = new File({ ...mockFileData, uploaderId: 0 });
      const result = file.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('上传者ID无效');
    });

    it('应该返回多个验证错误', () => {
      const file = new File({
        ...mockFileData,
        filename: '',
        originalName: '',
        fileSize: 0
      });
      const result = file.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
    });
  });

  describe('getFileExtension', () => {
    it('应该正确提取文件扩展名', () => {
      const file = new File({ ...mockFileData, originalName: 'photo.jpg' });
      expect(file.getFileExtension()).toBe('jpg');
    });

    it('应该处理多个点的文件名', () => {
      const file = new File({ ...mockFileData, originalName: 'my.photo.backup.jpg' });
      expect(file.getFileExtension()).toBe('jpg');
    });

    it('应该处理没有扩展名的文件', () => {
      const file = new File({ ...mockFileData, originalName: 'README' });
      expect(file.getFileExtension()).toBe('');
    });

    it('应该返回小写扩展名', () => {
      const file = new File({ ...mockFileData, originalName: 'photo.JPG' });
      expect(file.getFileExtension()).toBe('jpg');
    });
  });

  describe('isImage', () => {
    it('应该识别图片文件', () => {
      const file = new File({ ...mockFileData, mimeType: 'image/jpeg' });
      expect(file.isImage()).toBe(true);
    });

    it('应该识别PNG图片', () => {
      const file = new File({ ...mockFileData, mimeType: 'image/png' });
      expect(file.isImage()).toBe(true);
    });

    it('应该识别非图片文件', () => {
      const file = new File({ ...mockFileData, mimeType: 'application/pdf' });
      expect(file.isImage()).toBe(false);
    });
  });

  describe('isDocument', () => {
    it('应该识别PDF文档', () => {
      const file = new File({ ...mockFileData, mimeType: 'application/pdf' });
      expect(file.isDocument()).toBe(true);
    });

    it('应该识别文本文件', () => {
      const file = new File({ ...mockFileData, mimeType: 'text/plain' });
      expect(file.isDocument()).toBe(true);
    });

    it('应该识别Word文档', () => {
      const file = new File({ 
        ...mockFileData, 
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      expect(file.isDocument()).toBe(true);
    });

    it('应该识别非文档文件', () => {
      const file = new File({ ...mockFileData, mimeType: 'image/jpeg' });
      expect(file.isDocument()).toBe(false);
    });
  });

  describe('getFormattedSize', () => {
    it('应该格式化字节大小', () => {
      const file = new File({ ...mockFileData, fileSize: 512 });
      expect(file.getFormattedSize()).toBe('512.00 B');
    });

    it('应该格式化KB大小', () => {
      const file = new File({ ...mockFileData, fileSize: 1536 }); // 1.5KB
      expect(file.getFormattedSize()).toBe('1.50 KB');
    });

    it('应该格式化MB大小', () => {
      const file = new File({ ...mockFileData, fileSize: 1572864 }); // 1.5MB
      expect(file.getFormattedSize()).toBe('1.50 MB');
    });

    it('应该格式化GB大小', () => {
      const file = new File({ ...mockFileData, fileSize: 1610612736 }); // 1.5GB
      expect(file.getFormattedSize()).toBe('1.50 GB');
    });
  });

  describe('toJSON', () => {
    it('应该返回正确的JSON对象', () => {
      const file = new File(mockFileData);
      const json = file.toJSON();

      expect(json).toEqual(mockFileData);
      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('filename');
      expect(json).toHaveProperty('originalName');
      expect(json).toHaveProperty('filePath');
      expect(json).toHaveProperty('fileSize');
      expect(json).toHaveProperty('mimeType');
      expect(json).toHaveProperty('uploaderId');
      expect(json).toHaveProperty('createdAt');
    });
  });
});