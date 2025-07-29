/**
 * 用户角色枚举
 */
export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer'
}

/**
 * 用户状态枚举
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

/**
 * 用户数据库实体接口
 */
export interface UserEntity {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: UserRole;
  is_active: boolean;
  avatar_url?: string;
  last_login_at?: Date;
  login_attempts?: number;
  locked_until?: Date;
  created_at: Date;
  updated_at: Date;
}

/**
 * 创建用户请求接口
 */
export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
  avatar_url?: string;
}

/**
 * 更新用户请求接口
 */
export interface UpdateUserRequest {
  username?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  status?: UserStatus;
  avatar_url?: string;
}

/**
 * 用户响应接口（不包含敏感信息）
 */
export interface UserResponse {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  avatar_url?: string;
  last_login_at?: Date;
  created_at: Date;
  updated_at: Date;
}

/**
 * 用户查询条件接口
 */
export interface UserQueryOptions {
  id?: number;
  username?: string;
  email?: string;
  role?: UserRole;
  is_active?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * 登录凭据接口
 */
export interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * JWT载荷接口
 */
export interface JwtPayload {
  userId: number;
  username: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}