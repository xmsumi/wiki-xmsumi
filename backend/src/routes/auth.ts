import { Router } from 'express';
import { AuthController } from '@/controllers/AuthController';
import { authenticate, rateLimit } from '@/middleware/auth';

/**
 * 认证路由
 */
const router = Router();
const authController = new AuthController();

// 速率限制配置
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  maxRequests: 5, // 最多5次登录尝试
  message: '登录尝试过于频繁，请15分钟后再试'
});

const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  maxRequests: 3, // 最多3次注册尝试
  message: '注册尝试过于频繁，请1小时后再试'
});

const passwordChangeRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  maxRequests: 5, // 最多5次密码修改尝试
  message: '密码修改尝试过于频繁，请1小时后再试'
});

// 公开路由（不需要认证）
router.post('/login', loginRateLimit, authController.login);
router.post('/register', registerRateLimit, authController.register);
router.post('/refresh-token', authController.refreshToken);
router.post('/validate-token', authController.validateToken);
router.post('/check-password-strength', authController.checkPasswordStrength);
router.get('/generate-password', authController.generatePassword);

// 需要认证的路由
router.post('/logout', authenticate, authController.logout);
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.post('/change-password', authenticate, passwordChangeRateLimit, authController.changePassword);

export default router;