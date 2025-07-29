import { Router } from 'express';
import { SearchController } from '@/controllers/SearchController';
import { authenticate } from '@/middleware/auth';

const router = Router();
const searchController = new SearchController();

// 获取搜索建议（公开接口）
router.get('/suggestions',
  searchController.getSuggestions.bind(searchController)
);

// 获取搜索服务状态（公开接口）
router.get('/status',
  searchController.getSearchStatus.bind(searchController)
);

// 以下接口需要管理员权限

// 初始化搜索服务
router.post('/initialize',
  authenticate,
  searchController.initializeSearch.bind(searchController)
);

// 重建搜索索引
router.post('/reindex',
  authenticate,
  searchController.reindexDocuments.bind(searchController)
);

// 索引单个文档
router.post('/documents/:id/index',
  authenticate,
  searchController.indexDocument.bind(searchController)
);

// 删除文档索引
router.delete('/documents/:id/index',
  authenticate,
  searchController.deleteDocumentIndex.bind(searchController)
);

export default router;