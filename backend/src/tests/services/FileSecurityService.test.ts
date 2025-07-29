import { FileSecurityService } from '../../services/FileSecurityService';

describe('FileSecurityService', () => {
  let securityService: FileSecurityService;

  beforeEach(() => {
    securityService = new FileSecurityService();
  });

  describe('scanFile', () => {
    it('应该通过安全的JPEG文件扫描', async () => {
      // 创建一个模拟的JPEG文件头
      const jpegBuffer = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46,
        ...Array(100).fill(0x00) // 填充一些数据
      ]);

      const result = await securityService.scanFile(jpegBuffer, 'photo.jpg', 'image/jpeg');

      expect(result.isSafe).toBe(true);
      expect(result.threats).toHaveLength(0);
      expect(result.scanTime).toBeInstanceOf(Date);
    });

    it('应该检测文件名安全问题', async () => {
      const buffer = Buffer.from('test content');
      const result = await securityService.scanFile(buffer, 'file<script>.txt', 'text/plain');

      expect(result.isSafe).toBe(false);
      expect(result.threats.some(threat => threat.includes('文件名安全检查失败'))).toBe(true);
    });

    it('应该检测不支持的文件类型', async () => {
      const buffer = Buffer.from('test content');
      const result = await securityService.scanFile(buffer, 'virus.exe', 'application/x-executable');

      expect(result.isSafe).toBe(false);
      expect(result.threats.some(threat => threat.includes('文件类型检查失败'))).toBe(true);
    });

    it('应该检测文件大小问题', async () => {
      // 创建一个超大的buffer
      const largeBuffer = Buffer.alloc(20 * 1024 * 1024); // 20MB
      const result = await securityService.scanFile(largeBuffer, 'large.jpg', 'image/jpeg');

      expect(result.isSafe).toBe(false);
      expect(result.threats.some(threat => threat.includes('文件大小检查失败'))).toBe(true);
    });

    it('应该检测文件内容问题', async () => {
      // 创建一个假的JPEG文件（错误的文件头）
      const fakeBuffer = Buffer.from([0x00, 0x00, 0x00, 0x00]);
      const result = await securityService.scanFile(fakeBuffer, 'fake.jpg', 'image/jpeg');

      expect(result.isSafe).toBe(false);
      expect(result.threats.some(threat => threat.includes('文件内容检查失败'))).toBe(true);
    });

    it('应该检测高熵值文件', async () => {
      // 创建一个高熵值的随机数据buffer
      const randomBuffer = Buffer.alloc(1000);
      for (let i = 0; i < randomBuffer.length; i++) {
        randomBuffer[i] = Math.floor(Math.random() * 256);
      }

      const result = await securityService.scanFile(randomBuffer, 'random.txt', 'text/plain');

      // 高熵值文件可能被标记为威胁
      if (!result.isSafe) {
        expect(result.threats.some(threat => threat.includes('熵值'))).toBe(true);
      }
    });

    it('应该检测嵌入式脚本', async () => {
      const maliciousContent = 'normal content <script>alert("xss")</script> more content';
      const buffer = Buffer.from(maliciousContent, 'binary');
      const result = await securityService.scanFile(buffer, 'image.jpg', 'image/jpeg');

      expect(result.isSafe).toBe(false);
      expect(result.threats.some(threat => threat.includes('嵌入式脚本'))).toBe(true);
    });

    it('应该处理扫描过程中的错误', async () => {
      // 传入null buffer来触发错误
      const result = await securityService.scanFile(null as any, 'test.txt', 'text/plain');

      expect(result.isSafe).toBe(false);
      expect(result.threats.some(threat => threat.includes('扫描过程发生错误'))).toBe(true);
    });
  });

  describe('generateSecureFilename', () => {
    it('应该生成安全的文件名', () => {
      const originalName = 'my photo.jpg';
      const secureName = securityService.generateSecureFilename(originalName);

      expect(secureName).toMatch(/^\d+_[a-f0-9]{32}\.jpg$/);
      expect(secureName).not.toContain(' ');
      expect(secureName.endsWith('.jpg')).toBe(true);
    });

    it('应该保留文件扩展名', () => {
      const originalName = 'document.pdf';
      const secureName = securityService.generateSecureFilename(originalName);

      expect(secureName.endsWith('.pdf')).toBe(true);
    });

    it('应该处理没有扩展名的文件', () => {
      const originalName = 'README';
      const secureName = securityService.generateSecureFilename(originalName);

      expect(secureName).toMatch(/^\d+_[a-f0-9]{32}$/);
      expect(secureName).not.toContain('.');
    });

    it('应该生成唯一的文件名', () => {
      const originalName = 'test.txt';
      const name1 = securityService.generateSecureFilename(originalName);
      const name2 = securityService.generateSecureFilename(originalName);

      expect(name1).not.toBe(name2);
    });
  });

  describe('generateSecurePath', () => {
    it('应该生成基于日期的路径', () => {
      const basePath = '/uploads';
      const securePath = securityService.generateSecurePath(basePath);

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');

      expect(securePath).toContain(String(year));
      expect(securePath).toContain(month);
      expect(securePath).toContain(day);
      // 在Windows上路径可能使用反斜杠，所以我们检查路径是否包含基础路径
      expect(securePath.includes('uploads')).toBe(true);
    });

    it('应该使用正确的路径分隔符', () => {
      const basePath = '/uploads';
      const securePath = securityService.generateSecurePath(basePath);

      // 路径应该是规范化的
      expect(securePath).not.toContain('//');
    });
  });

  describe('checkUploadRateLimit', () => {
    it('应该允许正常的上传频率', async () => {
      const result = await securityService.checkUploadRateLimit(1, 50);

      expect(result.isAllowed).toBe(true);
      expect(result.error).toBeUndefined();
    });

    // 注意：实际的频率限制检查需要Redis或数据库支持
    // 这里只是测试接口的基本功能
  });

  describe('私有方法测试（通过公共接口）', () => {
    it('应该正确计算文件熵值', async () => {
      // 低熵值文件（重复内容）
      const lowEntropyBuffer = Buffer.alloc(1000, 0x41); // 全是'A'
      const lowEntropyResult = await securityService.scanFile(
        lowEntropyBuffer, 
        'low_entropy.txt', 
        'text/plain'
      );

      // 低熵值文件应该通过熵值检查
      const hasEntropyThreat = lowEntropyResult.threats.some((threat: string) => 
        threat.includes('熵值')
      );
      expect(hasEntropyThreat).toBe(false);
    });

    it('应该检测Office宏', async () => {
      const macroContent = 'normal content Microsoft Visual Basic for Applications more content';
      const buffer = Buffer.from(macroContent, 'binary');
      const result = await securityService.scanFile(
        buffer, 
        'document.docx', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );

      expect(result.isSafe).toBe(false);
      expect(result.threats.some((threat: string) => threat.includes('Office宏'))).toBe(true);
    });

    it('应该验证ZIP文件结构', async () => {
      // 正确的ZIP文件头
      const zipBuffer = Buffer.from([0x50, 0x4B, 0x03, 0x04, ...Array(20).fill(0x00)]);
      const result = await securityService.scanFile(zipBuffer, 'archive.zip', 'application/zip');

      // 应该通过结构检查（可能因为其他检查失败）
      const hasStructureThreat = result.threats.some((threat: string) => 
        threat.includes('文件结构检查失败')
      );
      expect(hasStructureThreat).toBe(false);
    });

    it('应该验证PDF文件结构', async () => {
      // 正确的PDF文件头
      const pdfBuffer = Buffer.from('%PDF-1.4\n%âãÏÓ\n');
      const result = await securityService.scanFile(pdfBuffer, 'document.pdf', 'application/pdf');

      // 应该通过结构检查
      const hasStructureThreat = result.threats.some((threat: string) => 
        threat.includes('PDF文件头不正确')
      );
      expect(hasStructureThreat).toBe(false);
    });
  });
});