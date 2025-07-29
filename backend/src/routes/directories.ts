import { Router } from 'express';
import { DirectoryController } from '@/controllers/DirectoryController';
import { authenticate } from '@/middleware/auth';
import {
  createDirectoryValidation,
  updateDirectoryValidation,
  directoryIdValidation,
  moveDirectoryValidation,
  directoryQueryValidation,
  reorderDirectoriesValidation
} from '@/validators/directoryValidator';

const router = Router();
const directoryController = new DirectoryController();

/**
 * 获取目录结构
 * GET /api/directories
 */
router.get(
  '/',
  directoryQueryValidation,
  directoryController.getDirectories.bind(directoryController)
);

/**
 * 根据ID获取单个目录
 * GET /api/directories/:id
 */
router.get(
  '/:id',
  directoryIdValidation,
  directoryController.getDirectoryById.bind(directoryController)
);

/**
 * 创建目录
 * POST /api/directories
 */
router.post(
  '/',
  authenticate,
  createDirectoryValidation,
  directoryController.createDirectory.bind(directoryController)
);

/**
 * 更新目录
 * PUT /api/directories/:id
 */
router.put(
  '/:id',
  authenticate,
  updateDirectoryValidation,
  directoryController.updateDirectory.bind(directoryController)
);

/**
 * 删除目录
 * DELETE /api/directories/:id
 */
router.delete(
  '/:id',
  authenticate,
  directoryIdValidation,
  directoryController.deleteDirectory.bind(directoryController)
);

/**
 * 移动目录
 * POST /api/directories/move
 */
router.post(
  '/move',
  authenticate,
  moveDirectoryValidation,
  directoryController.moveDirectory.bind(directoryController)
);

/**
 * 重新排序同级目录
 * POST /api/directories/reorder
 */
router.post(
  '/reorder',
  authenticate,
  reorderDirectoriesValidation,
  directoryController.reorderDirectories.bind(directoryController)
);

/**
 * 获取目录统计信息
 * GET /api/directories/stats
 */
router.get(
  '/stats',
  authenticate,
  directoryController.getDirectoryStats.bind(directoryController)
);

export default router;