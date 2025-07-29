import { Router } from 'express';
import { DocumentController } from '@/controllers/DocumentController';
import { authenticate } from '@/middleware/auth';
import {
  createDocumentValidation,
  updateDocumentValidation,
  getDocumentValidation,
  deleteDocumentValidation,
  getDocumentsValidation,
  getDocumentVersionsValidation,
  getDocumentVersionValidation
} from '@/validators/documentValidator';

const router = Router();
const documentController = new DocumentController();

/**
 * 文档路由
 */

// 获取文档列表
router.get('/', 
  getDocumentsValidation,
  documentController.getDocuments.bind(documentController)
);

// 搜索文档
router.get('/search',
  documentController.searchDocuments.bind(documentController)
);

// 获取文档统计信息
router.get('/stats',
  documentController.getDocumentStats.bind(documentController)
);

// 获取热门标签
router.get('/tags/popular',
  documentController.getPopularTags.bind(documentController)
);

// 获取单个文档
router.get('/:id',
  getDocumentValidation,
  documentController.getDocument.bind(documentController)
);

// 获取文档版本历史
router.get('/:id/versions',
  getDocumentVersionsValidation,
  documentController.getDocumentVersions.bind(documentController)
);

// 获取特定版本的文档
router.get('/:id/versions/:version',
  getDocumentVersionValidation,
  documentController.getDocumentVersion.bind(documentController)
);

// 创建文档（需要认证）
router.post('/',
  authenticate,
  createDocumentValidation,
  documentController.createDocument.bind(documentController)
);

// 更新文档（需要认证）
router.put('/:id',
  authenticate,
  updateDocumentValidation,
  documentController.updateDocument.bind(documentController)
);

// 删除文档（需要认证）
router.delete('/:id',
  authenticate,
  deleteDocumentValidation,
  documentController.deleteDocument.bind(documentController)
);

export default router;