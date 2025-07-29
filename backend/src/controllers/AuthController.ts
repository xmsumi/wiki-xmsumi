import { Request, Response } from 'express';
import { AuthService } from '@/services/AuthService';
import { AuthenticatedRequest } from '@/middleware/auth';
import { 
  validateData, 
  createUserSchema, 
  loginSchema, 
  updateUserSchema 
} from '@/validators/userValidator';
import { CreateUserRequest, LoginCredentials, UpdateUserRequest } from '@/types/user';
import { logger } from '@/utils/logger';

/**
 * 认证控制器
 */
export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * 用户登录
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      // 验证请求数据
      const credentials = validateData<LoginCredentials>(loginSchema, req.body);

      // 执行登录
      const loginResult = await this.authService.login(credentials);

      // 设置刷新token到HttpOnly Cookie
      res.cookie('refreshToken', loginResult.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7天
      });

      res.status(200).json({
        success: true,
        data: {
          user: loginResult.user,
          accessToken: loginResult.accessToken,
          expiresIn: loginResult.expiresIn
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('登录失败:', error);
      const errorMessage = error instanceof Error ? error.message : '登录失败';
      
      res.status(401).json({
        success: false,
        error: {
          message: errorMessage,
          code: 'LOGIN_FAILED'
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * 用户注册
   */
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      // 验证请求数据
      const userData = validateData<CreateUserRequest>(createUserSchema, req.body);

      // 执行注册
      const registerResult = await this.authService.register(userData);

      res.status(201).json({
        success: true,
        data: registerResult,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('注册失败:', error);
      const errorMessage = error instanceof Error ? error.message : '注册失败';
      
      // 根据错误类型返回不同的状态码
      let statusCode = 400;
      if (errorMessage.includes('已存在') || errorMessage.includes('已被使用')) {
        statusCode = 409; // Conflict
      }

      res.status(statusCode).json({
        success: false,
        error: {
          message: errorMessage,
          code: 'REGISTRATION_FAILED'
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * 用户注销
   */
  logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      const accessToken = authHeader?.substring(7); // 移除 'Bearer ' 前缀
      const refreshToken = req.cookies.refreshToken;

      if (accessToken) {
        await this.authService.logout(accessToken, refreshToken);
      }

      // 清除刷新token cookie
      res.clearCookie('refreshToken');

      res.status(200).json({
        success: true,
        data: {
          message: '注销成功'
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('注销失败:', error);
      
      // 即使注销失败，也清除cookie
      res.clearCookie('refreshToken');
      
      res.status(200).json({
        success: true,
        data: {
          message: '注销成功'
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * 获取用户信息
   */
  getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            message: '用户未认证',
            code: 'UNAUTHENTICATED'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const userProfile = await this.authService.getProfile(req.user.id);

      res.status(200).json({
        success: true,
        data: userProfile,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('获取用户信息失败:', error);
      const errorMessage = error instanceof Error ? error.message : '获取用户信息失败';
      
      res.status(500).json({
        success: false,
        error: {
          message: errorMessage,
          code: 'PROFILE_FETCH_FAILED'
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * 更新用户信息
   */
  updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            message: '用户未认证',
            code: 'UNAUTHENTICATED'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      // 验证请求数据（排除密码字段）
      const { password, ...updateData } = req.body;
      const validatedData = validateData<Omit<UpdateUserRequest, 'password'>>(
        updateUserSchema.fork(['password'], (schema) => schema.forbidden()),
        updateData
      );

      const updatedUser = await this.authService.updateProfile(req.user.id, validatedData);

      res.status(200).json({
        success: true,
        data: updatedUser,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('更新用户信息失败:', error);
      const errorMessage = error instanceof Error ? error.message : '更新用户信息失败';
      
      let statusCode = 400;
      if (errorMessage.includes('已被使用')) {
        statusCode = 409; // Conflict
      }

      res.status(statusCode).json({
        success: false,
        error: {
          message: errorMessage,
          code: 'PROFILE_UPDATE_FAILED'
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * 修改密码
   */
  changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            message: '用户未认证',
            code: 'UNAUTHENTICATED'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          error: {
            message: '当前密码和新密码都是必填项',
            code: 'MISSING_PASSWORDS'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      await this.authService.changePassword(req.user.id, currentPassword, newPassword);

      res.status(200).json({
        success: true,
        data: {
          message: '密码修改成功'
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('修改密码失败:', error);
      const errorMessage = error instanceof Error ? error.message : '修改密码失败';
      
      let statusCode = 400;
      if (errorMessage.includes('当前密码错误')) {
        statusCode = 401;
      }

      res.status(statusCode).json({
        success: false,
        error: {
          message: errorMessage,
          code: 'PASSWORD_CHANGE_FAILED'
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * 刷新访问token
   */
  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        res.status(401).json({
          success: false,
          error: {
            message: '未提供刷新token',
            code: 'MISSING_REFRESH_TOKEN'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const tokenResult = await this.authService.refreshToken(refreshToken);

      // 设置新的刷新token到Cookie
      res.cookie('refreshToken', tokenResult.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7天
      });

      res.status(200).json({
        success: true,
        data: {
          accessToken: tokenResult.accessToken,
          expiresIn: tokenResult.expiresIn
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('刷新token失败:', error);
      const errorMessage = error instanceof Error ? error.message : '刷新token失败';
      
      // 清除无效的刷新token
      res.clearCookie('refreshToken');
      
      res.status(401).json({
        success: false,
        error: {
          message: errorMessage,
          code: 'TOKEN_REFRESH_FAILED'
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * 验证token有效性
   */
  validateToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(400).json({
          success: false,
          error: {
            message: '未提供token',
            code: 'MISSING_TOKEN'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const token = authHeader.substring(7);
      const validationResult = await this.authService.validateToken(token);

      res.status(200).json({
        success: true,
        data: validationResult,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('验证token失败:', error);
      
      res.status(500).json({
        success: false,
        error: {
          message: '验证token时发生错误',
          code: 'TOKEN_VALIDATION_ERROR'
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * 获取密码强度评估
   */
  checkPasswordStrength = async (req: Request, res: Response): Promise<void> => {
    try {
      const { password } = req.body;

      if (!password) {
        res.status(400).json({
          success: false,
          error: {
            message: '密码是必填项',
            code: 'MISSING_PASSWORD'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const strengthResult = this.authService.getPasswordStrength(password);

      res.status(200).json({
        success: true,
        data: strengthResult,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('密码强度检查失败:', error);
      
      res.status(500).json({
        success: false,
        error: {
          message: '密码强度检查失败',
          code: 'PASSWORD_STRENGTH_CHECK_FAILED'
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * 生成随机密码
   */
  generatePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { length = 12 } = req.query;
      const passwordLength = parseInt(length as string, 10);

      if (isNaN(passwordLength) || passwordLength < 6 || passwordLength > 128) {
        res.status(400).json({
          success: false,
          error: {
            message: '密码长度必须在6-128之间',
            code: 'INVALID_PASSWORD_LENGTH'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const randomPassword = this.authService.generateRandomPassword(passwordLength);

      res.status(200).json({
        success: true,
        data: {
          password: randomPassword,
          length: passwordLength
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('生成随机密码失败:', error);
      
      res.status(500).json({
        success: false,
        error: {
          message: '生成随机密码失败',
          code: 'PASSWORD_GENERATION_FAILED'
        },
        timestamp: new Date().toISOString()
      });
    }
  };
}