import { Request, Response, NextFunction } from 'express';
import { JwtUtils } from '@/utils/jwt';
import { UserRepository } from '@/repositories/UserRepository';
import { UserRole, JwtPayload } from '@/types/user';
import { logger } from '@/utils/logger';

/**
 * 扩展Request接口以包含用户信息
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
    role: UserRole;
  };
}

/**
 * 认证中间件
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 从请求头中获取token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          message: '未提供认证token',
          code: 'MISSING_TOKEN'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const token = authHeader.substring(7); // 移除 'Bearer ' 前缀

    // 验证token
    let decoded: JwtPayload;
    try {
      decoded = JwtUtils.verifyAccessToken(token);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '无效的token';
      res.status(401).json({
        success: false,
        error: {
          message: errorMessage,
          code: 'INVALID_TOKEN'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // 验证用户是否存在且激活
    const userRepository = new UserRepository();
    const user = await userRepository.findById(decoded.userId);
    
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          message: '用户不存在',
          code: 'USER_NOT_FOUND'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (!user.isActive()) {
      res.status(401).json({
        success: false,
        error: {
          message: '用户账户已被禁用',
          code: 'USER_INACTIVE'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // 将用户信息添加到请求对象
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    logger.info(`用户认证成功: ${user.username} (ID: ${user.id})`);
    next();
  } catch (error) {
    logger.error('认证中间件错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '认证过程中发生错误',
        code: 'AUTH_ERROR'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * 可选认证中间件（不强制要求认证）
 */
export const optionalAuthenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // 没有token，继续执行但不设置用户信息
      next();
      return;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = JwtUtils.verifyAccessToken(token);
      const userRepository = new UserRepository();
      const user = await userRepository.findById(decoded.userId);
      
      if (user && user.isActive()) {
        req.user = {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        };
      }
    } catch (error) {
      // token无效，但不阻止请求继续
      logger.warn('可选认证中token无效:', error);
    }

    next();
  } catch (error) {
    logger.error('可选认证中间件错误:', error);
    next(); // 即使出错也继续执行
  }
};

/**
 * 角色授权中间件工厂
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          message: '需要认证',
          code: 'AUTHENTICATION_REQUIRED'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          message: '权限不足',
          code: 'INSUFFICIENT_PERMISSIONS',
          details: {
            required: allowedRoles,
            current: req.user.role
          }
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    logger.info(`用户授权成功: ${req.user.username} (角色: ${req.user.role})`);
    next();
  };
};

/**
 * 管理员权限中间件
 */
export const requireAdmin = authorize(UserRole.ADMIN);

/**
 * 编辑权限中间件（管理员和编辑者）
 */
export const requireEditor = authorize(UserRole.ADMIN, UserRole.EDITOR);

/**
 * 检查是否为资源所有者或管理员
 */
export const requireOwnershipOrAdmin = (getUserId: (req: AuthenticatedRequest) => number) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          message: '需要认证',
          code: 'AUTHENTICATION_REQUIRED'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const resourceUserId = getUserId(req);
    const isOwner = req.user.id === resourceUserId;
    const isAdmin = req.user.role === UserRole.ADMIN;

    if (!isOwner && !isAdmin) {
      res.status(403).json({
        success: false,
        error: {
          message: '只能访问自己的资源或需要管理员权限',
          code: 'OWNERSHIP_REQUIRED'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    next();
  };
};

/**
 * 速率限制中间件（简单实现）
 */
interface RateLimitOptions {
  windowMs: number; // 时间窗口（毫秒）
  maxRequests: number; // 最大请求数
  message?: string;
}

const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = (options: RateLimitOptions) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const key = req.user ? `user:${req.user.id}` : `ip:${req.ip}`;
    const now = Date.now();
    
    const record = requestCounts.get(key);
    
    if (!record || now > record.resetTime) {
      // 新的时间窗口
      requestCounts.set(key, {
        count: 1,
        resetTime: now + options.windowMs
      });
      next();
      return;
    }
    
    if (record.count >= options.maxRequests) {
      res.status(429).json({
        success: false,
        error: {
          message: options.message || '请求过于频繁，请稍后再试',
          code: 'RATE_LIMIT_EXCEEDED'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    record.count++;
    next();
  };
};

/**
 * 清理过期的速率限制记录
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 60 * 1000); // 每分钟清理一次