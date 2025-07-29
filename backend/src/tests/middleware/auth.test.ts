import { Request, Response, NextFunction } from 'express';
import { authenticate, authorize, requireAdmin, AuthenticatedRequest } from '@/middleware/auth';
import { JwtUtils } from '@/utils/jwt';
import { UserRepository } from '@/repositories/UserRepository';
import { User } from '@/models/User';
import { UserRole } from '@/types/user';

// Mock依赖
jest.mock('@/utils/jwt');
jest.mock('@/repositories/UserRepository');

const mockJwtUtils = JwtUtils as jest.Mocked<typeof JwtUtils>;
const mockUserRepository = UserRepository as jest.MockedClass<typeof UserRepository>;

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockUserRepositoryInstance: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockRequest = {
      headers: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    
    mockUserRepositoryInstance = {
      findById: jest.fn()
    } as any;
    
    mockUserRepository.mockImplementation(() => mockUserRepositoryInstance);
    
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('应该在缺少Authorization头时返回401', async () => {
      await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: '未提供认证token',
          code: 'MISSING_TOKEN'
        },
        timestamp: expect.any(String)
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('应该在Authorization头格式错误时返回401', async () => {
      mockRequest.headers!.authorization = 'InvalidFormat token';

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: '未提供认证token',
          code: 'MISSING_TOKEN'
        },
        timestamp: expect.any(String)
      });
    });

    it('应该在token无效时返回401', async () => {
      mockRequest.headers!.authorization = 'Bearer invalid-token';
      mockJwtUtils.verifyAccessToken.mockImplementation(() => {
        throw new Error('无效的token');
      });

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: '无效的token',
          code: 'INVALID_TOKEN'
        },
        timestamp: expect.any(String)
      });
    });

    it('应该在用户不存在时返回401', async () => {
      mockRequest.headers!.authorization = 'Bearer valid-token';
      mockJwtUtils.verifyAccessToken.mockReturnValue({
        userId: 1,
        username: 'testuser',
        role: UserRole.VIEWER,
        iat: 123456,
        exp: 789012
      });
      mockUserRepositoryInstance.findById.mockResolvedValue(null);

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: '用户不存在',
          code: 'USER_NOT_FOUND'
        },
        timestamp: expect.any(String)
      });
    });

    it('应该在用户未激活时返回401', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: UserRole.VIEWER,
        isActive: jest.fn().mockReturnValue(false)
      } as any;

      mockRequest.headers!.authorization = 'Bearer valid-token';
      mockJwtUtils.verifyAccessToken.mockReturnValue({
        userId: 1,
        username: 'testuser',
        role: UserRole.VIEWER,
        iat: 123456,
        exp: 789012
      });
      mockUserRepositoryInstance.findById.mockResolvedValue(mockUser);

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: '用户账户已被禁用',
          code: 'USER_INACTIVE'
        },
        timestamp: expect.any(String)
      });
    });

    it('应该在认证成功时设置用户信息并调用next', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: UserRole.VIEWER,
        isActive: jest.fn().mockReturnValue(true)
      } as any;

      mockRequest.headers!.authorization = 'Bearer valid-token';
      mockJwtUtils.verifyAccessToken.mockReturnValue({
        userId: 1,
        username: 'testuser',
        role: UserRole.VIEWER,
        iat: 123456,
        exp: 789012
      });
      mockUserRepositoryInstance.findById.mockResolvedValue(mockUser);

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockRequest.user).toEqual({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: UserRole.VIEWER
      });
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('authorize', () => {
    it('应该在用户未认证时返回401', () => {
      const authorizeMiddleware = authorize(UserRole.ADMIN);
      
      authorizeMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: '需要认证',
          code: 'AUTHENTICATION_REQUIRED'
        },
        timestamp: expect.any(String)
      });
    });

    it('应该在用户权限不足时返回403', () => {
      mockRequest.user = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: UserRole.VIEWER
      };

      const authorizeMiddleware = authorize(UserRole.ADMIN);
      
      authorizeMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: '权限不足',
          code: 'INSUFFICIENT_PERMISSIONS',
          details: {
            required: [UserRole.ADMIN],
            current: UserRole.VIEWER
          }
        },
        timestamp: expect.any(String)
      });
    });

    it('应该在用户有足够权限时调用next', () => {
      mockRequest.user = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: UserRole.ADMIN
      };

      const authorizeMiddleware = authorize(UserRole.ADMIN);
      
      authorizeMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('应该支持多个允许的角色', () => {
      mockRequest.user = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: UserRole.EDITOR
      };

      const authorizeMiddleware = authorize(UserRole.ADMIN, UserRole.EDITOR);
      
      authorizeMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    it('应该只允许管理员访问', () => {
      mockRequest.user = {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        role: UserRole.ADMIN
      };

      requireAdmin(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('应该拒绝非管理员用户', () => {
      mockRequest.user = {
        id: 1,
        username: 'user',
        email: 'user@example.com',
        role: UserRole.VIEWER
      };

      requireAdmin(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});