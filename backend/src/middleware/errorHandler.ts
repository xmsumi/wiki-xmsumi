import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * 全局错误处理中间件
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';

  // 记录错误日志
  logger.error('错误详情:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // 开发环境返回详细错误信息
  if (process.env.NODE_ENV === 'development') {
    res.status(statusCode).json({
      success: false,
      error: {
        message,
        stack: err.stack,
        statusCode,
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // 生产环境返回简化错误信息
  res.status(statusCode).json({
    success: false,
    error: {
      message: statusCode === 500 ? '服务器内部错误' : message,
      code: statusCode,
    },
    timestamp: new Date().toISOString(),
  });
};