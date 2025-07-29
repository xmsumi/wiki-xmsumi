# Wiki知识库后端API

这是Wiki知识库系统的后端API服务，基于Node.js + Express + TypeScript构建。

## 功能特性

- 🔐 JWT用户认证和权限管理
- 📝 文档CRUD操作和版本控制
- 📁 目录结构管理
- 🔍 全文搜索功能
- 📎 文件上传和管理
- 🛡️ 安全防护和输入验证
- 📊 日志记录和错误处理
- 🧪 完整的测试覆盖

## 技术栈

- **运行时**: Node.js 18+
- **框架**: Express.js
- **语言**: TypeScript
- **数据库**: MySQL
- **搜索**: Elasticsearch
- **认证**: JWT + bcrypt
- **测试**: Jest + Supertest
- **代码规范**: ESLint + Prettier

## 快速开始

### 环境要求

- Node.js 18.0+
- MySQL 8.0+
- Elasticsearch 8.0+ (可选)

### 安装依赖

```bash
npm install
```

### 环境配置

复制环境变量模板并配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置数据库连接和其他参数。

### 数据库初始化

```bash
# 创建数据库和表结构
npm run db:migrate

# 插入种子数据
npm run db:seed
```

### 启动开发服务器

```bash
npm run dev
```

服务器将在 http://localhost:3001 启动。

## 可用脚本

- `npm run dev` - 启动开发服务器（热重载）
- `npm run build` - 构建生产版本
- `npm run start` - 启动生产服务器
- `npm run test` - 运行测试
- `npm run test:watch` - 监视模式运行测试
- `npm run lint` - 代码检查
- `npm run lint:fix` - 自动修复代码问题
- `npm run format` - 格式化代码

## API文档

### 认证接口

- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户注销
- `GET /api/auth/profile` - 获取用户信息

### 文档管理

- `GET /api/documents` - 获取文档列表
- `GET /api/documents/:id` - 获取单个文档
- `POST /api/documents` - 创建文档
- `PUT /api/documents/:id` - 更新文档
- `DELETE /api/documents/:id` - 删除文档

### 目录管理

- `GET /api/directories` - 获取目录结构
- `POST /api/directories` - 创建目录
- `PUT /api/directories/:id` - 更新目录
- `DELETE /api/directories/:id` - 删除目录

### 搜索功能

- `GET /api/search?q=keyword` - 全文搜索

### 文件管理

- `POST /api/files/upload` - 文件上传
- `GET /api/files/:id` - 文件下载
- `DELETE /api/files/:id` - 删除文件

## 项目结构

```
backend/
├── src/
│   ├── config/          # 配置文件
│   ├── controllers/     # 控制器
│   ├── middleware/      # 中间件
│   ├── models/          # 数据模型
│   ├── routes/          # 路由定义
│   ├── services/        # 业务逻辑
│   ├── utils/           # 工具函数
│   ├── types/           # 类型定义
│   ├── tests/           # 测试文件
│   └── index.ts         # 应用入口
├── dist/                # 编译输出
├── logs/                # 日志文件
├── uploads/             # 上传文件
└── package.json
```

## 开发规范

### 代码风格

- 使用TypeScript严格模式
- 遵循ESLint和Prettier规则
- 函数和类必须有中文注释
- 变量和函数名使用英文，注释使用中文

### 提交规范

- feat: 新功能
- fix: 修复bug
- docs: 文档更新
- style: 代码格式调整
- refactor: 代码重构
- test: 测试相关
- chore: 构建工具或辅助工具的变动

## 部署

### Docker部署

```bash
# 构建镜像
docker build -t wiki-backend .

# 运行容器
docker run -p 3001:3001 --env-file .env wiki-backend
```

### PM2部署

```bash
# 构建项目
npm run build

# 使用PM2启动
pm2 start ecosystem.config.js
```

## 许可证

MIT License