import React, { useState, useEffect, useRef } from 'react';
import { Input, AutoComplete, Button, Dropdown, Space, Tag } from 'antd';
import { 
  SearchOutlined, 
  CloseOutlined, 
  HistoryOutlined, 
  DeleteOutlined,
  FilterOutlined 
} from '@ant-design/icons';
import { useRouter } from 'next/router';

const { Search } = Input;

interface SearchSuggestion {
  value: string;
  label: string;
  type: 'document' | 'directory' | 'tag';
  path?: string;
}

interface SearchBoxProps {
  placeholder?: string;
  size?: 'small' | 'middle' | 'large';
  className?: string;
  onSearch?: (value: string, filters?: SearchFilters) => void;
  showFilters?: boolean;
  showHistory?: boolean;
  autoFocus?: boolean;
}

interface SearchFilters {
  type?: 'all' | 'document' | 'directory';
  tags?: string[];
  dateRange?: [string, string];
}

/**
 * 搜索输入框组件
 * 支持自动完成、搜索历史、过滤器等功能
 */
const SearchBox: React.FC<SearchBoxProps> = ({
  placeholder = '搜索文档内容...',
  size = 'middle',
  className,
  onSearch,
  showFilters = true,
  showHistory = true,
  autoFocus = false,
}) => {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({ type: 'all' });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<any>(null);

  // 从localStorage加载搜索历史
  useEffect(() => {
    if (showHistory) {
      const history = localStorage.getItem('search-history');
      if (history) {
        try {
          setSearchHistory(JSON.parse(history));
        } catch (error) {
          console.error('加载搜索历史失败:', error);
        }
      }
    }
  }, [showHistory]);

  // 从URL参数初始化搜索值
  useEffect(() => {
    const query = router.query.q as string;
    if (query) {
      setSearchValue(query);
    }
  }, [router.query.q]);

  // 保存搜索历史到localStorage
  const saveSearchHistory = (query: string) => {
    if (!showHistory || !query.trim()) return;

    const newHistory = [query, ...searchHistory.filter(item => item !== query)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('search-history', JSON.stringify(newHistory));
  };

  // 清除搜索历史
  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('search-history');
  };

  // 删除单个历史记录
  const removeHistoryItem = (item: string) => {
    const newHistory = searchHistory.filter(h => h !== item);
    setSearchHistory(newHistory);
    localStorage.setItem('search-history', JSON.stringify(newHistory));
  };

  // 获取搜索建议
  const fetchSuggestions = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      // TODO: 调用API获取搜索建议
      // const response = await api.get(`/search/suggestions?q=${encodeURIComponent(query)}`);
      // setSuggestions(response.data);

      // 模拟搜索建议
      const mockSuggestions: SearchSuggestion[] = [
        {
          value: '安装指南',
          label: '安装指南',
          type: 'document' as const,
          path: '/quick-start/installation',
        },
        {
          value: 'API文档',
          label: 'API文档',
          type: 'directory' as const,
          path: '/api',
        },
        {
          value: '认证接口',
          label: '认证接口',
          type: 'document' as const,
          path: '/api/auth',
        },
        {
          value: '部署',
          label: '部署',
          type: 'tag' as const,
        },
        {
          value: '配置',
          label: '配置',
          type: 'tag' as const,
        },
      ].filter(item => 
        item.label.toLowerCase().includes(query.toLowerCase())
      );

      setSuggestions(mockSuggestions);
    } catch (error) {
      console.error('获取搜索建议失败:', error);
      setSuggestions([]);
    }
  };

  // 处理输入变化
  const handleInputChange = (value: string) => {
    setSearchValue(value);
    
    if (value.trim()) {
      fetchSuggestions(value);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // 处理搜索提交
  const handleSearch = (value: string) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) return;

    // 保存到搜索历史
    saveSearchHistory(trimmedValue);
    
    // 隐藏建议
    setShowSuggestions(false);
    
    // 调用回调函数
    if (onSearch) {
      onSearch(trimmedValue, filters);
    } else {
      // 默认导航到搜索页面
      router.push(`/search?q=${encodeURIComponent(trimmedValue)}`);
    }
  };

  // 处理建议选择
  const handleSuggestionSelect = (value: string, option: any) => {
    const suggestion = suggestions.find(s => s.value === value);
    
    if (suggestion?.path) {
      // 如果有路径，直接导航
      router.push(`/docs${suggestion.path}`);
    } else {
      // 否则执行搜索
      handleSearch(value);
    }
  };

  // 生成自动完成选项
  const getAutoCompleteOptions = () => {
    const options: any[] = [];

    // 搜索建议
    if (suggestions.length > 0) {
      options.push({
        label: '搜索建议',
        options: suggestions.map(suggestion => ({
          value: suggestion.value,
          label: (
            <div className="flex items-center justify-between">
              <span>{suggestion.label}</span>
              <Tag 
                color={
                  suggestion.type === 'document' ? 'blue' :
                  suggestion.type === 'directory' ? 'green' : 'orange'
                }
                className="text-xs"
              >
                {suggestion.type === 'document' ? '文档' :
                 suggestion.type === 'directory' ? '目录' : '标签'}
              </Tag>
            </div>
          ),
        })),
      });
    }

    // 搜索历史
    if (showHistory && searchHistory.length > 0 && !searchValue.trim()) {
      options.push({
        label: (
          <div className="flex items-center justify-between">
            <span>搜索历史</span>
            <Button 
              type="text" 
              size="small" 
              icon={<DeleteOutlined />}
              onClick={clearSearchHistory}
            >
              清空
            </Button>
          </div>
        ),
        options: searchHistory.map(item => ({
          value: item,
          label: (
            <div className="flex items-center justify-between group">
              <Space>
                <HistoryOutlined className="text-gray-400" />
                <span>{item}</span>
              </Space>
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  removeHistoryItem(item);
                }}
              />
            </div>
          ),
        })),
      });
    }

    return options;
  };

  // 过滤器下拉菜单
  const filterMenuItems = [
    {
      key: 'all',
      label: '全部',
      onClick: () => setFilters({ ...filters, type: 'all' }),
    },
    {
      key: 'document',
      label: '文档',
      onClick: () => setFilters({ ...filters, type: 'document' }),
    },
    {
      key: 'directory',
      label: '目录',
      onClick: () => setFilters({ ...filters, type: 'directory' }),
    },
  ];

  const getFilterLabel = () => {
    switch (filters.type) {
      case 'document': return '文档';
      case 'directory': return '目录';
      default: return '全部';
    }
  };

  return (
    <div className={`search-box ${className || ''}`}>
      <div className="flex items-center space-x-2">
        <div className="flex-1">
          <AutoComplete
            value={searchValue}
            options={getAutoCompleteOptions()}
            onSelect={handleSuggestionSelect}
            onChange={handleInputChange}
            onDropdownVisibleChange={setShowSuggestions}
            open={showSuggestions}
            dropdownMatchSelectWidth={false}
            dropdownClassName="search-suggestions"
          >
            <Search
              ref={inputRef}
              placeholder={placeholder}
              size={size}
              enterButton={<SearchOutlined />}
              onSearch={handleSearch}
              autoFocus={autoFocus}
              allowClear
            />
          </AutoComplete>
        </div>

        {showFilters && (
          <Dropdown
            menu={{ items: filterMenuItems }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button icon={<FilterOutlined />} size={size}>
              {getFilterLabel()}
            </Button>
          </Dropdown>
        )}
      </div>
    </div>
  );
};

export default SearchBox;