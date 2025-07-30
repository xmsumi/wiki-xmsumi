import { db } from '@/config/database';
import { emailService } from '@/services/EmailService';
import { logger } from '@/utils/logger';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

/**
 * 密码重置记录接口
 */
export interface PasswordReset {
  id: number;
  userId: number;
  email: string;
  token: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 密码重置服务类
 * 处理用户密码重置相关功能
 */
export class PasswordResetService {
  /**
   * 生成重置令牌
   */
  private generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * 创建密码重置记录
   */
  async createPasswordReset(email: string): Promise<{
    success: boolean;
    message: string;
    token?: string;
  }> {
    try {
      // 查找用户
      const userResult = await db.query(
        'SELECT id, username, email FROM users WHERE email = ?',
        [email]
      );

      if (!userResult || userResult.length === 0) {
        // 为了安全，不透露用户是否存在
        return {
          success: true,
          message: '如果该邮箱地址存在，您将收到密码重置邮件'
        };
      }

      const user = userResult[0];
      const token = this.generateResetToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1小时后过期

      // 删除该用户之前的未使用记录
      await db.query(
        'DELETE FROM password_resets WHERE user_id = ? AND used_at IS NULL',
        [user.id]
      );

      // 创建新的重置记录
      await db.query(
        `INSERT INTO password_resets 
         (user_id, email, token, expires_at) 
         VALUES (?, ?, ?, ?)`,
        [user.id, email, token, expiresAt]
      );

      logger.info('密码重置记录创建成功', {
        userId: user.id,
        email,
        expiresAt
      });

      return {
        success: true,
        message: '密码重置记录创建成功',
        token
      };
    } catch (error) {
      logger.error('创建密码重置记录失败:', error);
      return {
        success: false,
        message: '创建密码重置记录失败'
      };
    }
  }

  /**
   * 发送密码重置邮件
   */
  async sendPasswordResetEmail(
    email: string,
    baseUrl: string = 'http://localhost:3000'
  ): Promise<{ success: boolean; message: string }> {
    try {
      // 检查是否在短时间内重复发送
      const recentResult = await db.query(
        `SELECT pr.* FROM password_resets pr 
         JOIN users u ON pr.user_id = u.id 
         WHERE u.email = ? AND pr.created_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)`,
        [email]
      );

      if (recentResult && recentResult.length > 0) {
        return {
          success: false,
          message: '请等待5分钟后再重新发送重置邮件'
        };
      }

      // 创建重置记录
      const resetResult = await this.createPasswordReset(email);
      
      if (!resetResult.success || !resetResult.token) {
        return resetResult;
      }

      // 获取用户信息
      const userResult = await db.query(
        'SELECT username FROM users WHERE email = ?',
        [email]
      );

      if (!userResult || userResult.length === 0) {
        return {
          success: true,
          message: '如果该邮箱地址存在，您将收到密码重置邮件'
        };
      }

      const user = userResult[0];

      // 构建重置URL
      const resetUrl = `${baseUrl}/auth/reset-password?token=${resetResult.token}`;

      // 发送重置邮件
      const emailResult = await emailService.sendPasswordResetEmail(
        email,
        resetResult.token,
        resetUrl,
        user.username
      );

      if (emailResult.success) {
        logger.info('密码重置邮件发送成功', {
          email,
          username: user.username
        });
        return {
          success: true,
          message: '密码重置邮件已发送，请检查您的邮箱'
        };
      } else {
        logger.error('密码重置邮件发送失败:', emailResult.message);
        return {
          success: false,
          message: '发送重置邮件失败，请稍后重试'
        };
      }
    } catch (error) {
      logger.error('发送密码重置邮件失败:', error);
      return {
        success: false,
        message: '发送密码重置邮件失败'
      };
    }
  }

  /**
   * 验证重置令牌
   */
  async validateResetToken(token: string): Promise<{
    success: boolean;
    message: string;
    userId?: number;
    email?: string;
  }> {
    try {
      // 查找重置记录
      const result = await db.query(
        'SELECT * FROM password_resets WHERE token = ? AND used_at IS NULL',
        [token]
      );

      if (!result || result.length === 0) {
        return {
          success: false,
          message: '重置链接无效或已使用'
        };
      }

      const reset = result[0];

      // 检查是否过期
      if (new Date() > new Date(reset.expires_at)) {
        return {
          success: false,
          message: '重置链接已过期，请重新申请密码重置'
        };
      }

      return {
        success: true,
        message: '重置令牌有效',
        userId: reset.user_id,
        email: reset.email
      };
    } catch (error) {
      logger.error('验证重置令牌失败:', error);
      return {
        success: false,
        message: '验证重置令牌失败'
      };
    }
  }

  /**
   * 重置密码
   */
  async resetPassword(
    token: string, 
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // 验证令牌
      const validation = await this.validateResetToken(token);
      if (!validation.success || !validation.userId) {
        return validation;
      }

      // 密码强度验证
      if (newPassword.length < 6) {
        return {
          success: false,
          message: '密码长度至少为6位'
        };
      }

      // 哈希新密码
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // 更新用户密码
      await db.query(
        'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
        [hashedPassword, validation.userId]
      );

      // 标记重置记录为已使用
      await db.query(
        'UPDATE password_resets SET used_at = NOW() WHERE token = ?',
        [token]
      );

      // 删除该用户的所有其他重置记录
      await db.query(
        'DELETE FROM password_resets WHERE user_id = ? AND token != ?',
        [validation.userId, token]
      );

      logger.info('密码重置成功', {
        userId: validation.userId,
        email: validation.email
      });

      return {
        success: true,
        message: '密码重置成功，请使用新密码登录'
      };
    } catch (error) {
      logger.error('重置密码失败:', error);
      return {
        success: false,
        message: '重置密码失败'
      };
    }
  }

  /**
   * 清理过期的重置记录
   */
  async cleanupExpiredResets(): Promise<void> {
    try {
      const result = await db.query(
        'DELETE FROM password_resets WHERE expires_at < NOW() AND used_at IS NULL'
      );

      logger.info('清理过期重置记录完成', {
        deletedCount: result.affectedRows || 0
      });
    } catch (error) {
      logger.error('清理过期重置记录失败:', error);
    }
  }

  /**
   * 获取用户的重置状态
   */
  async getResetStatus(email: string): Promise<{
    hasPendingReset: boolean;
    lastRequestAt?: Date;
    expiresAt?: Date;
  }> {
    try {
      // 查找用户的待处理重置记录
      const result = await db.query(
        `SELECT pr.* FROM password_resets pr 
         JOIN users u ON pr.user_id = u.id 
         WHERE u.email = ? AND pr.used_at IS NULL AND pr.expires_at > NOW() 
         ORDER BY pr.created_at DESC LIMIT 1`,
        [email]
      );

      if (!result || result.length === 0) {
        return {
          hasPendingReset: false
        };
      }

      const reset = result[0];
      return {
        hasPendingReset: true,
        lastRequestAt: reset.created_at,
        expiresAt: reset.expires_at
      };
    } catch (error) {
      logger.error('获取重置状态失败:', error);
      throw error;
    }
  }

  /**
   * 取消密码重置
   */
  async cancelPasswordReset(token: string): Promise<{ success: boolean; message: string }> {
    try {
      const result = await db.query(
        'UPDATE password_resets SET used_at = NOW() WHERE token = ? AND used_at IS NULL',
        [token]
      );

      if (result.affectedRows === 0) {
        return {
          success: false,
          message: '重置记录不存在或已使用'
        };
      }

      logger.info('密码重置已取消', { token });

      return {
        success: true,
        message: '密码重置已取消'
      };
    } catch (error) {
      logger.error('取消密码重置失败:', error);
      return {
        success: false,
        message: '取消密码重置失败'
      };
    }
  }
}

// 导出密码重置服务单例
export const passwordResetService = new PasswordResetService();