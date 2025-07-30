import { apiClient } from './api';

/**
 * 用户角色枚举
 */
export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer'
}

/**
 * 用户接口
 */
export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  avatar_url?: string | null;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 创建用户请求接口
 */
export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

/**
 * 更新用户请求接口
 */
export interface UpdateUserRequest {
  username?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
  avatar_url?: string;
}

/**
 * 用户列表响应接口
 */
export interface UserListResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * 用户搜索参数接口
 */
export interface UserSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  sortBy?: 'createdAt' | 'updatedAt' | 'username' | 'lastLoginAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * 用户活动日志接口
 */
export interface UserActivityLog {
  id: number;
  userId: number;
  action: string;
  resource: string;
  resourceId?: number;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

/**
 * 用户统计接口
 */
export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  byRole: Array<{ role: UserRole; count: number }>;
  recentRegistrations: Array<{ date: string; count: number }>;
  recentLogins: Array<{ date: string; count: number }>;
}

/**
 * 用户服务类
 */
class UserService {
  /**
   * 获取用户列表
   */
  async getUsers(params?: UserSearchParams): Promise<UserListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.role) queryParams.append('role', params.role);
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const queryString = queryParams.toString();
    const url = `/api/admin/users${queryString ? `?${queryString}` : ''}`;
    
    return await apiClient.get<UserListResponse>(url);
  }

  /**
   * 获取单个用户
   */
  async getUser(id: number): Promise<User> {
    return await apiClient.get<User>(`/api/admin/users/${id}`);
  }

  /**
   * 创建用户
   */
  async createUser(data: CreateUserRequest): Promise<User> {
    return await apiClient.post<User>('/api/admin/users', data);
  }

  /**
   * 更新用户
   */
  async updateUser(id: number, data: UpdateUserRequest): Promise<User> {
    return await apiClient.put<User>(`/api/admin/users/${id}`, data);
  }

  /**
   * 删除用户
   */
  async deleteUser(id: number): Promise<{ message: string }> {
    return await apiClient.delete<{ message: string }>(`/api/admin/users/${id}`);
  }

  /**
   * 批量删除用户
   */
  async deleteUsers(ids: number[]): Promise<{ message: string; deletedCount: number }> {
    return await apiClient.post<{ message: string; deletedCount: number }>('/api/admin/users/batch-delete', {
      ids
    });
  }

  /**
   * 激活用户
   */
  async activateUser(id: number): Promise<User> {
    return await apiClient.post<User>(`/api/admin/users/${id}/activate`);
  }

  /**
   * 停用用户
   */
  async deactivateUser(id: number): Promise<User> {
    return await apiClient.post<User>(`/api/admin/users/${id}/deactivate`);
  }

  /**
   * 重置用户密码
   */
  async resetUserPassword(id: number, newPassword?: string): Promise<{ message: string; password?: string }> {
    return await apiClient.post<{ message: string; password?: string }>(`/api/admin/users/${id}/reset-password`, {
      newPassword
    });
  }

  /**
   * 更改用户角色
   */
  async changeUserRole(id: number, role: UserRole): Promise<User> {
    return await apiClient.post<User>(`/api/admin/users/${id}/change-role`, {
      role
    });
  }

  /**
   * 获取用户活动日志
   */
  async getUserActivityLogs(params?: {
    userId?: number;
    page?: number;
    limit?: number;
    action?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{
    logs: UserActivityLog[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    
    if (params?.userId) queryParams.append('userId', params.userId.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.action) queryParams.append('action', params.action);
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo);

    const queryString = queryParams.toString();
    const url = `/api/admin/users/activity-logs${queryString ? `?${queryString}` : ''}`;
    
    return await apiClient.get(url);
  }

  /**
   * 获取用户统计信息
   */
  async getUserStats(): Promise<UserStats> {
    return await apiClient.get<UserStats>('/api/admin/users/stats');
  }

  /**
   * 搜索用户
   */
  async searchUsers(query: string, params?: {
    page?: number;
    limit?: number;
    role?: UserRole;
    isActive?: boolean;
  }): Promise<UserListResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('q', query);
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.role) queryParams.append('role', params.role);
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

    return await apiClient.get<UserListResponse>(`/api/admin/users/search?${queryParams.toString()}`);
  }

  /**
   * 导出用户数据
   */
  async exportUsers(format: 'csv' | 'excel', params?: UserSearchParams): Promise<Blob> {
    const queryParams = new URLSearchParams();
    
    if (params?.search) queryParams.append('search', params.search);
    if (params?.role) queryParams.append('role', params.role);
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

    const queryString = queryParams.toString();
    const url = `/api/admin/users/export/${format}${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiClient.getInstance().get(url, {
      responseType: 'blob'
    });
    return response.data;
  }

  /**
   * 批量导入用户
   */
  async importUsers(file: File): Promise<{
    success: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    return await apiClient.post('/api/admin/users/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * 发送邀请邮件
   */
  async sendInvitation(email: string, role: UserRole): Promise<{ message: string }> {
    return await apiClient.post<{ message: string }>('/api/admin/users/invite', {
      email,
      role
    });
  }

  /**
   * 格式化用户角色
   */
  formatRole(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN:
        return '管理员';
      case UserRole.EDITOR:
        return '编辑者';
      case UserRole.VIEWER:
        return '查看者';
      default:
        return '未知';
    }
  }

  /**
   * 获取角色颜色
   */
  getRoleColor(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN:
        return 'red';
      case UserRole.EDITOR:
        return 'blue';
      case UserRole.VIEWER:
        return 'green';
      default:
        return 'default';
    }
  }

  /**
   * 获取角色权限描述
   */
  getRoleDescription(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN:
        return '拥有系统的完全访问权限，可以管理用户、文档和系统设置';
      case UserRole.EDITOR:
        return '可以创建、编辑和发布文档，管理文档内容';
      case UserRole.VIEWER:
        return '只能查看已发布的文档，无法编辑或管理内容';
      default:
        return '未知角色';
    }
  }

  /**
   * 验证用户名
   */
  validateUsername(username: string): { isValid: boolean; error?: string } {
    if (!username || username.trim().length === 0) {
      return { isValid: false, error: '用户名不能为空' };
    }
    
    if (username.length < 3) {
      return { isValid: false, error: '用户名至少3个字符' };
    }
    
    if (username.length > 50) {
      return { isValid: false, error: '用户名最多50个字符' };
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return { isValid: false, error: '用户名只能包含字母、数字、下划线和连字符' };
    }
    
    return { isValid: true };
  }

  /**
   * 验证邮箱
   */
  validateEmail(email: string): { isValid: boolean; error?: string } {
    if (!email || email.trim().length === 0) {
      return { isValid: false, error: '邮箱不能为空' };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: '请输入有效的邮箱地址' };
    }
    
    return { isValid: true };
  }

  /**
   * 生成随机密码
   */
  generateRandomPassword(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }
}

// 导出用户服务实例
export const userService = new UserService();