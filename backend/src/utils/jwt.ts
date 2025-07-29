import jwt from 'jsonwebtoken';
import { JwtPayload, UserRole } from '@/types/user';
import { logger } from '@/utils/logger';

/**
 * JWT配置
 */
interface JwtConfig {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
}

/**
 * 获取JWT配置
 */
const getJwtConfig = (): JwtConfig => ({
  accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'your-access-token-secret-key',
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-token-secret-key',
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d'
});

/**
 * Token黑名单存储（生产环境应使用Redis）
 */
class TokenBlacklist {
  private blacklistedTokens: Set<string> = new Set();

  /**
   * 添加token到黑名单
   */
  add(token: string): void {
    this.blacklistedTokens.add(token);
  }

  /**
   * 检查token是否在黑名单中
   */
  isBlacklisted(token: string): boolean {
    return this.blacklistedTokens.has(token);
  }

  /**
   * 清理过期的token（简单实现，生产环境需要更复杂的逻辑）
   */
  cleanup(): void {
    // 在生产环境中，这里应该实现基于时间的清理逻辑
    // 目前为简单实现，可以定期清空整个黑名单
    if (this.blacklistedTokens.size > 10000) {
      this.blacklistedTokens.clear();
      logger.info('Token黑名单已清理');
    }
  }
}

export const tokenBlacklist = new TokenBlacklist();

/**
 * JWT工具类
 */
export class JwtUtils {
  private static config = getJwtConfig();

  /**
   * 生成访问token
   */
  static generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    try {
      const token = jwt.sign(
        payload,
        this.config.accessTokenSecret,
        {
          expiresIn: this.config.accessTokenExpiry,
          issuer: 'wiki-knowledge-base',
          audience: 'wiki-users'
        } as jwt.SignOptions
      );
      
      logger.info(`访问token生成成功 (用户ID: ${payload.userId})`);
      return token;
    } catch (error) {
      logger.error('生成访问token失败:', error);
      throw new Error('Token生成失败');
    }
  }

  /**
   * 生成刷新token
   */
  static generateRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    try {
      const token = jwt.sign(
        payload,
        this.config.refreshTokenSecret,
        {
          expiresIn: this.config.refreshTokenExpiry,
          issuer: 'wiki-knowledge-base',
          audience: 'wiki-users'
        } as jwt.SignOptions
      );
      
      logger.info(`刷新token生成成功 (用户ID: ${payload.userId})`);
      return token;
    } catch (error) {
      logger.error('生成刷新token失败:', error);
      throw new Error('Token生成失败');
    }
  }

  /**
   * 验证访问token
   */
  static verifyAccessToken(token: string): JwtPayload {
    try {
      // 检查token是否在黑名单中
      if (tokenBlacklist.isBlacklisted(token)) {
        throw new Error('Token已被撤销');
      }

      const decoded = jwt.verify(
        token,
        this.config.accessTokenSecret,
        {
          issuer: 'wiki-knowledge-base',
          audience: 'wiki-users'
        }
      ) as JwtPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.warn('访问token已过期');
        throw new Error('Token已过期');
      } else if (error instanceof jwt.JsonWebTokenError) {
        logger.warn('无效的访问token');
        throw new Error('无效的Token');
      } else {
        logger.error('验证访问token失败:', error);
        throw error;
      }
    }
  }

  /**
   * 验证刷新token
   */
  static verifyRefreshToken(token: string): JwtPayload {
    try {
      // 检查token是否在黑名单中
      if (tokenBlacklist.isBlacklisted(token)) {
        throw new Error('Token已被撤销');
      }

      const decoded = jwt.verify(
        token,
        this.config.refreshTokenSecret,
        {
          issuer: 'wiki-knowledge-base',
          audience: 'wiki-users'
        }
      ) as JwtPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.warn('刷新token已过期');
        throw new Error('Token已过期');
      } else if (error instanceof jwt.JsonWebTokenError) {
        logger.warn('无效的刷新token');
        throw new Error('无效的Token');
      } else {
        logger.error('验证刷新token失败:', error);
        throw error;
      }
    }
  }

  /**
   * 从token中提取payload（不验证签名）
   */
  static decodeToken(token: string): JwtPayload | null {
    try {
      const decoded = jwt.decode(token) as JwtPayload;
      return decoded;
    } catch (error) {
      logger.error('解码token失败:', error);
      return null;
    }
  }

  /**
   * 撤销token（添加到黑名单）
   */
  static revokeToken(token: string): void {
    tokenBlacklist.add(token);
    logger.info('Token已添加到黑名单');
  }

  /**
   * 生成token对
   */
  static generateTokenPair(payload: Omit<JwtPayload, 'iat' | 'exp'>): {
    accessToken: string;
    refreshToken: string;
  } {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload)
    };
  }

  /**
   * 刷新访问token
   */
  static refreshAccessToken(refreshToken: string): {
    accessToken: string;
    refreshToken: string;
  } {
    try {
      // 验证刷新token
      const decoded = this.verifyRefreshToken(refreshToken);
      
      // 撤销旧的刷新token
      this.revokeToken(refreshToken);
      
      // 生成新的token对
      const payload = {
        userId: decoded.userId,
        username: decoded.username,
        role: decoded.role
      };
      
      return this.generateTokenPair(payload);
    } catch (error) {
      logger.error('刷新token失败:', error);
      throw error;
    }
  }

  /**
   * 检查token是否即将过期（在指定分钟内过期）
   */
  static isTokenExpiringSoon(token: string, minutesThreshold: number = 5): boolean {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        return true;
      }

      const now = Math.floor(Date.now() / 1000);
      const expiresIn = decoded.exp - now;
      const thresholdSeconds = minutesThreshold * 60;

      return expiresIn <= thresholdSeconds;
    } catch (error) {
      logger.error('检查token过期时间失败:', error);
      return true;
    }
  }

  /**
   * 获取token剩余有效时间（秒）
   */
  static getTokenRemainingTime(token: string): number {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        return 0;
      }

      const now = Math.floor(Date.now() / 1000);
      const remainingTime = decoded.exp - now;

      return Math.max(0, remainingTime);
    } catch (error) {
      logger.error('获取token剩余时间失败:', error);
      return 0;
    }
  }
}

/**
 * 定期清理token黑名单
 */
setInterval(() => {
  tokenBlacklist.cleanup();
}, 60 * 60 * 1000); // 每小时清理一次