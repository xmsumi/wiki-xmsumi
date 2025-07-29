import { User } from '@/models/User';
import { UserEntity, UserRole, UserStatus, CreateUserRequest, UpdateUserRequest } from '@/types/user';

describe('User Model', () => {
  const mockUserEntity: UserEntity = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    password_hash: '$2a$12$hashedpassword',
    role: UserRole.VIEWER,
    is_active: true,
    avatar_url: 'https://example.com/avatar.jpg',
    last_login_at: new Date('2024-01-01T10:00:00Z'),
    login_attempts: 0,
    locked_until: undefined,
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z')
  };

  describe('构造函数', () => {
    it('应该正确创建用户实例', () => {
      const user = new User(mockUserEntity);
      
      expect(user.id).toBe(mockUserEntity.id);
      expect(user.username).toBe(mockUserEntity.username);
      expect(user.email).toBe(mockUserEntity.email);
      expect(user.role).toBe(mockUserEntity.role);
      expect(user.is_active).toBe(mockUserEntity.is_active);
    });
  });

  describe('fromCreateRequest', () => {
    it('应该从创建请求正确生成用户实体数据', async () => {
      const createRequest: CreateUserRequest = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'Password123',
        role: UserRole.EDITOR,
        avatar_url: 'https://example.com/new-avatar.jpg'
      };

      const userEntity = await User.fromCreateRequest(createRequest);

      expect(userEntity.username).toBe(createRequest.username);
      expect(userEntity.email).toBe(createRequest.email);
      expect(userEntity.role).toBe(createRequest.role);
      expect(userEntity.is_active).toBe(true);
      expect(userEntity.avatar_url).toBe(createRequest.avatar_url);
      expect(userEntity.password_hash).toBeDefined();
      expect(userEntity.password_hash).not.toBe(createRequest.password);
      expect(userEntity.created_at).toBeInstanceOf(Date);
      expect(userEntity.updated_at).toBeInstanceOf(Date);
    });

    it('应该使用默认角色当未指定角色时', async () => {
      const createRequest: CreateUserRequest = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'Password123'
      };

      const userEntity = await User.fromCreateRequest(createRequest);

      expect(userEntity.role).toBe(UserRole.VIEWER);
    });
  });

  describe('fromUpdateRequest', () => {
    it('应该从更新请求正确生成更新数据', async () => {
      const updateRequest: UpdateUserRequest = {
        username: 'updateduser',
        email: 'updated@example.com',
        role: UserRole.ADMIN
      };

      const updateData = await User.fromUpdateRequest(updateRequest);

      expect(updateData.username).toBe(updateRequest.username);
      expect(updateData.email).toBe(updateRequest.email);
      expect(updateData.role).toBe(updateRequest.role);
      expect(updateData.updated_at).toBeInstanceOf(Date);
    });

    it('应该正确处理密码更新', async () => {
      const updateRequest: UpdateUserRequest = {
        password: 'NewPassword123'
      };

      const updateData = await User.fromUpdateRequest(updateRequest);

      expect(updateData.password_hash).toBeDefined();
      expect(updateData.password_hash).not.toBe(updateRequest.password);
    });

    it('应该只包含提供的字段', async () => {
      const updateRequest: UpdateUserRequest = {
        username: 'updateduser'
      };

      const updateData = await User.fromUpdateRequest(updateRequest);

      expect(updateData.username).toBe(updateRequest.username);
      expect(updateData.email).toBeUndefined();
      expect(updateData.role).toBeUndefined();
    });
  });

  describe('toResponse', () => {
    it('应该返回不包含敏感信息的用户响应', () => {
      const user = new User(mockUserEntity);
      const response = user.toResponse();

      expect(response.id).toBe(user.id);
      expect(response.username).toBe(user.username);
      expect(response.email).toBe(user.email);
      expect(response.role).toBe(user.role);
      expect(response.is_active).toBe(user.is_active);
      expect(response).not.toHaveProperty('password_hash');
    });
  });

  describe('verifyPassword', () => {
    it('应该验证正确的密码', async () => {
      // 创建一个真实的哈希密码用于测试
      const password = 'TestPassword123';
      const hashedPassword = await User.hashPassword(password);
      
      const userEntity = {
        ...mockUserEntity,
        password_hash: hashedPassword
      };
      
      const user = new User(userEntity);
      const isValid = await user.verifyPassword(password);

      expect(isValid).toBe(true);
    });

    it('应该拒绝错误的密码', async () => {
      const password = 'TestPassword123';
      const wrongPassword = 'WrongPassword123';
      const hashedPassword = await User.hashPassword(password);
      
      const userEntity = {
        ...mockUserEntity,
        password_hash: hashedPassword
      };
      
      const user = new User(userEntity);
      const isValid = await user.verifyPassword(wrongPassword);

      expect(isValid).toBe(false);
    });
  });

  describe('updateLastLogin', () => {
    it('应该更新最后登录时间', () => {
      const user = new User(mockUserEntity);
      const originalLastLogin = user.last_login_at;
      const originalUpdatedAt = user.updated_at;

      user.updateLastLogin();

      expect(user.last_login_at).not.toBe(originalLastLogin);
      expect(user.updated_at).not.toBe(originalUpdatedAt);
      expect(user.last_login_at).toBeInstanceOf(Date);
      expect(user.updated_at).toBeInstanceOf(Date);
    });
  });

  describe('状态检查方法', () => {
    it('isActive应该正确检查用户状态', () => {
      const activeUser = new User({ ...mockUserEntity, is_active: true });
      const inactiveUser = new User({ ...mockUserEntity, is_active: false });

      expect(activeUser.isActive()).toBe(true);
      expect(inactiveUser.isActive()).toBe(false);
    });

    it('isAdmin应该正确检查管理员权限', () => {
      const adminUser = new User({ ...mockUserEntity, role: UserRole.ADMIN });
      const regularUser = new User({ ...mockUserEntity, role: UserRole.VIEWER });

      expect(adminUser.isAdmin()).toBe(true);
      expect(regularUser.isAdmin()).toBe(false);
    });

    it('canEdit应该正确检查编辑权限', () => {
      const adminUser = new User({ ...mockUserEntity, role: UserRole.ADMIN });
      const editorUser = new User({ ...mockUserEntity, role: UserRole.EDITOR });
      const regularUser = new User({ ...mockUserEntity, role: UserRole.VIEWER });

      expect(adminUser.canEdit()).toBe(true);
      expect(editorUser.canEdit()).toBe(true);
      expect(regularUser.canEdit()).toBe(false);
    });
  });

  describe('静态方法', () => {
    describe('hashPassword', () => {
      it('应该生成哈希密码', async () => {
        const password = 'TestPassword123';
        const hashedPassword = await User.hashPassword(password);

        expect(hashedPassword).toBeDefined();
        expect(hashedPassword).not.toBe(password);
        expect(hashedPassword.length).toBeGreaterThan(50);
      });

      it('相同密码应该生成不同的哈希值', async () => {
        const password = 'TestPassword123';
        const hash1 = await User.hashPassword(password);
        const hash2 = await User.hashPassword(password);

        expect(hash1).not.toBe(hash2);
      });
    });

    describe('validatePasswordStrength', () => {
      it('应该接受强密码', () => {
        const strongPasswords = [
          'Password123',
          'MyStr0ngP@ss',
          'Test123Pass'
        ];

        strongPasswords.forEach(password => {
          expect(User.validatePasswordStrength(password)).toBe(true);
        });
      });

      it('应该拒绝弱密码', () => {
        const weakPasswords = [
          'password',      // 没有大写字母和数字
          'PASSWORD',      // 没有小写字母和数字
          '12345678',      // 没有字母
          'Pass1',         // 太短
          'password123',   // 没有大写字母
          'PASSWORD123'    // 没有小写字母
        ];

        weakPasswords.forEach(password => {
          expect(User.validatePasswordStrength(password)).toBe(false);
        });
      });
    });

    describe('generateRandomPassword', () => {
      it('应该生成指定长度的密码', () => {
        const password = User.generateRandomPassword(16);
        expect(password.length).toBe(16);
      });

      it('应该生成符合强度要求的密码', () => {
        const password = User.generateRandomPassword();
        expect(User.validatePasswordStrength(password)).toBe(true);
      });

      it('应该生成不同的密码', () => {
        const password1 = User.generateRandomPassword();
        const password2 = User.generateRandomPassword();
        expect(password1).not.toBe(password2);
      });
    });
  });
});