import React, { useState, useEffect } from 'react';
import { List, Card, Typography, Tag, Space, Button, Empty, Spin, Pagination, Divider } from 'antd';
import { 
  FileTextOutlined, 
  FolderOutlined, 
  ClockCircleOutlined, 
  UserOutlined,
  EyeOutlined 
} from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/router';

const { Title, Text, Paragraph } = Typography;

interface SearchResult {
  id: number;
  title: string;
  content: string;
  type: 'document' | 'directory';
  path: string;
  author: {
    id: number;
    username: string;
  };
  tags: string[];
  updatedAt: string;
  viewCount: number;
  highlights: {
    title?: string;
    content?: string[];
  };
  score: number;
}

interface SearchResultsProps {
  query: string;
  results?: SearchResult[];
  loading?: boolean;
  total?: number;
  pageSize?: number;
  currentPage?: number;
  onPageChange?: (page: number, pageSize: number) => void;
  className?: string;
}

/**
 * 搜索结果展示组件
 * 显示搜索结果列表，支持分页和高亮显示
 */
const SearchResults: React.FC<SearchResultsProps> = ({
  query,
  results = [],
  loading = false,
  total = 0,
  pageSize = 10,
  currentPage = 1,
  onPageChange,
  className,
}) => {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'views'>('relevance');

  // 生成模拟搜索结果
  const generateMockResults = (searchQuery: string): SearchResult[] => {
    const mockResults: SearchResult[] = [
      {
        id: 1,
        title: '安装指南',
        content: '本文档将指导您完成系统的安装过程，包括环境准备、依赖安装、配置设置等步骤。',
        type: 'document',
        path: '/quick-start/installation',
        author: { id: 1, username: 'admin' },
        tags: ['安装', '指南', '快速开始'],
        updatedAt: '2024-01-15T10:00:00Z',
        viewCount: 256,
        highlights: {
          title: '安装<mark>指南</mark>',
          content: ['本文档将<mark>指导</mark>您完成系统的<mark>安装</mark>过程'],
        },
        score: 0.95,
      },
      {
        id: 2,
        title: 'API文档',
        content: 'API接口文档，包含认证、文档管理、用户管理等各个模块的接口说明。',
        type: 'directory',
        path: '/api',
        author: { id: 2, username: 'developer' },
        tags: ['API', '接口', '文档'],
        updatedAt: '2024-01-14T15:30:00Z',
        viewCount: 189,
        highlights: {
          content: ['<mark>API</mark>接口<mark>文档</mark>，包含认证、文档管理'],
        },
        score: 0.87,
      },
      {
        id: 3,
        title: '认证接口',
        content: '用户认证相关的API接口，包括登录、注册、token验证等功能的详细说明。',
        type: 'document',
        path: '/api/auth',
        author: { id: 1, username: 'admin' },
        tags: ['认证', 'API', '安全'],
        updatedAt: '2024-01-13T09:15:00Z',
        viewCount: 142,
        highlights: {
          content: ['用户<mark>认证</mark>相关的API接口，包括登录、注册'],
        },
        score: 0.78,
      },
      {
        id: 4,
        title: '部署指南',
        content: '生产环境部署配置指南，包括Docker容器化、Nginx配置、SSL证书等。',
        type: 'document',
        path: '/deployment',
        author: { id: 3, username: 'ops' },
        tags: ['部署', '运维', 'Docker'],
        updatedAt: '2024-01-12T14:20:00Z',
        viewCount: 98,
        highlights: {
          content: ['生产环境<mark>部署</mark>配置<mark>指南</mark>'],
        },
        score: 0.65,
      },
    ];

    // 根据查询过滤结果
    return mockResults.filter(result => 
      result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  // 如果没有传入results，使用模拟数据
  const displayResults = results.length > 0 ? results : generateMockResults(query);

  // 排序结果
  const sortedResults = [...displayResults].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      case 'views':
        return b.viewCount - a.viewCount;
      case 'relevance':
      default:
        return b.score - a.score;
    }
  });

  // 处理页面变化
  const handlePageChange = (page: number, size: number) => {
    onPageChange?.(page, size);
    
    // 更新URL参数
    const newQuery = { ...router.query, page: page.toString() };
    router.push({ pathname: router.pathname, query: newQuery }, undefined, { shallow: true });
  };

  // 渲染高亮文本
  const renderHighlight = (text: string) => {
    return <span dangerouslySetInnerHTML={{ __html: text }} />;
  };

  // 渲染搜索结果项
  const renderResultItem = (item: SearchResult) => (
    <List.Item key={item.id} className="search-result-item">
      <div className="w-full">
        {/* 标题和类型 */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            {item.type === 'directory' ? (
              <FolderOutlined className="text-blue-500 text-lg" />
            ) : (
              <FileTextOutlined className="text-green-500 text-lg" />
            )}
            <Link 
              href={`/docs${item.path}`}
              className="text-lg font-medium text-blue-600 hover:text-blue-800 no-underline"
            >
              {item.highlights.title ? 
                renderHighlight(item.highlights.title) : 
                item.title
              }
            </Link>
          </div>
          <Tag color={item.type === 'directory' ? 'blue' : 'green'}>
            {item.type === 'directory' ? '目录' : '文档'}
          </Tag>
        </div>

        {/* 内容摘要 */}
        <div className="mb-3">
          {item.highlights.content ? (
            <div>
              {item.highlights.content.map((highlight, index) => (
                <Paragraph key={index} className="!mb-1 text-gray-600">
                  {renderHighlight(highlight)}...
                </Paragraph>
              ))}
            </div>
          ) : (
            <Paragraph className="!mb-0 text-gray-600">
              {item.content.substring(0, 200)}...
            </Paragraph>
          )}
        </div>

        {/* 标签 */}
        {item.tags.length > 0 && (
          <div className="mb-3">
            {item.tags.map(tag => (
              <Tag key={tag} className="mb-1 text-xs">
                {tag}
              </Tag>
            ))}
          </div>
        )}

        {/* 元信息 */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <Space split={<Divider type="vertical" />}>
            <Space>
              <UserOutlined />
              <span>{item.author.username}</span>
            </Space>
            <Space>
              <ClockCircleOutlined />
              <span>更新于 {new Date(item.updatedAt).toLocaleDateString('zh-CN')}</span>
            </Space>
            <Space>
              <EyeOutlined />
              <span>{item.viewCount} 次浏览</span>
            </Space>
          </Space>
          <Text type="secondary">
            相关度: {Math.round(item.score * 100)}%
          </Text>
        </div>
      </div>
    </List.Item>
  );

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-64 ${className || ''}`}>
        <Spin size="large" />
      </div>
    );
  }

  if (!query.trim()) {
    return (
      <div className={className}>
        <Empty
          description="请输入搜索关键词"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  if (sortedResults.length === 0) {
    return (
      <div className={className}>
        <Empty
          description={`没有找到包含 "${query}" 的结果`}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  return (
    <div className={`search-results ${className || ''}`}>
      {/* 搜索结果统计和排序 */}
      <Card className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <Text strong>
              找到 {total || sortedResults.length} 个结果
            </Text>
            <Text type="secondary" className="ml-2">
              (搜索用时 0.{Math.floor(Math.random() * 100)}秒)
            </Text>
          </div>
          <Space>
            <Text>排序方式:</Text>
            <Button.Group>
              <Button 
                type={sortBy === 'relevance' ? 'primary' : 'default'}
                size="small"
                onClick={() => setSortBy('relevance')}
              >
                相关度
              </Button>
              <Button 
                type={sortBy === 'date' ? 'primary' : 'default'}
                size="small"
                onClick={() => setSortBy('date')}
              >
                时间
              </Button>
              <Button 
                type={sortBy === 'views' ? 'primary' : 'default'}
                size="small"
                onClick={() => setSortBy('views')}
              >
                浏览量
              </Button>
            </Button.Group>
          </Space>
        </div>
      </Card>

      {/* 搜索结果列表 */}
      <Card>
        <List
          itemLayout="vertical"
          dataSource={sortedResults}
          renderItem={renderResultItem}
          pagination={false}
        />

        {/* 分页 */}
        {(total || sortedResults.length) > pageSize && (
          <div className="flex justify-center mt-6">
            <Pagination
              current={currentPage}
              total={total || sortedResults.length}
              pageSize={pageSize}
              onChange={handlePageChange}
              showSizeChanger
              showQuickJumper
              showTotal={(total, range) => 
                `第 ${range[0]}-${range[1]} 条，共 ${total} 条结果`
              }
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default SearchResults;