import { PasswordUtils } from '@/utils/password';

describe('PasswordUtils', () => {
  describe('hashPassword', () => {
    it('应该成功哈希密码', async () => {
      const password = 'TestPassword123';
      const hashedPassword = await PasswordUtils.hashPassword(password);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50);
    });

    it('相同密码应该生成不同的哈希值', async () => {
      const password = 'TestPassword123';
      const hash1 = await PasswordUtils.hashPassword(password);
      const hash2 = await PasswordUtils.hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });

    it('应该拒绝过短的密码', async () => {
      const shortPassword = '12345';
      
      await expect(PasswordUtils.hashPassword(shortPassword))
        .rejects.toThrow('密码长度必须在6-128个字符之间');
    });

    it('应该拒绝过长的密码', async () => {
      const longPassword = 'a'.repeat(129);
      
      await expect(PasswordUtils.hashPassword(longPassword))
        .rejects.toThrow('密码长度必须在6-128个字符之间');
    });
  });

  describe('verifyPassword', () => {
    it('应该验证正确的密码', async () => {
      const password = 'TestPassword123';
      const hashedPassword = await PasswordUtils.hashPassword(password);
      
      const isValid = await PasswordUtils.verifyPassword(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('应该拒绝错误的密码', async () => {
      const password = 'TestPassword123';
      const wrongPassword = 'WrongPassword123';
      const hashedPassword = await PasswordUtils.hashPassword(password);
      
      const isValid = await PasswordUtils.verifyPassword(wrongPassword, hashedPassword);
      expect(isValid).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('应该接受强密码', () => {
      const strongPasswords = [
        'Password123',
        'MyStr0ngP@ss',
        'Test123Pass',
        'Secure1Password'
      ];

      strongPasswords.forEach(password => {
        const result = PasswordUtils.validatePasswordStrength(password);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('应该拒绝弱密码', () => {
      const weakPasswords = [
        { password: 'password', expectedErrors: ['密码必须包含至少一个大写字母', '密码必须包含至少一个数字'] },
        { password: 'PASSWORD', expectedErrors: ['密码必须包含至少一个小写字母', '密码必须包含至少一个数字'] },
        { password: '12345678', expectedErrors: ['密码必须包含至少一个小写字母', '密码必须包含至少一个大写字母'] },
        { password: 'Pass1', expectedErrors: ['密码长度必须在6-128个字符之间'] },
        { password: 'password123', expectedErrors: ['密码必须包含至少一个大写字母'] },
        { password: 'PASSWORD123', expectedErrors: ['密码必须包含至少一个小写字母'] }
      ];

      weakPasswords.forEach(({ password, expectedErrors }) => {
        const result = PasswordUtils.validatePasswordStrength(password);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expectedErrors.forEach(expectedError => {
          expect(result.errors).toContain(expectedError);
        });
      });
    });
  });

  describe('generateRandomPassword', () => {
    it('应该生成指定长度的密码', () => {
      const lengths = [8, 12, 16, 20];
      
      lengths.forEach(length => {
        const password = PasswordUtils.generateRandomPassword(length);
        expect(password.length).toBe(length);
      });
    });

    it('应该生成符合强度要求的密码', () => {
      const password = PasswordUtils.generateRandomPassword();
      const validation = PasswordUtils.validatePasswordStrength(password);
      
      expect(validation.isValid).toBe(true);
    });

    it('应该生成不同的密码', () => {
      const password1 = PasswordUtils.generateRandomPassword();
      const password2 = PasswordUtils.generateRandomPassword();
      
      expect(password1).not.toBe(password2);
    });

    it('生成的密码应该包含必要的字符类型', () => {
      const password = PasswordUtils.generateRandomPassword(12);
      
      expect(/[a-z]/.test(password)).toBe(true); // 小写字母
      expect(/[A-Z]/.test(password)).toBe(true); // 大写字母
      expect(/\d/.test(password)).toBe(true);    // 数字
    });
  });

  describe('isCommonPassword', () => {
    it('应该识别常见密码', () => {
      const commonPasswords = [
        'password',
        'password123',
        '123456',
        'qwerty',
        'admin'
      ];

      commonPasswords.forEach(password => {
        expect(PasswordUtils.isCommonPassword(password)).toBe(true);
      });
    });

    it('应该接受非常见密码', () => {
      const uncommonPasswords = [
        'MyUniquePassword123',
        'VerySecurePass456',
        'CustomPassword789'
      ];

      uncommonPasswords.forEach(password => {
        expect(PasswordUtils.isCommonPassword(password)).toBe(false);
      });
    });

    it('应该不区分大小写检查常见密码', () => {
      expect(PasswordUtils.isCommonPassword('PASSWORD')).toBe(true);
      expect(PasswordUtils.isCommonPassword('Password')).toBe(true);
      expect(PasswordUtils.isCommonPassword('QWERTY')).toBe(true);
    });
  });

  describe('calculatePasswordStrength', () => {
    it('应该为强密码给出高分', () => {
      const strongPassword = 'MyVerySecurePassword123!';
      const result = PasswordUtils.calculatePasswordStrength(strongPassword);
      
      expect(result.score).toBeGreaterThan(70);
      expect(result.level).toBe('strong');
      expect(result.feedback.length).toBeLessThan(3);
    });

    it('应该为弱密码给出低分', () => {
      const weakPassword = 'password';
      const result = PasswordUtils.calculatePasswordStrength(weakPassword);
      
      expect(result.score).toBeLessThan(30);
      expect(result.level).toBe('weak');
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    it('应该为中等密码给出中等分数', () => {
      const fairPassword = 'Password123';
      const result = PasswordUtils.calculatePasswordStrength(fairPassword);
      
      expect(result.score).toBeGreaterThan(30);
      expect(result.score).toBeLessThan(80);
      expect(['fair', 'good']).toContain(result.level);
    });

    it('应该为常见密码扣分', () => {
      const commonPassword = 'password123';
      const result = PasswordUtils.calculatePasswordStrength(commonPassword);
      
      expect(result.feedback).toContain('避免使用常见密码');
      expect(result.score).toBeLessThan(50);
    });

    it('应该提供有用的反馈', () => {
      const incompletePassword = 'password'; // 缺少大写字母和数字
      const result = PasswordUtils.calculatePasswordStrength(incompletePassword);
      
      expect(result.feedback).toContain('添加大写字母');
      expect(result.feedback).toContain('添加数字');
    });
  });
});