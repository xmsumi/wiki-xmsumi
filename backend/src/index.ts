import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { errorHandler } from '@/middleware/errorHandler';
import { notFoundHandler } from '@/middleware/notFoundHandler';
import { logger } from '@/utils/logger';
import { SearchService } from '@/services/SearchService';
import { DocumentRepository } from '@/repositories/DocumentRepository';
import authRoutes from '@/routes/auth';
import documentRoutes from '@/routes/documents';
import directoryRoutes from '@/routes/directories';
import fileRoutes from '@/routes/files';
import searchRoutes from '@/routes/search';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件配置
app.use(helmet()); // 安全头部
app.use(compression()); // 响应压缩
app.use(morgan('combined')); // 请求日志
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser()); // Cookie解析器

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/directories', directoryRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/search', searchRoutes);

// API信息端点
app.get('/api', (req, res) => {
  res.json({
    message: 'Wiki知识库API服务',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      documents: '/api/documents',
      directories: '/api/directories',
      files: '/api/files',
      search: '/api/search',
    },
  });
});

// 错误处理中间件
app.use(notFoundHandler);
app.use(errorHandler);

// 初始化搜索服务
async function initializeSearchService() {
  try {
    const documentRepository = new DocumentRepository();
    const searchService = new SearchService(documentRepository);
    await searchService.initialize();
    logger.info('搜索服务初始化完成');
  } catch (error) {
    logger.error('搜索服务初始化失败:', error);
  }
}

// 启动服务器
app.listen(PORT, async () => {
  logger.info(`服务器运行在端口 ${PORT}`);
  logger.info(`环境: ${process.env.NODE_ENV || 'development'}`);
  
  // 初始化搜索服务
  await initializeSearchService();
});

export default app;