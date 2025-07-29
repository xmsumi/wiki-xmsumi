# Wiki知识库系统

一个基于Node.js + Next.js构建的专业知识管理系统，支持文档管理、搜索、协作等功能。

## 项目结构

```
wiki-knowledge-base/
├── backend/                 # 后端API服务
│   ├── src/                # 源代码
│   │   ├── config/         # 配置文件
│   │   ├── controllers/    # 控制器
│   │   ├── middleware/     # 中间件
│   │   ├── models/         # 数据模型
│   │   ├── routes/         # 路由定义
│   │   ├── services/       # 业务逻辑
│   │   ├── utils/          # 工具函数
│   │   ├── types/          # 类型定义
│   │   └── tests/          # 测试文件
│   ├── database/           # 数据库相关
│   │   ├── migrations/     # 数据库迁移
│   │   └── seeds/          # 种子数据
│   └── package.json
├── frontend/               # 前端应用
│   ├── src/               # 源代码
│   │   ├── components/    # React组件
│   │   ├── pages/         # 页面组件
│   │   ├── store/         # 状态管理
│   │   ├── services/      # API服务
│   │   ├── utils/         # 工具函数
│   │   ├── types/         # 类型定义
│   │   └── styles/        # 样式文件
│   └── package.json
└── .kiro/                 # Kiro配置
    └── specs/             # 功能规格
```

## 技术栈

### 后端
- **运行时**: Node.js 18+
- **框架**: Express.js + TypeScript
- **数据库**: MySQL 8.0+
- **搜索**: Elasticsearch (可选)
- **认证**: JWT + bcrypt
- **测试**: Jest + Supertest

### 前端
- **框架**: Next.js 14 + React 18
- **UI库**: Ant Design + Tailwind CSS
- **状态管理**: Zustand
- **HTTP客户端**: Axios + React Query
- **测试**: Jest + Testing Library

## 快速开始

### 环境要求

- Node.js 18.0+
- MySQL 8.0+
- npm 或 yarn

### 1. 克隆项目

```bash
git clone <repository-url>
cd wiki-knowledge-base
```

### 2. 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 3. 配置环境变量

```bash
# 后端环境配置
cp backend/.env.example backend/.env
# 编辑 backend/.env 文件，配置数据库连接等参数

# 前端环境配置（如需要）
cp frontend/.env.example frontend/.env
```

### 4. 初始化数据库

```bash
cd backend
npm run db:fresh  # 创建数据库、运行迁移和种子数据
```

### 5. 启动服务

```bash
# 启动后端服务 (端口: 3001)
cd backend
npm run dev

# 启动前端服务 (端口: 3000)
cd frontend
npm run dev
```

### 6. 访问应用

- 前端应用: http://localhost:3000
- 后端API: http://localhost:3001
- API健康检查: http://localhost:3001/health

## 默认账号

系统初始化后会创建以下测试账号：

- **管理员**: admin / admin123
- **编辑者**: editor / editor123  
- **查看者**: viewer / viewer123

> ⚠️ 生产环境请务必修改默认密码！

## 主要功能

- ✅ 用户认证和权限管理
- ✅ 文档CRUD操作
- ✅ 层级目录管理
- ✅ Markdown内容支持
- ✅ 文件上传管理
- ✅ 全文搜索功能
- ✅ 响应式设计
- ✅ 版本控制
- ✅ 系统设置

## 开发命令

### 后端

```bash
cd backend

# 开发
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器

# 测试
npm run test         # 运行测试
npm run test:watch   # 监视模式测试

# 代码质量
npm run lint         # 代码检查
npm run lint:fix     # 自动修复
npm run format       # 格式化代码

# 数据库
npm run db:migrate   # 运行迁移
npm run db:seed      # 运行种子数据
npm run db:reset     # 重置数据库
npm run db:fresh     # 重置并重新初始化
```

### 前端

```bash
cd frontend

# 开发
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器

# 测试
npm run test         # 运行测试
npm run test:watch   # 监视模式测试

# 代码质量
npm run lint         # 代码检查
npm run lint:fix     # 自动修复
npm run type-check   # 类型检查
```

## 部署

### Docker部署

```bash
# 构建镜像
docker build -t wiki-backend ./backend
docker build -t wiki-frontend ./frontend

# 使用docker-compose
docker-compose up -d
```

### 传统部署

1. 构建项目
```bash
cd backend && npm run build
cd frontend && npm run build
```

2. 配置生产环境变量

3. 启动服务
```bash
# 后端
cd backend && npm start

# 前端
cd frontend && npm start
```

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 支持

如有问题或建议，请提交 [Issue](../../issues)。