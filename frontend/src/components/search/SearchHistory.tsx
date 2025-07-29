import React, { useState, useEffect } from 'react';
import { Card, List, Button, Space, Typography, Tag, Empty, Popconfirm } from 'antd';
import { 
  HistoryOutlined, 
  DeleteOutlined, 
  ClearOutlined, 
  SearchOutlined,
  RiseOutlined 
} from '@ant-design/icons';
import { useRouter } from 'next/router';

const { Title, Text } = Typography;

interface SearchHistoryItem {
  query: string;
  timestamp: number;
  resultCount?: number;
}

interface PopularSearch {
  query: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
}

interface SearchHistoryProps {
  onSearch?: (query: string) => void;
  className?: string;
  maxItems?: number;
  showPopular?: boolean;
}

/**
 * 搜索历史和热门搜索组件
 * 管理用户的搜索历史记录和显示热门搜索词
 */
const SearchHistory: React.FC<SearchHistoryProps> = ({
  onSearch,
  className,
  maxItems = 20,
  showPopular = true,
}) => {
  const router = useRouter();
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [popularSearches, setPopularSearches] = useState<PopularSearch[]>([]);

  // 加载搜索历史
  useEffect(() => {
    loadSearchHistory();
    if (showPopular) {
      loadPopularSearches();
    }
  }, [showPopular]);

  const loadSearchHistory = () => {
    try {
      const history = localStorage.getItem('search-history-detailed');
      if (history) {
        const parsed = JSON.parse(history);
        setSearchHistory(parsed.slice(0, maxItems));
      }
    } catch (error) {
      console.error('加载搜索历史失败:', error);
    }
  };

  const loadPopularSearches = async () => {
    try {
      // TODO: 调用API获取热门搜索
      // const response = await api.get('/search/popular');
      // setPopularSearches(response.data);

      // 模拟热门搜索数据
      const mockPopular: PopularSearch[] = [
        { query: 'API文档', count: 156, trend: 'up' },
        { query: '安装指南', count: 142, trend: 'stable' },
        { query: '部署配置', count: 98, trend: 'up' },
        { query: '认证接口', count: 87, trend: 'down' },
        { query: '用户管理', count: 76, trend: 'stable' },
        { query: '系统架构', count: 65, trend: 'up' },
        { query: '错误处理', count: 54, trend: 'stable' },
        { query: '性能优化', count: 43, trend: 'up' },
      ];
      setPopularSearches(mockPopular);
    } catch (error) {
      console.error('加载热门搜索失败:', error);
    }
  };

  // 保存搜索历史
  const saveSearchHistory = (query: string, resultCount?: number) => {
    const newItem: SearchHistoryItem = {
      query,
      timestamp: Date.now(),
      resultCount,
    };

    const updatedHistory = [
      newItem,
      ...searchHistory.filter(item => item.query !== query)
    ].slice(0, maxItems);

    setSearchHistory(updatedHistory);
    localStorage.setItem('search-history-detailed', JSON.stringify(updatedHistory));
  };

  // 删除单个历史记录
  const removeHistoryItem = (query: string) => {
    const updatedHistory = searchHistory.filter(item => item.query !== query);
    setSearchHistory(updatedHistory);
    localStorage.setItem('search-history-detailed', JSON.stringify(updatedHistory));
  };

  // 清空搜索历史
  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('search-history-detailed');
    localStorage.removeItem('search-history'); // 同时清除简单历史
  };

  // 处理搜索点击
  const handleSearchClick = (query: string) => {
    if (onSearch) {
      onSearch(query);
    } else {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
    
    // 更新历史记录的时间戳
    saveSearchHistory(query);
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
    
    return new Date(timestamp).toLocaleDateString('zh-CN');
  };

  // 获取趋势图标
  const getTrendIcon = (trend: PopularSearch['trend']) => {
    switch (trend) {
      case 'up':
        return <RiseOutlined className="text-green-500" />;
      case 'down':
        return <RiseOutlined className="text-red-500 transform rotate-180" />;
      default:
        return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
    }
  };

  return (
    <div className={`search-history ${className || ''}`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 搜索历史 */}
        <Card
          title={
            <Space>
              <HistoryOutlined />
              <span>搜索历史</span>
            </Space>
          }
          extra={
            searchHistory.length > 0 && (
              <Popconfirm
                title="确定要清空所有搜索历史吗？"
                onConfirm={clearSearchHistory}
                okText="确定"
                cancelText="取消"
              >
                <Button 
                  type="text" 
                  size="small" 
                  icon={<ClearOutlined />}
                  danger
                >
                  清空
                </Button>
              </Popconfirm>
            )
          }
        >
          {searchHistory.length === 0 ? (
            <Empty 
              description="暂无搜索历史"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <List
              size="small"
              dataSource={searchHistory}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button
                      key="search"
                      type="text"
                      size="small"
                      icon={<SearchOutlined />}
                      onClick={() => handleSearchClick(item.query)}
                    />,
                    <Button
                      key="delete"
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      danger
                      onClick={() => removeHistoryItem(item.query)}
                    />,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Button
                        type="link"
                        className="p-0 h-auto text-left"
                        onClick={() => handleSearchClick(item.query)}
                      >
                        {item.query}
                      </Button>
                    }
                    description={
                      <Space>
                        <Text type="secondary" className="text-xs">
                          {formatTime(item.timestamp)}
                        </Text>
                        {item.resultCount !== undefined && (
                          <Text type="secondary" className="text-xs">
                            {item.resultCount} 个结果
                          </Text>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>

        {/* 热门搜索 */}
        {showPopular && (
          <Card
            title={
              <Space>
                <RiseOutlined />
                <span>热门搜索</span>
              </Space>
            }
          >
            {popularSearches.length === 0 ? (
              <Empty 
                description="暂无热门搜索"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <List
                size="small"
                dataSource={popularSearches}
                renderItem={(item, index) => (
                  <List.Item
                    actions={[
                      <Button
                        key="search"
                        type="text"
                        size="small"
                        icon={<SearchOutlined />}
                        onClick={() => handleSearchClick(item.query)}
                      />,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <div className="flex items-center space-x-2">
                          <span className={`
                            inline-flex items-center justify-center w-6 h-6 rounded text-xs font-medium
                            ${index < 3 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}
                          `}>
                            {index + 1}
                          </span>
                          {getTrendIcon(item.trend)}
                        </div>
                      }
                      title={
                        <Button
                          type="link"
                          className="p-0 h-auto text-left"
                          onClick={() => handleSearchClick(item.query)}
                        >
                          {item.query}
                        </Button>
                      }
                      description={
                        <Text type="secondary" className="text-xs">
                          {item.count} 次搜索
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default SearchHistory;