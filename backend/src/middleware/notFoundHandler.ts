import { Request, Response, NextFunction } from 'express';

/**
 * 404错误处理中间件
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    error: {
      message: `路由 ${req.originalUrl} 未找到`,
      code: 404,
    },
    timestamp: new Date().toISOString(),
  });
};