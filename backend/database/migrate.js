const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * 数据库迁移脚本
 */
class DatabaseMigrator {
  constructor() {
    this.config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'wiki_knowledge_base',
      multipleStatements: true,
    };
    
    this.migrationsDir = path.join(__dirname, 'migrations');
    this.seedsDir = path.join(__dirname, 'seeds');
  }

  /**
   * 创建数据库连接
   */
  async createConnection() {
    try {
      // 先连接到MySQL服务器（不指定数据库）
      const serverConnection = await mysql.createConnection({
        ...this.config,
        database: undefined,
      });

      // 创建数据库（如果不存在）
      await serverConnection.execute(
        `CREATE DATABASE IF NOT EXISTS \`${this.config.database}\` 
         CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
      
      console.log(`数据库 ${this.config.database} 已创建或已存在`);
      await serverConnection.end();

      // 连接到指定数据库
      const connection = await mysql.createConnection(this.config);
      console.log('数据库连接成功');
      return connection;
    } catch (error) {
      console.error('数据库连接失败:', error.message);
      throw error;
    }
  }

  /**
   * 创建迁移记录表
   */
  async createMigrationsTable(connection) {
    const sql = `
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_filename (filename)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    
    await connection.execute(sql);
    console.log('迁移记录表已创建');
  }

  /**
   * 获取已执行的迁移
   */
  async getExecutedMigrations(connection) {
    const [rows] = await connection.execute(
      'SELECT filename FROM migrations ORDER BY filename'
    );
    return rows.map(row => row.filename);
  }

  /**
   * 执行迁移文件
   */
  async executeMigration(connection, filename) {
    const filePath = path.join(this.migrationsDir, filename);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    try {
      await connection.execute(sql);
      await connection.execute(
        'INSERT INTO migrations (filename) VALUES (?)',
        [filename]
      );
      console.log(`✓ 迁移已执行: ${filename}`);
    } catch (error) {
      console.error(`✗ 迁移执行失败: ${filename}`, error.message);
      throw error;
    }
  }

  /**
   * 执行种子数据文件
   */
  async executeSeed(connection, filename) {
    const filePath = path.join(this.seedsDir, filename);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    try {
      await connection.execute(sql);
      console.log(`✓ 种子数据已执行: ${filename}`);
    } catch (error) {
      console.error(`✗ 种子数据执行失败: ${filename}`, error.message);
      throw error;
    }
  }

  /**
   * 运行迁移
   */
  async migrate() {
    const connection = await this.createConnection();
    
    try {
      await this.createMigrationsTable(connection);
      
      // 获取所有迁移文件
      const migrationFiles = fs.readdirSync(this.migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();
      
      // 获取已执行的迁移
      const executedMigrations = await this.getExecutedMigrations(connection);
      
      // 执行未执行的迁移
      const pendingMigrations = migrationFiles.filter(
        file => !executedMigrations.includes(file)
      );
      
      if (pendingMigrations.length === 0) {
        console.log('没有待执行的迁移');
        return;
      }
      
      console.log(`发现 ${pendingMigrations.length} 个待执行的迁移`);
      
      for (const filename of pendingMigrations) {
        await this.executeMigration(connection, filename);
      }
      
      console.log('所有迁移执行完成');
    } finally {
      await connection.end();
    }
  }

  /**
   * 运行种子数据
   */
  async seed() {
    const connection = await this.createConnection();
    
    try {
      // 获取所有种子文件
      const seedFiles = fs.readdirSync(this.seedsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();
      
      if (seedFiles.length === 0) {
        console.log('没有种子数据文件');
        return;
      }
      
      console.log(`发现 ${seedFiles.length} 个种子数据文件`);
      
      for (const filename of seedFiles) {
        await this.executeSeed(connection, filename);
      }
      
      console.log('所有种子数据执行完成');
    } finally {
      await connection.end();
    }
  }

  /**
   * 重置数据库
   */
  async reset() {
    const connection = await this.createConnection();
    
    try {
      console.log('警告: 即将删除所有数据库表！');
      
      // 禁用外键检查
      await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
      
      // 获取所有表
      const [tables] = await connection.execute(
        `SELECT table_name FROM information_schema.tables 
         WHERE table_schema = ?`,
        [this.config.database]
      );
      
      // 删除所有表
      for (const table of tables) {
        await connection.execute(`DROP TABLE IF EXISTS \`${table.table_name}\``);
        console.log(`✓ 表已删除: ${table.table_name}`);
      }
      
      // 启用外键检查
      await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
      
      console.log('数据库重置完成');
    } finally {
      await connection.end();
    }
  }
}

// 命令行处理
async function main() {
  const migrator = new DatabaseMigrator();
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'migrate':
        await migrator.migrate();
        break;
      case 'seed':
        await migrator.seed();
        break;
      case 'reset':
        await migrator.reset();
        break;
      case 'fresh':
        await migrator.reset();
        await migrator.migrate();
        await migrator.seed();
        break;
      default:
        console.log('用法:');
        console.log('  node migrate.js migrate  - 运行迁移');
        console.log('  node migrate.js seed     - 运行种子数据');
        console.log('  node migrate.js reset    - 重置数据库');
        console.log('  node migrate.js fresh    - 重置并重新初始化数据库');
        process.exit(1);
    }
  } catch (error) {
    console.error('执行失败:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = DatabaseMigrator;