import { JwtUtils, tokenBlacklist } from '@/utils/jwt';
import { UserRole } from '@/types/user';

// Mock环境变量
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_ACCESS_EXPIRY = '15m';
process.env.JWT_REFRESH_EXPIRY = '7d';

describe('JwtUtils', () => {
  const mockPayload = {
    userId: 1,
    username: 'testuser',
    role: UserRole.VIEWER
  };

  beforeEach(() => {
    // 清理token黑名单
    (tokenBlacklist as any).blacklistedTokens.clear();
  });

  describe('generateAccessToken', () => {
    it('应该生成有效的访问token', () => {
      const token = JwtUtils.generateAccessToken(mockPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT格式检查
    });

    it('应该在token中包含正确的payload', () => {
      const token = JwtUtils.generateAccessToken(mockPayload);
      const decoded = JwtUtils.decodeToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(mockPayload.userId);
      expect(decoded?.username).toBe(mockPayload.username);
      expect(decoded?.role).toBe(mockPayload.role);
    });
  });

  describe('generateRefreshToken', () => {
    it('应该生成有效的刷新token', () => {
      const token = JwtUtils.generateRefreshToken(mockPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('verifyAccessToken', () => {
    it('应该验证有效的访问token', () => {
      const token = JwtUtils.generateAccessToken(mockPayload);
      const decoded = JwtUtils.verifyAccessToken(token);
      
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.username).toBe(mockPayload.username);
      expect(decoded.role).toBe(mockPayload.role);
    });

    it('应该拒绝无效的token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => JwtUtils.verifyAccessToken(invalidToken)).toThrow('无效的Token');
    });

    it('应该拒绝黑名单中的token', () => {
      const token = JwtUtils.generateAccessToken(mockPayload);
      JwtUtils.revokeToken(token);
      
      expect(() => JwtUtils.verifyAccessToken(token)).toThrow('Token已被撤销');
    });
  });

  describe('verifyRefreshToken', () => {
    it('应该验证有效的刷新token', () => {
      const token = JwtUtils.generateRefreshToken(mockPayload);
      const decoded = JwtUtils.verifyRefreshToken(token);
      
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.username).toBe(mockPayload.username);
      expect(decoded.role).toBe(mockPayload.role);
    });

    it('应该拒绝黑名单中的刷新token', () => {
      const token = JwtUtils.generateRefreshToken(mockPayload);
      JwtUtils.revokeToken(token);
      
      expect(() => JwtUtils.verifyRefreshToken(token)).toThrow('Token已被撤销');
    });
  });

  describe('generateTokenPair', () => {
    it('应该生成访问token和刷新token对', () => {
      const tokens = JwtUtils.generateTokenPair(mockPayload);
      
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
    });

    it('生成的token对应该都是有效的', () => {
      const tokens = JwtUtils.generateTokenPair(mockPayload);
      
      const accessDecoded = JwtUtils.verifyAccessToken(tokens.accessToken);
      const refreshDecoded = JwtUtils.verifyRefreshToken(tokens.refreshToken);
      
      expect(accessDecoded.userId).toBe(mockPayload.userId);
      expect(refreshDecoded.userId).toBe(mockPayload.userId);
    });
  });

  describe('refreshAccessToken', () => {
    it('应该使用有效的刷新token生成新的token对', () => {
      const originalTokens = JwtUtils.generateTokenPair(mockPayload);
      const newTokens = JwtUtils.refreshAccessToken(originalTokens.refreshToken);
      
      expect(newTokens.accessToken).toBeDefined();
      expect(newTokens.refreshToken).toBeDefined();
      expect(newTokens.accessToken).not.toBe(originalTokens.accessToken);
      expect(newTokens.refreshToken).not.toBe(originalTokens.refreshToken);
    });

    it('应该撤销旧的刷新token', () => {
      const originalTokens = JwtUtils.generateTokenPair(mockPayload);
      JwtUtils.refreshAccessToken(originalTokens.refreshToken);
      
      // 旧的刷新token应该被撤销
      expect(() => JwtUtils.verifyRefreshToken(originalTokens.refreshToken))
        .toThrow('Token已被撤销');
    });
  });

  describe('decodeToken', () => {
    it('应该解码token而不验证签名', () => {
      const token = JwtUtils.generateAccessToken(mockPayload);
      const decoded = JwtUtils.decodeToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(mockPayload.userId);
      expect(decoded?.username).toBe(mockPayload.username);
    });

    it('应该在无效token时返回null', () => {
      const invalidToken = 'invalid.token';
      const decoded = JwtUtils.decodeToken(invalidToken);
      
      expect(decoded).toBeNull();
    });
  });

  describe('revokeToken', () => {
    it('应该将token添加到黑名单', () => {
      const token = JwtUtils.generateAccessToken(mockPayload);
      
      // token应该是有效的
      expect(() => JwtUtils.verifyAccessToken(token)).not.toThrow();
      
      // 撤销token
      JwtUtils.revokeToken(token);
      
      // token应该被拒绝
      expect(() => JwtUtils.verifyAccessToken(token)).toThrow('Token已被撤销');
    });
  });

  describe('isTokenExpiringSoon', () => {
    it('应该检测即将过期的token', () => {
      // 创建一个短期token用于测试
      process.env.JWT_ACCESS_EXPIRY = '1s';
      const token = JwtUtils.generateAccessToken(mockPayload);
      
      // 等待一段时间让token接近过期
      setTimeout(() => {
        const isExpiring = JwtUtils.isTokenExpiringSoon(token, 1);
        expect(isExpiring).toBe(true);
      }, 500);
      
      // 恢复原始设置
      process.env.JWT_ACCESS_EXPIRY = '15m';
    });
  });

  describe('getTokenRemainingTime', () => {
    it('应该返回token的剩余有效时间', () => {
      const token = JwtUtils.generateAccessToken(mockPayload);
      const remainingTime = JwtUtils.getTokenRemainingTime(token);
      
      expect(remainingTime).toBeGreaterThan(0);
      expect(remainingTime).toBeLessThanOrEqual(15 * 60); // 15分钟
    });

    it('应该为无效token返回0', () => {
      const invalidToken = 'invalid.token';
      const remainingTime = JwtUtils.getTokenRemainingTime(invalidToken);
      
      expect(remainingTime).toBe(0);
    });
  });
});