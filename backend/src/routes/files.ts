import { Router } from 'express';
import { FileController } from '../controllers/FileController';
import { authenticate } from '../middleware/auth';

const router = Router();
const fileController = new FileController();

/**
 * 文件管理路由
 * 所有路由都需要用户认证
 */

// 上传文件
router.post('/upload', 
  authenticate,
  fileController.getUploadMiddleware(),
  fileController.uploadFile.bind(fileController)
);

// 下载文件
router.get('/:id', 
  fileController.downloadFile.bind(fileController)
);

// 获取文件信息
router.get('/:id/info', 
  authenticate,
  fileController.getFileInfo.bind(fileController)
);

// 删除文件
router.delete('/:id', 
  authenticate,
  fileController.deleteFile.bind(fileController)
);

// 获取当前用户的文件列表
router.get('/my/list', 
  authenticate,
  fileController.getUserFiles.bind(fileController)
);

// 获取所有文件列表（管理员功能）
router.get('/admin/all', 
  authenticate,
  fileController.getAllFiles.bind(fileController)
);

// 获取存储统计信息（管理员功能）
router.get('/admin/stats', 
  authenticate,
  fileController.getStorageStats.bind(fileController)
);

export default router;