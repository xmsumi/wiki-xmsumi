import { Router } from 'express';
import { AuthController } from '@/controllers/AuthController';
import { authenticate, rateLimit } from '@/middleware/auth';

/**
 * 认证路由
 */
const router = Router();
const authController = new AuthController();

// 速率限制配置 - 根据环境调整
const isDevelopment = process.env.NODE_ENV === 'development';

const loginRateLimit = rateLimit({
  windowMs: isDevelopment ? 2 * 60 * 1000 : 5 * 60 * 1000, // 开发环境2分钟，生产环境5分钟
  maxRequests: isDevelopment ? 20 : 10, // 开发环境20次，生产环境10次
  message: `登录尝试过于频繁，请${isDevelopment ? '2' : '5'}分钟后再试`
});

const registerRateLimit = rateLimit({
  windowMs: isDevelopment ? 30 * 60 * 1000 : 60 * 60 * 1000, // 开发环境30分钟，生产环境1小时
  maxRequests: isDevelopment ? 10 : 3, // 开发环境10次，生产环境3次
  message: `注册尝试过于频繁，请${isDevelopment ? '30分钟' : '1小时'}后再试`
});

const passwordChangeRateLimit = rateLimit({
  windowMs: isDevelopment ? 30 * 60 * 1000 : 60 * 60 * 1000, // 开发环境30分钟，生产环境1小时
  maxRequests: isDevelopment ? 10 : 5, // 开发环境10次，生产环境5次
  message: `密码修改尝试过于频繁，请${isDevelopment ? '30分钟' : '1小时'}后再试`
});

const emailVerificationRateLimit = rateLimit({
  windowMs: isDevelopment ? 1 * 60 * 1000 : 5 * 60 * 1000, // 开发环境1分钟，生产环境5分钟
  maxRequests: isDevelopment ? 10 : 3, // 开发环境10次，生产环境3次
  message: `邮件发送过于频繁，请${isDevelopment ? '1分钟' : '5分钟'}后再试`
});

const passwordResetRateLimit = rateLimit({
  windowMs: isDevelopment ? 5 * 60 * 1000 : 15 * 60 * 1000, // 开发环境5分钟，生产环境15分钟
  maxRequests: isDevelopment ? 5 : 3, // 开发环境5次，生产环境3次
  message: `密码重置请求过于频繁，请${isDevelopment ? '5分钟' : '15分钟'}后再试`
});

// 公开路由（不需要认证）
router.post('/login', loginRateLimit, authController.login);
router.post('/register', registerRateLimit, authController.register);
router.post('/refresh-token', authController.refreshToken);
router.post('/validate-token', authController.validateToken);
router.post('/check-password-strength', authController.checkPasswordStrength);
router.get('/generate-password', authController.generatePassword);

// 邮箱验证路由（公开）
router.get('/verify-email', authController.verifyEmail);

// 密码重置路由（公开）
router.post('/request-password-reset', passwordResetRateLimit, authController.requestPasswordReset);
router.get('/validate-reset-token', authController.validatePasswordResetToken);
router.post('/reset-password', authController.resetPassword);
router.get('/reset-status', authController.getPasswordResetStatus);
router.post('/cancel-reset', authController.cancelPasswordReset);

// 需要认证的路由
router.post('/logout', authenticate, authController.logout);
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.post('/change-password', authenticate, passwordChangeRateLimit, authController.changePassword);

// 邮箱验证路由（需要认证）
router.post('/send-verification-email', authenticate, emailVerificationRateLimit, authController.sendVerificationEmail);
router.post('/resend-verification-email', authenticate, emailVerificationRateLimit, authController.resendVerificationEmail);
router.get('/verification-status', authenticate, authController.getVerificationStatus);

// 开发环境专用路由（频率限制管理）
if (process.env.NODE_ENV === 'development') {
  router.get('/rate-limit-status', authController.getRateLimitStatus);
  router.post('/clear-rate-limit', authController.clearRateLimit);
}

export default router;