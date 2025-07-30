import { apiClient } from './api';
import { User } from '@/store/authStore';

/**
 * 登录请求接口
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * 登录响应接口
 */
export interface LoginResponse {
  user: User;
  accessToken: string;
  expiresIn: number;
}

/**
 * 注册请求接口
 */
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

/**
 * 注册响应接口
 */
export interface RegisterResponse {
  user: User;
  message: string;
}

/**
 * 密码修改请求接口
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * 用户信息更新请求接口
 */
export interface UpdateProfileRequest {
  username?: string;
  email?: string;
  avatar_url?: string;
}

/**
 * 密码强度检查响应接口
 */
export interface PasswordStrengthResponse {
  score: number;
  level: 'weak' | 'fair' | 'good' | 'strong';
  feedback: string[];
}

/**
 * 认证服务类
 */
class AuthService {
  /**
   * 用户登录
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return await apiClient.post<LoginResponse>('/api/auth/login', credentials);
  }

  /**
   * 用户注册
   */
  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    return await apiClient.post<RegisterResponse>('/api/auth/register', userData);
  }

  /**
   * 用户注销
   */
  async logout(): Promise<{ message: string }> {
    return await apiClient.post<{ message: string }>('/api/auth/logout');
  }

  /**
   * 获取用户信息
   */
  async getProfile(): Promise<User> {
    return await apiClient.get<User>('/api/auth/profile');
  }

  /**
   * 更新用户信息
   */
  async updateProfile(updateData: UpdateProfileRequest): Promise<User> {
    return await apiClient.put<User>('/api/auth/profile', updateData);
  }

  /**
   * 修改密码
   */
  async changePassword(passwordData: ChangePasswordRequest): Promise<{ message: string }> {
    return await apiClient.post<{ message: string }>('/api/auth/change-password', passwordData);
  }

  /**
   * 刷新访问token
   */
  async refreshToken(): Promise<{ accessToken: string; expiresIn: number }> {
    return await apiClient.post<{ accessToken: string; expiresIn: number }>('/api/auth/refresh-token');
  }

  /**
   * 验证token有效性
   */
  async validateToken(): Promise<{
    isValid: boolean;
    payload?: any;
    user?: User;
  }> {
    return await apiClient.post<{
      isValid: boolean;
      payload?: any;
      user?: User;
    }>('/api/auth/validate-token');
  }

  /**
   * 检查密码强度
   */
  async checkPasswordStrength(password: string): Promise<PasswordStrengthResponse> {
    return await apiClient.post<PasswordStrengthResponse>('/api/auth/check-password-strength', {
      password
    });
  }

  /**
   * 生成随机密码
   */
  async generatePassword(length: number = 12): Promise<{ password: string; length: number }> {
    return await apiClient.get<{ password: string; length: number }>(`/api/auth/generate-password?length=${length}`);
  }
}

// 导出认证服务实例
export const authService = new AuthService();