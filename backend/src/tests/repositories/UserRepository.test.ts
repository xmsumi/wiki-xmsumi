import { UserRepository } from '@/repositories/UserRepository';
import { User } from '@/models/User';
import { UserRole, CreateUserRequest, UpdateUserRequest } from '@/types/user';
import { db } from '@/config/database';

// Mock数据库连接
jest.mock('@/config/database');
const mockDb = db as jest.Mocked<typeof db>;

describe('UserRepository', () => {
  let userRepository: UserRepository;

  beforeEach(() => {
    userRepository = new UserRepository();
    jest.clearAllMocks();
  });

  const mockUserData = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    password_hash: '$2a$12$hashedpassword',
    role: UserRole.VIEWER,
    is_active: true,
    avatar_url: 'https://example.com/avatar.jpg',
    last_login_at: new Date('2024-01-01T10:00:00Z'),
    login_attempts: 0,
    locked_until: null,
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z')
  };

  describe('create', () => {
    it('应该成功创建用户', async () => {
      const createRequest: CreateUserRequest = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'Password123',
        role: UserRole.VIEWER
      };

      // Mock插入操作
      mockDb.query.mockResolvedValueOnce({ insertId: 1 });
      // Mock查找创建的用户
      mockDb.query.mockResolvedValueOnce([mockUserData]);

      const result = await userRepository.create(createRequest);

      expect(result).toBeInstanceOf(User);
      expect(result.username).toBe(createRequest.username);
      expect(result.email).toBe(createRequest.email);
      expect(mockDb.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('findById', () => {
    it('应该根据ID找到用户', async () => {
      mockDb.query.mockResolvedValueOnce([mockUserData]);

      const result = await userRepository.findById(1);

      expect(result).toBeInstanceOf(User);
      expect(result?.id).toBe(1);
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = ?',
        [1]
      );
    });

    it('应该在用户不存在时返回null', async () => {
      mockDb.query.mockResolvedValueOnce([]);

      const result = await userRepository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('应该根据用户名找到用户', async () => {
      mockDb.query.mockResolvedValueOnce([mockUserData]);

      const result = await userRepository.findByUsername('testuser');

      expect(result).toBeInstanceOf(User);
      expect(result?.username).toBe('testuser');
    });
  });

  describe('countByRole', () => {
    it('应该统计指定角色的用户数量', async () => {
      mockDb.query.mockResolvedValueOnce([{ count: 5 }]);

      const result = await userRepository.countByRole(UserRole.VIEWER);

      expect(result).toBe(5);
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM users WHERE role = ? AND is_active = ?',
        [UserRole.VIEWER, true]
      );
    });
  });

  describe('countActiveUsers', () => {
    it('应该统计活跃用户数量', async () => {
      mockDb.query.mockResolvedValueOnce([{ count: 10 }]);

      const result = await userRepository.countActiveUsers();

      expect(result).toBe(10);
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM users WHERE is_active = ?',
        [true]
      );
    });
  });
});