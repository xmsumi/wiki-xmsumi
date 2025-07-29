import {
  createUserSchema,
  updateUserSchema,
  loginSchema,
  userIdSchema,
  queryUserSchema,
  validateData
} from '@/validators/userValidator';
import { UserRole, UserStatus } from '@/types/user';

describe('User Validators', () => {
  describe('createUserSchema', () => {
    it('应该验证有效的创建用户数据', () => {
      const validData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123',
        role: UserRole.VIEWER,
        avatar_url: 'https://example.com/avatar.jpg'
      };

      const result = validateData(createUserSchema, validData) as any;

      expect(result.username).toBe(validData.username);
      expect(result.email).toBe(validData.email);
      expect(result.password).toBe(validData.password);
      expect(result.role).toBe(validData.role);
      expect(result.avatar_url).toBe(validData.avatar_url);
    });

    it('应该使用默认角色', () => {
      const validData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123'
      };

      const result = validateData(createUserSchema, validData) as any;

      expect(result.role).toBe(UserRole.VIEWER);
    });
  });

  describe('loginSchema', () => {
    it('应该验证有效的登录数据', () => {
      const validData = {
        username: 'testuser',
        password: 'password123'
      };

      const result = validateData(loginSchema, validData) as any;

      expect(result.username).toBe(validData.username);
      expect(result.password).toBe(validData.password);
    });
  });
});