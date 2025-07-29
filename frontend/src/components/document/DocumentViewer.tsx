import React, { useState, useEffect } from 'react';
import { Card, Typography, Tag, Space, Button, Divider, Spin, Alert, Affix } from 'antd';
import { 
  EditOutlined, 
  ShareAltOutlined, 
  PrinterOutlined, 
  ClockCircleOutlined,
  UserOutlined,
  EyeOutlined
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/store/authStore';
import TableOfContents from './TableOfContents';

const { Title, Paragraph, Text } = Typography;

interface DocumentData {
  id: number;
  title: string;
  content: string;
  contentType: 'markdown' | 'html';
  author: {
    id: number;
    username: string;
    avatar?: string;
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  path: string;
}

interface DocumentViewerProps {
  documentPath?: string;
  className?: string;
  showToc?: boolean;
  showActions?: boolean;
}

/**
 * 文档展示组件
 * 支持Markdown渲染、代码高亮、目录导航等功能
 */
const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documentPath,
  className,
  showToc = true,
  showActions = true,
}) => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tocVisible, setTocVisible] = useState(showToc);

  // 从路由获取文档路径
  const currentPath = documentPath || router.asPath.replace('/docs', '');

  useEffect(() => {
    if (currentPath) {
      loadDocument(currentPath);
    }
  }, [currentPath]);

  const loadDocument = async (path: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: 调用API获取文档内容
      // const response = await api.get(`/documents${path}`);
      // setDocument(response.data);
      
      // 模拟数据
      const mockDocument: DocumentData = {
        id: 1,
        title: getDocumentTitle(path),
        content: getMockContent(path),
        contentType: 'markdown',
        author: {
          id: 1,
          username: 'admin',
          avatar: undefined,
        },
        tags: ['文档', '指南'],
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T15:30:00Z',
        viewCount: 156,
        path,
      };
      
      setDocument(mockDocument);
    } catch (err) {
      console.error('加载文档失败:', err);
      setError('文档加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 根据路径生成文档标题
  const getDocumentTitle = (path: string): string => {
    const titleMap: Record<string, string> = {
      '/quick-start/installation': '安装指南',
      '/quick-start/configuration': '基础配置',
      '/quick-start/faq': '常见问题',
      '/api/auth': '认证接口',
      '/api/documents': '文档接口',
      '/api/users/management': '用户管理',
      '/api/users/permissions': '权限控制',
      '/deployment': '部署指南',
      '/architecture': '系统架构',
    };
    return titleMap[path] || '文档';
  };

  // 生成模拟内容
  const getMockContent = (path: string): string => {
    return `# ${getDocumentTitle(path)}

## 概述

这是关于${getDocumentTitle(path)}的详细说明文档。本文档将为您介绍相关的概念、使用方法和最佳实践。

## 主要特性

- **功能特性1**: 详细的功能说明和使用场景
- **功能特性2**: 高性能和可扩展性设计
- **功能特性3**: 完善的错误处理和日志记录

## 快速开始

### 步骤1: 环境准备

首先确保您的环境满足以下要求：

\`\`\`bash
# 检查Node.js版本
node --version

# 检查npm版本
npm --version
\`\`\`

### 步骤2: 安装依赖

运行以下命令安装必要的依赖：

\`\`\`bash
npm install
\`\`\`

### 步骤3: 配置设置

创建配置文件并设置相关参数：

\`\`\`json
{
  "name": "wiki-knowledge-base",
  "version": "1.0.0",
  "description": "专业的知识管理系统"
}
\`\`\`

## 详细说明

### 核心概念

这里是关于核心概念的详细解释：

1. **概念A**: 这是第一个重要概念的说明
2. **概念B**: 这是第二个重要概念的说明
3. **概念C**: 这是第三个重要概念的说明

### 使用示例

以下是一个完整的使用示例：

\`\`\`typescript
import { DocumentViewer } from '@/components';

const MyComponent = () => {
  return (
    <DocumentViewer 
      documentPath="/example"
      showToc={true}
      showActions={true}
    />
  );
};
\`\`\`

## 注意事项

> **重要提示**: 在使用过程中请注意以下几点：
> 
> - 确保网络连接稳定
> - 定期备份重要数据
> - 遵循安全最佳实践

## 常见问题

### 问题1: 如何解决安装失败？

如果遇到安装失败的问题，请尝试以下解决方案：

1. 清除npm缓存：\`npm cache clean --force\`
2. 删除node_modules目录并重新安装
3. 检查网络连接和防火墙设置

### 问题2: 如何进行性能优化？

性能优化建议：

- 使用CDN加速静态资源
- 启用Gzip压缩
- 优化数据库查询
- 实施缓存策略

## 相关链接

- [官方文档](https://example.com/docs)
- [GitHub仓库](https://github.com/example/repo)
- [问题反馈](https://github.com/example/repo/issues)

---

*最后更新时间: ${new Date().toLocaleDateString('zh-CN')}*`;
  };

  // 自定义Markdown渲染组件
  const markdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={tomorrow}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  };

  // 处理编辑按钮点击
  const handleEdit = () => {
    if (document) {
      router.push(`/admin/documents/edit/${document.id}`);
    }
  };

  // 处理分享按钮点击
  const handleShare = () => {
    if (navigator.share && document) {
      navigator.share({
        title: document.title,
        url: window.location.href,
      });
    } else {
      // 复制链接到剪贴板
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // 处理打印按钮点击
  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-64 ${className || ''}`}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Alert
          message="加载失败"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => loadDocument(currentPath)}>
              重试
            </Button>
          }
        />
      </div>
    );
  }

  if (!document) {
    return (
      <div className={className}>
        <Alert
          message="文档不存在"
          description="请检查文档路径是否正确"
          type="warning"
          showIcon
        />
      </div>
    );
  }

  return (
    <div className={`document-viewer ${className || ''}`}>
      <div className="flex gap-6">
        {/* 主内容区域 */}
        <div className={`flex-1 ${tocVisible ? 'max-w-4xl' : ''}`}>
          <Card className="mb-6">
            {/* 文档头部信息 */}
            <div className="mb-6">
              <Title level={1} className="!mb-4">
                {document.title}
              </Title>
              
              <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-4">
                <Space>
                  <UserOutlined />
                  <Text>{document.author.username}</Text>
                </Space>
                <Space>
                  <ClockCircleOutlined />
                  <Text>更新于 {new Date(document.updatedAt).toLocaleDateString('zh-CN')}</Text>
                </Space>
                <Space>
                  <EyeOutlined />
                  <Text>{document.viewCount} 次浏览</Text>
                </Space>
              </div>

              {/* 标签 */}
              {document.tags.length > 0 && (
                <div className="mb-4">
                  {document.tags.map(tag => (
                    <Tag key={tag} color="blue">
                      {tag}
                    </Tag>
                  ))}
                </div>
              )}

              {/* 操作按钮 */}
              {showActions && (
                <>
                  <Divider />
                  <Space>
                    {user && (
                      <Button 
                        type="primary" 
                        icon={<EditOutlined />}
                        onClick={handleEdit}
                      >
                        编辑
                      </Button>
                    )}
                    <Button 
                      icon={<ShareAltOutlined />}
                      onClick={handleShare}
                    >
                      分享
                    </Button>
                    <Button 
                      icon={<PrinterOutlined />}
                      onClick={handlePrint}
                      className="no-print"
                    >
                      打印
                    </Button>
                  </Space>
                </>
              )}
            </div>

            {/* 文档内容 */}
            <div className="document-content prose prose-gray max-w-none">
              <ReactMarkdown components={markdownComponents}>
                {document.content}
              </ReactMarkdown>
            </div>
          </Card>
        </div>

        {/* 目录导航 */}
        {tocVisible && showToc && (
          <div className="w-64 flex-shrink-0">
            <Affix offsetTop={80}>
              <TableOfContents 
                content={document.content}
                className="bg-white rounded-lg shadow-sm border p-4"
              />
            </Affix>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;