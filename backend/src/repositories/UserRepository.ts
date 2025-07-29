import { db } from '@/config/database';
import { User } from '@/models/User';
import { 
  UserEntity, 
  CreateUserRequest, 
  UpdateUserRequest, 
  UserQueryOptions,
  UserRole,
  UserStatus 
} from '@/types/user';
import { logger } from '@/utils/logger';

/**
 * 用户数据访问层
 */
export class UserRepository {
  private tableName = 'users';

  /**
   * 创建用户
   */
  async create(userData: CreateUserRequest): Promise<User> {
    try {
      const userEntity = await User.fromCreateRequest(userData);
      
      const sql = `
        INSERT INTO ${this.tableName} 
        (username, email, password_hash, role, is_active, avatar_url, login_attempts, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        userEntity.username,
        userEntity.email,
        userEntity.password_hash,
        userEntity.role,
        userEntity.is_active,
        userEntity.avatar_url || null,
        userEntity.login_attempts || 0,
        userEntity.created_at,
        userEntity.updated_at
      ];

      const result = await db.query(sql, params);
      const userId = result.insertId;

      logger.info(`用户创建成功: ${userData.username} (ID: ${userId})`);
      
      // 返回创建的用户
      const createdUser = await this.findById(userId);
      if (!createdUser) {
        throw new Error('创建用户后无法找到用户记录');
      }
      
      return createdUser;
    } catch (error) {
      logger.error('创建用户失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID查找用户
   */
  async findById(id: number): Promise<User | null> {
    try {
      const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
      const results = await db.query(sql, [id]);
      
      if (results.length === 0) {
        return null;
      }
      
      return new User(results[0] as UserEntity);
    } catch (error) {
      logger.error(`根据ID查找用户失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 根据用户名查找用户
   */
  async findByUsername(username: string): Promise<User | null> {
    try {
      const sql = `SELECT * FROM ${this.tableName} WHERE username = ?`;
      const results = await db.query(sql, [username]);
      
      if (results.length === 0) {
        return null;
      }
      
      return new User(results[0] as UserEntity);
    } catch (error) {
      logger.error(`根据用户名查找用户失败 (username: ${username}):`, error);
      throw error;
    }
  }

  /**
   * 根据邮箱查找用户
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const sql = `SELECT * FROM ${this.tableName} WHERE email = ?`;
      const results = await db.query(sql, [email]);
      
      if (results.length === 0) {
        return null;
      }
      
      return new User(results[0] as UserEntity);
    } catch (error) {
      logger.error(`根据邮箱查找用户失败 (email: ${email}):`, error);
      throw error;
    }
  }

  /**
   * 查找所有用户（支持分页和筛选）
   */
  async findAll(options: UserQueryOptions = {}): Promise<{ users: User[]; total: number }> {
    try {
      const { limit = 10, offset = 0 } = options;
      
      // 构建WHERE条件
      const conditions: string[] = [];
      const params: any[] = [];
      
      if (options.id) {
        conditions.push('id = ?');
        params.push(options.id);
      }
      
      if (options.username) {
        conditions.push('username LIKE ?');
        params.push(`%${options.username}%`);
      }
      
      if (options.email) {
        conditions.push('email LIKE ?');
        params.push(`%${options.email}%`);
      }
      
      if (options.role) {
        conditions.push('role = ?');
        params.push(options.role);
      }
      
      if (options.is_active !== undefined) {
        conditions.push('is_active = ?');
        params.push(options.is_active);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      
      // 查询总数
      const countSql = `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}`;
      const countResult = await db.query(countSql, params);
      const total = countResult[0].total;
      
      // 查询数据
      const dataSql = `
        SELECT * FROM ${this.tableName} 
        ${whereClause} 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `;
      const dataParams = [...params, limit, offset];
      const results = await db.query(dataSql, dataParams);
      
      const users = results.map((row: UserEntity) => new User(row));
      
      return { users, total };
    } catch (error) {
      logger.error('查找用户列表失败:', error);
      throw error;
    }
  }

  /**
   * 更新用户
   */
  async update(id: number, userData: UpdateUserRequest): Promise<User | null> {
    try {
      const updateData = await User.fromUpdateRequest(userData);
      
      // 构建更新字段
      const fields: string[] = [];
      const params: any[] = [];
      
      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          fields.push(`${key} = ?`);
          params.push(value);
        }
      });
      
      if (fields.length === 0) {
        throw new Error('没有要更新的字段');
      }
      
      params.push(id);
      
      const sql = `UPDATE ${this.tableName} SET ${fields.join(', ')} WHERE id = ?`;
      const result = await db.query(sql, params);
      
      if (result.affectedRows === 0) {
        return null;
      }
      
      logger.info(`用户更新成功 (ID: ${id})`);
      
      // 返回更新后的用户
      return await this.findById(id);
    } catch (error) {
      logger.error(`更新用户失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 删除用户（软删除）
   */
  async delete(id: number): Promise<boolean> {
    try {
      const sql = `UPDATE ${this.tableName} SET is_active = ?, updated_at = ? WHERE id = ?`;
      const params = [false, new Date(), id];
      
      const result = await db.query(sql, params);
      
      if (result.affectedRows === 0) {
        return false;
      }
      
      logger.info(`用户软删除成功 (ID: ${id})`);
      return true;
    } catch (error) {
      logger.error(`删除用户失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 物理删除用户
   */
  async hardDelete(id: number): Promise<boolean> {
    try {
      const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
      const result = await db.query(sql, [id]);
      
      if (result.affectedRows === 0) {
        return false;
      }
      
      logger.info(`用户物理删除成功 (ID: ${id})`);
      return true;
    } catch (error) {
      logger.error(`物理删除用户失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 更新用户最后登录时间
   */
  async updateLastLogin(id: number): Promise<boolean> {
    try {
      const sql = `UPDATE ${this.tableName} SET last_login_at = ?, updated_at = ? WHERE id = ?`;
      const now = new Date();
      const result = await db.query(sql, [now, now, id]);
      
      return result.affectedRows > 0;
    } catch (error) {
      logger.error(`更新用户最后登录时间失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 检查用户名是否存在
   */
  async existsByUsername(username: string, excludeId?: number): Promise<boolean> {
    try {
      let sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE username = ?`;
      const params: any[] = [username];
      
      if (excludeId) {
        sql += ' AND id != ?';
        params.push(excludeId);
      }
      
      const result = await db.query(sql, params);
      return result[0].count > 0;
    } catch (error) {
      logger.error(`检查用户名是否存在失败 (username: ${username}):`, error);
      throw error;
    }
  }

  /**
   * 检查邮箱是否存在
   */
  async existsByEmail(email: string, excludeId?: number): Promise<boolean> {
    try {
      let sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE email = ?`;
      const params: any[] = [email];
      
      if (excludeId) {
        sql += ' AND id != ?';
        params.push(excludeId);
      }
      
      const result = await db.query(sql, params);
      return result[0].count > 0;
    } catch (error) {
      logger.error(`检查邮箱是否存在失败 (email: ${email}):`, error);
      throw error;
    }
  }

  /**
   * 根据角色获取用户数量
   */
  async countByRole(role: UserRole): Promise<number> {
    try {
      const sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE role = ? AND is_active = ?`;
      const result = await db.query(sql, [role, true]);
      return result[0].count;
    } catch (error) {
      logger.error(`根据角色统计用户数量失败 (role: ${role}):`, error);
      throw error;
    }
  }

  /**
   * 获取活跃用户数量
   */
  async countActiveUsers(): Promise<number> {
    try {
      const sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE is_active = ?`;
      const result = await db.query(sql, [true]);
      return result[0].count;
    } catch (error) {
      logger.error('统计活跃用户数量失败:', error);
      throw error;
    }
  }
}