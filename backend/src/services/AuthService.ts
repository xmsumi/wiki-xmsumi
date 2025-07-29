import { UserRepository } from '@/repositories/UserRepository';
import { User } from '@/models/User';
import { JwtUtils } from '@/utils/jwt';
import { PasswordUtils } from '@/utils/password';
import { 
  CreateUserRequest, 
  LoginCredentials, 
  UserResponse, 
  JwtPayload,
  UserRole 
} from '@/types/user';
import { logger } from '@/utils/logger';

/**
 * 登录响应接口
 */
export interface LoginResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * 注册响应接口
 */
export interface RegisterResponse {
  user: UserResponse;
  message: string;
}

/**
 * Token刷新响应接口
 */
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * 认证服务类
 */
export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * 用户登录
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const { username, password } = credentials;

      // 查找用户
      const user = await this.userRepository.findByUsername(username);
      if (!user) {
        logger.warn(`登录失败: 用户不存在 (${username})`);
        throw new Error('用户名或密码错误');
      }

      // 检查用户是否激活
      if (!user.isActive()) {
        logger.warn(`登录失败: 用户账户已禁用 (${username})`);
        throw new Error('用户账户已被禁用');
      }

      // 验证密码
      const isPasswordValid = await user.verifyPassword(password);
      if (!isPasswordValid) {
        logger.warn(`登录失败: 密码错误 (${username})`);
        throw new Error('用户名或密码错误');
      }

      // 更新最后登录时间
      await this.userRepository.updateLastLogin(user.id);
      user.updateLastLogin();

      // 生成token
      const tokenPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
        userId: user.id,
        username: user.username,
        role: user.role
      };

      const { accessToken, refreshToken } = JwtUtils.generateTokenPair(tokenPayload);

      logger.info(`用户登录成功: ${username} (ID: ${user.id})`);

      return {
        user: user.toResponse(),
        accessToken,
        refreshToken,
        expiresIn: 15 * 60 // 15分钟（秒）
      };
    } catch (error) {
      logger.error('用户登录失败:', error);
      throw error;
    }
  }

  /**
   * 用户注册
   */
  async register(userData: CreateUserRequest): Promise<RegisterResponse> {
    try {
      // 检查用户名是否已存在
      const existingUserByUsername = await this.userRepository.findByUsername(userData.username);
      if (existingUserByUsername) {
        throw new Error('用户名已存在');
      }

      // 检查邮箱是否已存在
      const existingUserByEmail = await this.userRepository.findByEmail(userData.email);
      if (existingUserByEmail) {
        throw new Error('邮箱已被使用');
      }

      // 验证密码强度
      const passwordValidation = PasswordUtils.validatePasswordStrength(userData.password);
      if (!passwordValidation.isValid) {
        throw new Error(`密码强度不足: ${passwordValidation.errors.join(', ')}`);
      }

      // 创建用户
      const newUser = await this.userRepository.create(userData);

      logger.info(`用户注册成功: ${userData.username} (ID: ${newUser.id})`);

      return {
        user: newUser.toResponse(),
        message: '用户注册成功'
      };
    } catch (error) {
      logger.error('用户注册失败:', error);
      throw error;
    }
  }

  /**
   * 刷新访问token
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      const { accessToken, refreshToken: newRefreshToken } = JwtUtils.refreshAccessToken(refreshToken);

      logger.info('Token刷新成功');

      return {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: 15 * 60 // 15分钟（秒）
      };
    } catch (error) {
      logger.error('Token刷新失败:', error);
      throw error;
    }
  }

  /**
   * 用户注销
   */
  async logout(accessToken: string, refreshToken?: string): Promise<void> {
    try {
      // 将token添加到黑名单
      JwtUtils.revokeToken(accessToken);
      if (refreshToken) {
        JwtUtils.revokeToken(refreshToken);
      }

      logger.info('用户注销成功');
    } catch (error) {
      logger.error('用户注销失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户信息
   */
  async getProfile(userId: number): Promise<UserResponse> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      return user.toResponse();
    } catch (error) {
      logger.error('获取用户信息失败:', error);
      throw error;
    }
  }

  /**
   * 更新用户信息
   */
  async updateProfile(userId: number, updateData: {
    username?: string;
    email?: string;
    avatar_url?: string;
  }): Promise<UserResponse> {
    try {
      // 检查用户名是否已被其他用户使用
      if (updateData.username) {
        const existingUser = await this.userRepository.findByUsername(updateData.username);
        if (existingUser && existingUser.id !== userId) {
          throw new Error('用户名已被使用');
        }
      }

      // 检查邮箱是否已被其他用户使用
      if (updateData.email) {
        const existingUser = await this.userRepository.findByEmail(updateData.email);
        if (existingUser && existingUser.id !== userId) {
          throw new Error('邮箱已被使用');
        }
      }

      const updatedUser = await this.userRepository.update(userId, updateData);
      if (!updatedUser) {
        throw new Error('用户不存在');
      }

      logger.info(`用户信息更新成功 (ID: ${userId})`);

      return updatedUser.toResponse();
    } catch (error) {
      logger.error('更新用户信息失败:', error);
      throw error;
    }
  }

  /**
   * 修改密码
   */
  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      // 验证当前密码
      const isCurrentPasswordValid = await user.verifyPassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new Error('当前密码错误');
      }

      // 验证新密码强度
      const passwordValidation = PasswordUtils.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        throw new Error(`新密码强度不足: ${passwordValidation.errors.join(', ')}`);
      }

      // 更新密码
      await this.userRepository.update(userId, { password: newPassword });

      logger.info(`用户密码修改成功 (ID: ${userId})`);
    } catch (error) {
      logger.error('修改密码失败:', error);
      throw error;
    }
  }

  /**
   * 验证token有效性
   */
  async validateToken(token: string): Promise<{
    isValid: boolean;
    payload?: JwtPayload;
    user?: UserResponse;
  }> {
    try {
      const payload = JwtUtils.verifyAccessToken(token);
      const user = await this.userRepository.findById(payload.userId);

      if (!user || !user.isActive()) {
        return { isValid: false };
      }

      return {
        isValid: true,
        payload,
        user: user.toResponse()
      };
    } catch (error) {
      return { isValid: false };
    }
  }

  /**
   * 获取密码强度评估
   */
  getPasswordStrength(password: string): {
    score: number;
    level: 'weak' | 'fair' | 'good' | 'strong';
    feedback: string[];
  } {
    return PasswordUtils.calculatePasswordStrength(password);
  }

  /**
   * 生成随机密码
   */
  generateRandomPassword(length: number = 12): string {
    return PasswordUtils.generateRandomPassword(length);
  }

  /**
   * 检查用户是否有特定权限
   */
  async hasPermission(userId: number, requiredRole: UserRole): Promise<boolean> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user || !user.isActive()) {
        return false;
      }

      // 管理员拥有所有权限
      if (user.role === UserRole.ADMIN) {
        return true;
      }

      // 编辑者权限检查
      if (requiredRole === UserRole.EDITOR) {
        return user.role === UserRole.EDITOR;
      }

      // 查看者权限检查
      if (requiredRole === UserRole.VIEWER) {
        return user.role === UserRole.VIEWER || user.role === UserRole.EDITOR;
      }

      return false;
    } catch (error) {
      logger.error('权限检查失败:', error);
      return false;
    }
  }
}