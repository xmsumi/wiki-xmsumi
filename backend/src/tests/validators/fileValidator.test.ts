import { FileValidator } from '../../validators/fileValidator';
import { DEFAULT_FILE_CONFIG } from '../../types/file';

describe('FileValidator', () => {
  let validator: FileValidator;

  beforeEach(() => {
    validator = new FileValidator();
  });

  describe('validateFileType', () => {
    it('应该允许有效的图片类型', () => {
      const result = validator.validateFileType('image/jpeg', 'photo.jpg');
      expect(result.isValid).toBe(true);
    });

    it('应该允许有效的PDF文件', () => {
      const result = validator.validateFileType('application/pdf', 'document.pdf');
      expect(result.isValid).toBe(true);
    });

    it('应该拒绝不支持的文件类型', () => {
      const result = validator.validateFileType('application/x-executable', 'virus.exe');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('不支持的文件类型');
    });

    it('应该检测MIME类型与扩展名不匹配', () => {
      const result = validator.validateFileType('image/jpeg', 'document.pdf');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('文件扩展名与类型不匹配');
    });

    it('应该允许没有明确扩展名映射的文件', () => {
      const result = validator.validateFileType('text/plain', 'README');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateFileSize', () => {
    it('应该允许正常大小的文件', () => {
      const result = validator.validateFileSize(1024 * 1024); // 1MB
      expect(result.isValid).toBe(true);
    });

    it('应该拒绝超大文件', () => {
      const result = validator.validateFileSize(DEFAULT_FILE_CONFIG.maxFileSize + 1);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('文件大小超出限制');
    });

    it('应该拒绝零大小文件', () => {
      const result = validator.validateFileSize(0);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('文件大小无效');
    });

    it('应该拒绝负数大小', () => {
      const result = validator.validateFileSize(-1);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('文件大小无效');
    });
  });

  describe('validateFileName', () => {
    it('应该允许正常的文件名', () => {
      const result = validator.validateFileName('document.pdf');
      expect(result.isValid).toBe(true);
    });

    it('应该允许中文文件名', () => {
      const result = validator.validateFileName('文档.pdf');
      expect(result.isValid).toBe(true);
    });

    it('应该拒绝过长的文件名', () => {
      const longName = 'a'.repeat(256) + '.txt';
      const result = validator.validateFileName(longName);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('文件名过长');
    });

    it('应该拒绝包含危险字符的文件名', () => {
      const dangerousNames = [
        'file<script>.txt',
        'file>redirect.txt',
        'file:stream.txt',
        'file"quote.txt',
        'file/path.txt',
        'file\\path.txt',
        'file|pipe.txt',
        'file?query.txt',
        'file*wildcard.txt'
      ];

      dangerousNames.forEach(name => {
        const result = validator.validateFileName(name);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('文件名包含非法字符');
      });
    });

    it('应该拒绝Windows保留名称', () => {
      const reservedNames = ['CON.txt', 'PRN.txt', 'AUX.txt', 'NUL.txt', 'COM1.txt', 'LPT1.txt'];

      reservedNames.forEach(name => {
        const result = validator.validateFileName(name);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('文件名使用了系统保留名称');
      });
    });
  });

  describe('validateFileContent', () => {
    it('应该验证JPEG文件头', async () => {
      // JPEG文件头: FF D8 FF
      const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
      const result = await validator.validateFileContent(jpegBuffer, 'image/jpeg');
      expect(result.isValid).toBe(true);
    });

    it('应该验证PNG文件头', async () => {
      // PNG文件头: 89 50 4E 47
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      const result = await validator.validateFileContent(pngBuffer, 'image/png');
      expect(result.isValid).toBe(true);
    });

    it('应该拒绝文件头不匹配的文件', async () => {
      // 错误的JPEG文件头
      const fakeBuffer = Buffer.from([0x00, 0x00, 0x00, 0x00]);
      const result = await validator.validateFileContent(fakeBuffer, 'image/jpeg');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('文件内容与声明类型不匹配');
    });

    it('应该检测文本文件中的恶意脚本', async () => {
      const maliciousContent = '<script>alert("xss")</script>';
      const buffer = Buffer.from(maliciousContent, 'utf8');
      const result = await validator.validateFileContent(buffer, 'text/html');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('文件包含潜在恶意脚本');
    });

    it('应该检测JavaScript代码', async () => {
      const jsContent = 'javascript:alert("xss")';
      const buffer = Buffer.from(jsContent, 'utf8');
      const result = await validator.validateFileContent(buffer, 'text/plain');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('文件包含潜在恶意脚本');
    });

    it('应该允许正常的文本内容', async () => {
      const normalContent = '这是一个正常的文档内容。';
      const buffer = Buffer.from(normalContent, 'utf8');
      const result = await validator.validateFileContent(buffer, 'text/plain');
      expect(result.isValid).toBe(true);
    });

    it('应该允许没有魔数检查的文件类型', async () => {
      const buffer = Buffer.from('normal content', 'utf8');
      const result = await validator.validateFileContent(buffer, 'text/plain');
      expect(result.isValid).toBe(true);
    });
  });

  describe('自定义配置', () => {
    it('应该使用自定义的文件大小限制', () => {
      const customValidator = new FileValidator({
        maxFileSize: 1024 // 1KB
      });

      const result = customValidator.validateFileSize(2048); // 2KB
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('文件大小超出限制');
    });

    it('应该使用自定义的允许文件类型', () => {
      const customValidator = new FileValidator({
        allowedMimeTypes: ['image/jpeg'] // 只允许JPEG
      });

      const pngResult = customValidator.validateFileType('image/png', 'image.png');
      expect(pngResult.isValid).toBe(false);

      const jpegResult = customValidator.validateFileType('image/jpeg', 'image.jpg');
      expect(jpegResult.isValid).toBe(true);
    });
  });
});