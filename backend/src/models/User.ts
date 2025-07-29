import bcrypt from 'bcryptjs';
import { 
  UserEntity, 
  UserResponse, 
  CreateUserRequest, 
  UpdateUserRequest,
  UserRole,
  UserStatus 
} from '@/types/user';

/**
 * 用户模型类
 */
export class User {
  public id: number;
  public username: string;
  public email: string;
  public password_hash: string;
  public role: UserRole;
  public is_active: boolean;
  public avatar_url?: string;
  public last_login_at?: Date;
  public login_attempts?: number;
  public locked_until?: Date;
  public created_at: Date;
  public updated_at: Date;

  /**
   * 构造函数
   */
  constructor(data: UserEntity) {
    this.id = data.id;
    this.username = data.username;
    this.email = data.email;
    this.password_hash = data.password_hash;
    this.role = data.role;
    this.is_active = data.is_active;
    this.avatar_url = data.avatar_url;
    this.last_login_at = data.last_login_at;
    this.login_attempts = data.login_attempts;
    this.locked_until = data.locked_until;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * 从创建请求创建用户实例
   */
  static async fromCreateRequest(data: CreateUserRequest): Promise<Partial<UserEntity>> {
    const hashedPassword = await User.hashPassword(data.password);
    const now = new Date();
    
    return {
      username: data.username,
      email: data.email,
      password_hash: hashedPassword,
      role: data.role || UserRole.VIEWER,
      is_active: true,
      avatar_url: data.avatar_url,
      login_attempts: 0,
      created_at: now,
      updated_at: now
    };
  }

  /**
   * 从更新请求创建更新数据
   */
  static async fromUpdateRequest(data: UpdateUserRequest): Promise<Partial<UserEntity>> {
    const updateData: Partial<UserEntity> = {
      updated_at: new Date()
    };

    if (data.username !== undefined) {
      updateData.username = data.username;
    }
    
    if (data.email !== undefined) {
      updateData.email = data.email;
    }
    
    if (data.password !== undefined) {
      updateData.password_hash = await User.hashPassword(data.password);
    }
    
    if (data.role !== undefined) {
      updateData.role = data.role;
    }
    
    if (data.status !== undefined) {
      updateData.is_active = data.status === UserStatus.ACTIVE;
    }
    
    if (data.avatar_url !== undefined) {
      updateData.avatar_url = data.avatar_url;
    }

    return updateData;
  }

  /**
   * 转换为响应格式（移除敏感信息）
   */
  toResponse(): UserResponse {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      role: this.role,
      is_active: this.is_active,
      avatar_url: this.avatar_url,
      last_login_at: this.last_login_at,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  /**
   * 验证密码
   */
  async verifyPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password_hash);
  }

  /**
   * 更新最后登录时间
   */
  updateLastLogin(): void {
    this.last_login_at = new Date();
    this.updated_at = new Date();
  }

  /**
   * 检查用户是否激活
   */
  isActive(): boolean {
    return this.is_active;
  }

  /**
   * 检查用户是否有管理员权限
   */
  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  /**
   * 检查用户是否有编辑权限
   */
  canEdit(): boolean {
    return this.role === UserRole.ADMIN || this.role === UserRole.EDITOR;
  }

  /**
   * 哈希密码
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * 验证密码强度
   */
  static validatePasswordStrength(password: string): boolean {
    // 至少6个字符，包含大小写字母和数字
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    return passwordRegex.test(password);
  }

  /**
   * 生成随机密码
   */
  static generateRandomPassword(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // 确保包含至少一个小写字母、大写字母和数字
    password += 'a'; // 小写字母
    password += 'A'; // 大写字母
    password += '1'; // 数字
    
    // 填充剩余字符
    for (let i = 3; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    // 打乱字符顺序
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}