import { db } from '@/config/database';
import { emailService } from '@/services/EmailService';
import { logger } from '@/utils/logger';
import * as crypto from 'crypto';

/**
 * 邮件验证记录接口
 */
export interface EmailVerification {
  id: number;
  userId: number;
  email: string;
  verificationCode: string;
  token: string;
  expiresAt: Date;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 邮件验证服务类
 * 处理用户注册邮件验证相关功能
 */
export class EmailVerificationService {
  /**
   * 生成验证码
   */
  private generateVerificationCode(): string {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
  }

  /**
   * 生成验证令牌
   */
  private generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * 创建邮件验证记录
   */
  async createVerification(userId: number, email: string): Promise<{
    verificationCode: string;
    token: string;
    expiresAt: Date;
  }> {
    try {
      const verificationCode = this.generateVerificationCode();
      const token = this.generateVerificationToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时后过期

      // 删除该用户之前的未验证记录
      await db.query(
        'DELETE FROM email_verifications WHERE user_id = ? AND verified_at IS NULL',
        [userId]
      );

      // 创建新的验证记录
      await db.query(
        `INSERT INTO email_verifications 
         (user_id, email, verification_code, token, expires_at) 
         VALUES (?, ?, ?, ?, ?)`,
        [userId, email, verificationCode, token, expiresAt]
      );

      logger.info('邮件验证记录创建成功', {
        userId,
        email,
        verificationCode,
        expiresAt
      });

      return { verificationCode, token, expiresAt };
    } catch (error) {
      logger.error('创建邮件验证记录失败:', error);
      throw new Error('创建邮件验证记录失败');
    }
  }

  /**
   * 发送验证邮件
   */
  async sendVerificationEmail(
    userId: number, 
    email: string, 
    username: string,
    baseUrl: string = 'http://localhost:3000'
  ): Promise<{ success: boolean; message: string }> {
    try {
      // 创建验证记录
      const { verificationCode, token } = await this.createVerification(userId, email);

      // 构建验证URL
      const verificationUrl = `${baseUrl}/auth/verify-email?token=${token}&code=${verificationCode}`;

      // 发送验证邮件
      const result = await emailService.sendVerificationEmail(
        email,
        verificationCode,
        verificationUrl,
        username
      );

      if (result.success) {
        logger.info('验证邮件发送成功', {
          userId,
          email,
          username
        });
      } else {
        logger.error('验证邮件发送失败:', result.message);
      }

      return result;
    } catch (error) {
      logger.error('发送验证邮件失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '发送验证邮件失败'
      };
    }
  }

  /**
   * 验证邮件
   */
  async verifyEmail(token: string, verificationCode?: string): Promise<{
    success: boolean;
    message: string;
    userId?: number;
  }> {
    try {
      // 查找验证记录
      const query = verificationCode 
        ? 'SELECT * FROM email_verifications WHERE token = ? AND verification_code = ? AND verified_at IS NULL'
        : 'SELECT * FROM email_verifications WHERE token = ? AND verified_at IS NULL';
      
      const params = verificationCode ? [token, verificationCode] : [token];
      const result = await db.query(query, params);

      if (!result || result.length === 0) {
        return {
          success: false,
          message: '验证链接无效或已过期'
        };
      }

      const verification = result[0];

      // 检查是否过期
      if (new Date() > new Date(verification.expires_at)) {
        return {
          success: false,
          message: '验证链接已过期，请重新发送验证邮件'
        };
      }

      // 标记为已验证
      await db.query(
        'UPDATE email_verifications SET verified_at = NOW() WHERE id = ?',
        [verification.id]
      );

      // 更新用户邮箱验证状态
      await db.query(
        'UPDATE users SET email_verified = TRUE, email_verified_at = NOW() WHERE id = ?',
        [verification.user_id]
      );

      logger.info('邮件验证成功', {
        userId: verification.user_id,
        email: verification.email
      });

      return {
        success: true,
        message: '邮箱验证成功',
        userId: verification.user_id
      };
    } catch (error) {
      logger.error('邮件验证失败:', error);
      return {
        success: false,
        message: '邮件验证失败'
      };
    }
  }

  /**
   * 重新发送验证邮件
   */
  async resendVerificationEmail(
    userId: number,
    baseUrl: string = 'http://localhost:3000'
  ): Promise<{ success: boolean; message: string }> {
    try {
      // 获取用户信息
      const userResult = await db.query(
        'SELECT username, email, email_verified FROM users WHERE id = ?',
        [userId]
      );

      if (!userResult || userResult.length === 0) {
        return {
          success: false,
          message: '用户不存在'
        };
      }

      const user = userResult[0];

      if (user.email_verified) {
        return {
          success: false,
          message: '邮箱已经验证过了'
        };
      }

      // 检查是否在短时间内重复发送
      const recentResult = await db.query(
        'SELECT * FROM email_verifications WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE)',
        [userId]
      );

      if (recentResult && recentResult.length > 0) {
        return {
          success: false,
          message: '请等待1分钟后再重新发送验证邮件'
        };
      }

      // 发送验证邮件
      return await this.sendVerificationEmail(userId, user.email, user.username, baseUrl);
    } catch (error) {
      logger.error('重新发送验证邮件失败:', error);
      return {
        success: false,
        message: '重新发送验证邮件失败'
      };
    }
  }

  /**
   * 清理过期的验证记录
   */
  async cleanupExpiredVerifications(): Promise<void> {
    try {
      const result = await db.query(
        'DELETE FROM email_verifications WHERE expires_at < NOW() AND verified_at IS NULL'
      );

      logger.info('清理过期验证记录完成', {
        deletedCount: result.affectedRows || 0
      });
    } catch (error) {
      logger.error('清理过期验证记录失败:', error);
    }
  }

  /**
   * 获取用户的验证状态
   */
  async getVerificationStatus(userId: number): Promise<{
    isVerified: boolean;
    pendingVerification: boolean;
    lastSentAt?: Date;
  }> {
    try {
      // 检查用户邮箱验证状态
      const userResult = await db.query(
        'SELECT email_verified FROM users WHERE id = ?',
        [userId]
      );

      if (!userResult || userResult.length === 0) {
        throw new Error('用户不存在');
      }

      const isVerified = userResult[0].email_verified;

      if (isVerified) {
        return {
          isVerified: true,
          pendingVerification: false
        };
      }

      // 检查是否有待验证的记录
      const verificationResult = await db.query(
        'SELECT created_at FROM email_verifications WHERE user_id = ? AND verified_at IS NULL AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
        [userId]
      );

      return {
        isVerified: false,
        pendingVerification: verificationResult && verificationResult.length > 0,
        lastSentAt: verificationResult && verificationResult.length > 0 ? verificationResult[0].created_at : undefined
      };
    } catch (error) {
      logger.error('获取验证状态失败:', error);
      throw error;
    }
  }
}

// 导出邮件验证服务单例
export const emailVerificationService = new EmailVerificationService();