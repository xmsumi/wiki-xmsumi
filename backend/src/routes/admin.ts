import { Router } from 'express';
import multer from 'multer';
import { AdminController } from '@/controllers/AdminController';
import { authenticate } from '@/middleware/auth';

const router = Router();
const adminController = new AdminController();

// 配置文件上传中间件
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// 管理员权限检查中间件
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      error: '权限不足',
      message: '只有管理员才能访问此功能'
    });
  }
  next();
};

// 所有路由都需要认证和管理员权限
router.use(authenticate);
router.use(requireAdmin);

// 系统设置相关路由
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);
router.post('/settings/reset', adminController.resetSettings);
router.get('/settings/export', adminController.exportSettings);
router.post('/settings/import', upload.single('file'), adminController.importSettings);

// 系统状态和测试
router.get('/status', adminController.getSystemStatus);
router.post('/settings/test-email', adminController.testEmailSettings);
router.post('/settings/test-search', adminController.testSearchEngine);

// 系统维护
router.post('/cache/clear', adminController.clearCache);
router.post('/search/rebuild-index', adminController.rebuildSearchIndex);

// 备份管理
router.get('/backups', adminController.getBackups);
router.post('/backups', adminController.createBackup);
router.get('/backups/:id/download', adminController.downloadBackup);
router.delete('/backups/:id', adminController.deleteBackup);

// 系统日志
router.get('/logs', adminController.getSystemLogs);

export default router;