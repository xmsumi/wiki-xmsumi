-- 插入示例文档
INSERT INTO documents (title, slug, content, content_type, directory_id, author_id, status, tags, published_at) VALUES 
(
    '欢迎使用Wiki知识库',
    'welcome-to-wiki',
    '# 欢迎使用Wiki知识库

## 简介

Wiki知识库是一个专业的知识管理系统，旨在帮助团队高效地创建、组织和分享知识。

## 主要功能

- **文档管理**: 支持Markdown格式，版本控制
- **目录组织**: 层级目录结构，便于管理
- **全文搜索**: 基于Elasticsearch的强大搜索
- **权限控制**: 多角色权限管理
- **文件上传**: 支持多种文件格式

## 快速开始

1. 登录系统
2. 创建文档
3. 组织目录结构
4. 邀请团队成员

祝您使用愉快！',
    'markdown',
    1,
    1,
    'published',
    JSON_ARRAY('欢迎', '入门', '指南'),
    NOW()
),
(
    'API接口文档',
    'api-documentation',
    '# API接口文档

## 认证接口

### POST /api/auth/login
用户登录接口

**请求参数:**
```json
{
  "username": "string",
  "password": "string"
}
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## 文档接口

### GET /api/documents
获取文档列表

### POST /api/documents
创建新文档

### PUT /api/documents/:id
更新文档

### DELETE /api/documents/:id
删除文档',
    'markdown',
    5,
    1,
    'published',
    JSON_ARRAY('API', '接口', '文档'),
    NOW()
),
(
    '开发环境搭建',
    'development-setup',
    '# 开发环境搭建

## 环境要求

- Node.js 18.0+
- MySQL 8.0+
- Elasticsearch 8.0+ (可选)

## 安装步骤

### 1. 克隆项目
```bash
git clone https://github.com/your-org/wiki-knowledge-base.git
cd wiki-knowledge-base
```

### 2. 安装依赖
```bash
# 后端依赖
cd backend
npm install

# 前端依赖
cd ../frontend
npm install
```

### 3. 配置环境变量
```bash
# 复制环境变量模板
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 4. 初始化数据库
```bash
cd backend
npm run db:migrate
npm run db:seed
```

### 5. 启动服务
```bash
# 启动后端服务
cd backend
npm run dev

# 启动前端服务
cd frontend
npm run dev
```

## 访问地址

- 前端: http://localhost:3000
- 后端API: http://localhost:3001
- 管理后台: http://localhost:3000/admin

## 默认账号

- 管理员: admin / admin123
- 编辑者: editor / editor123
- 查看者: viewer / viewer123',
    'markdown',
    6,
    1,
    'published',
    JSON_ARRAY('开发', '环境', '搭建'),
    NOW()
)
ON DUPLICATE KEY UPDATE 
    content = VALUES(content),
    updated_at = CURRENT_TIMESTAMP;