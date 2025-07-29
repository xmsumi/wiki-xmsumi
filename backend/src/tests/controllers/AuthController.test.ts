import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { AuthController } from '@/controllers/AuthController';
import { AuthService } from '@/services/AuthService';
import { UserRole } from '@/types/user';

// Mock速率限制中间件
jest.mock('@/middleware/auth', () => ({
  ...jest.requireActual('@/middleware/auth'),
  rateLimit: () => (req: any, res: any, next: any) => next()
}));

// Mock AuthService
jest.mock('@/services/AuthService');
const mockAuthService = AuthService as jest.MockedClass<typeof AuthService>;

// 导入路由
import authRoutes from '@/routes/auth';

describe('AuthController', () => {
  let app: express.Application;
  let authServiceInstance: jest.Mocked<AuthService>;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/auth', authRoutes);

    authServiceInstance = {
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
      refreshToken: jest.fn(),
      validateToken: jest.fn(),
      getPasswordStrength: jest.fn(),
      generateRandomPassword: jest.fn()
    } as any;

    mockAuthService.mockImplementation(() => authServiceInstance);
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('应该成功登录用户', async () => {
      const loginData = {
        username: 'testuser',
        password: 'Password123'
      };

      const mockLoginResult = {
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          role: UserRole.VIEWER,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 900
      };

      authServiceInstance.login.mockResolvedValue(mockLoginResult);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toEqual(mockLoginResult.user);
      expect(response.body.data.accessToken).toBe(mockLoginResult.accessToken);
      expect(response.body.data.expiresIn).toBe(mockLoginResult.expiresIn);
      
      // 检查是否设置了refreshToken cookie
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('refreshToken=mock-refresh-token');
    });

    it('应该在登录失败时返回401', async () => {
      const loginData = {
        username: 'testuser',
        password: 'wrongpassword'
      };

      authServiceInstance.login.mockRejectedValue(new Error('用户名或密码错误'));

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('用户名或密码错误');
      expect(response.body.error.code).toBe('LOGIN_FAILED');
    });

    it('应该在数据验证失败时返回401', async () => {
      const invalidData = {
        username: '', // 空用户名
        password: 'Password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('LOGIN_FAILED');
    });
  });

  describe('POST /api/auth/register', () => {
    it('应该成功注册用户', async () => {
      const registerData = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'Password123'
      };

      const mockRegisterResult = {
        user: {
          id: 1,
          username: 'newuser',
          email: 'new@example.com',
          role: UserRole.VIEWER,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        message: '用户注册成功'
      };

      authServiceInstance.register.mockResolvedValue(mockRegisterResult);

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockRegisterResult);
    });

    it('应该在用户名已存在时返回409', async () => {
      const registerData = {
        username: 'existinguser',
        email: 'new@example.com',
        password: 'Password123'
      };

      authServiceInstance.register.mockRejectedValue(new Error('用户名已存在'));

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('用户名已存在');
      expect(response.body.error.code).toBe('REGISTRATION_FAILED');
    });

    it('应该在数据验证失败时返回400', async () => {
      const invalidData = {
        username: 'ab', // 用户名太短
        email: 'invalid-email',
        password: 'weak'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('REGISTRATION_FAILED');
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    it('应该成功刷新token', async () => {
      const mockRefreshResult = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 900
      };

      authServiceInstance.refreshToken.mockResolvedValue(mockRefreshResult);

      const response = await request(app)
        .post('/api/auth/refresh-token')
        .set('Cookie', ['refreshToken=old-refresh-token'])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBe(mockRefreshResult.accessToken);
      expect(response.body.data.expiresIn).toBe(mockRefreshResult.expiresIn);
      
      // 检查是否设置了新的refreshToken cookie
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('refreshToken=new-refresh-token');
    });

    it('应该在缺少刷新token时返回401', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('未提供刷新token');
      expect(response.body.error.code).toBe('MISSING_REFRESH_TOKEN');
    });

    it('应该在刷新token无效时返回401', async () => {
      authServiceInstance.refreshToken.mockRejectedValue(new Error('Token已过期'));

      const response = await request(app)
        .post('/api/auth/refresh-token')
        .set('Cookie', ['refreshToken=invalid-token'])
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Token已过期');
      expect(response.body.error.code).toBe('TOKEN_REFRESH_FAILED');
    });
  });

  describe('POST /api/auth/check-password-strength', () => {
    it('应该返回密码强度评估', async () => {
      const passwordData = {
        password: 'TestPassword123'
      };

      const mockStrengthResult = {
        score: 85,
        level: 'strong' as const,
        feedback: []
      };

      authServiceInstance.getPasswordStrength.mockReturnValue(mockStrengthResult);

      const response = await request(app)
        .post('/api/auth/check-password-strength')
        .send(passwordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockStrengthResult);
    });

    it('应该在缺少密码时返回400', async () => {
      const response = await request(app)
        .post('/api/auth/check-password-strength')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('密码是必填项');
      expect(response.body.error.code).toBe('MISSING_PASSWORD');
    });
  });

  describe('GET /api/auth/generate-password', () => {
    it('应该生成随机密码', async () => {
      const mockPassword = 'GeneratedPass123';
      authServiceInstance.generateRandomPassword.mockReturnValue(mockPassword);

      const response = await request(app)
        .get('/api/auth/generate-password')
        .query({ length: '16' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.password).toBe(mockPassword);
      expect(response.body.data.length).toBe(16);
    });

    it('应该使用默认长度生成密码', async () => {
      const mockPassword = 'DefaultPass123';
      authServiceInstance.generateRandomPassword.mockReturnValue(mockPassword);

      const response = await request(app)
        .get('/api/auth/generate-password')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.password).toBe(mockPassword);
      expect(response.body.data.length).toBe(12);
    });

    it('应该在无效长度时返回400', async () => {
      const response = await request(app)
        .get('/api/auth/generate-password')
        .query({ length: '200' }) // 超过最大长度
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('密码长度必须在6-128之间');
      expect(response.body.error.code).toBe('INVALID_PASSWORD_LENGTH');
    });
  });
});