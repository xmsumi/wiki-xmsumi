import bcrypt from 'bcryptjs';
import { logger } from '@/utils/logger';

/**
 * 密码工具类
 */
export class PasswordUtils {
  private static readonly SALT_ROUNDS = 12;
  private static readonly MIN_PASSWORD_LENGTH = 6;
  private static readonly MAX_PASSWORD_LENGTH = 128;

  /**
   * 哈希密码
   */
  static async hashPassword(password: string): Promise<string> {
    try {
      if (!this.validatePasswordLength(password)) {
        throw new Error(`密码长度必须在${this.MIN_PASSWORD_LENGTH}-${this.MAX_PASSWORD_LENGTH}个字符之间`);
      }

      const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);
      logger.info('密码哈希成功');
      return hashedPassword;
    } catch (error) {
      logger.error('密码哈希失败:', error);
      throw error;
    }
  }

  /**
   * 验证密码
   */
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      const isValid = await bcrypt.compare(password, hashedPassword);
      logger.info(`密码验证${isValid ? '成功' : '失败'}`);
      return isValid;
    } catch (error) {
      logger.error('密码验证失败:', error);
      throw error;
    }
  }

  /**
   * 验证密码长度
   */
  private static validatePasswordLength(password: string): boolean {
    return password.length >= this.MIN_PASSWORD_LENGTH && 
           password.length <= this.MAX_PASSWORD_LENGTH;
  }

  /**
   * 验证密码强度
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // 检查长度
    if (!this.validatePasswordLength(password)) {
      errors.push(`密码长度必须在${this.MIN_PASSWORD_LENGTH}-${this.MAX_PASSWORD_LENGTH}个字符之间`);
    }

    // 检查是否包含小写字母
    if (!/[a-z]/.test(password)) {
      errors.push('密码必须包含至少一个小写字母');
    }

    // 检查是否包含大写字母
    if (!/[A-Z]/.test(password)) {
      errors.push('密码必须包含至少一个大写字母');
    }

    // 检查是否包含数字
    if (!/\d/.test(password)) {
      errors.push('密码必须包含至少一个数字');
    }

    // 检查是否包含特殊字符（可选）
    // if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    //   errors.push('密码必须包含至少一个特殊字符');
    // }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 生成随机密码
   */
  static generateRandomPassword(length: number = 12): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const specialChars = '!@#$%^&*(),.?":{}|<>';
    
    const allChars = lowercase + uppercase + numbers + specialChars;
    
    let password = '';
    
    // 确保包含至少一个小写字母、大写字母和数字
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    
    // 填充剩余字符
    for (let i = 3; i < length; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    // 打乱字符顺序
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * 检查密码是否常见（简单实现）
   */
  static isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password', 'password123', '123456', '123456789', 'qwerty',
      'abc123', 'password1', 'admin', 'letmein', 'welcome',
      '123123', 'password12', 'qwerty123', 'admin123'
    ];
    
    return commonPasswords.includes(password.toLowerCase());
  }

  /**
   * 计算密码强度分数（0-100）
   */
  static calculatePasswordStrength(password: string): {
    score: number;
    level: 'weak' | 'fair' | 'good' | 'strong';
    feedback: string[];
  } {
    let score = 0;
    const feedback: string[] = [];

    // 长度评分
    if (password.length >= 8) {
      score += 20;
    } else {
      feedback.push('密码长度至少应为8个字符');
    }

    if (password.length >= 12) {
      score += 10;
    }

    // 字符类型评分
    if (/[a-z]/.test(password)) {
      score += 15;
    } else {
      feedback.push('添加小写字母');
    }

    if (/[A-Z]/.test(password)) {
      score += 15;
    } else {
      feedback.push('添加大写字母');
    }

    if (/\d/.test(password)) {
      score += 15;
    } else {
      feedback.push('添加数字');
    }

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 15;
    } else {
      feedback.push('添加特殊字符');
    }

    // 复杂性评分
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= password.length * 0.7) {
      score += 10;
    }

    // 常见密码扣分
    if (this.isCommonPassword(password)) {
      score -= 30;
      feedback.push('避免使用常见密码');
    }

    // 确定强度等级
    let level: 'weak' | 'fair' | 'good' | 'strong';
    if (score < 30) {
      level = 'weak';
    } else if (score < 60) {
      level = 'fair';
    } else if (score < 80) {
      level = 'good';
    } else {
      level = 'strong';
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      level,
      feedback
    };
  }
}