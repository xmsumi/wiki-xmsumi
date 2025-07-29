import React, { useState, useEffect, useMemo } from 'react';
import { Tree, Input, Spin, Empty, Button } from 'antd';
import { 
  FolderOutlined, 
  FolderOpenOutlined, 
  FileTextOutlined, 
  SearchOutlined,
  ReloadOutlined 
} from '@ant-design/icons';
import { useRouter } from 'next/router';
import type { TreeDataNode } from 'antd';

const { Search } = Input;

interface DirectoryItem {
  id: number;
  name: string;
  type: 'directory' | 'document';
  path: string;
  parentId?: number;
  children?: DirectoryItem[];
  updatedAt?: string;
}

interface DirectoryTreeProps {
  onSelect?: (path: string, item: DirectoryItem) => void;
  className?: string;
  showSearch?: boolean;
  expandedKeys?: string[];
  selectedKeys?: string[];
}

/**
 * 目录树组件
 * 显示文档和目录的层级结构，支持搜索和懒加载
 */
const DirectoryTree: React.FC<DirectoryTreeProps> = ({
  onSelect,
  className,
  showSearch = true,
  expandedKeys: controlledExpandedKeys,
  selectedKeys: controlledSelectedKeys,
}) => {
  const router = useRouter();
  const [directories, setDirectories] = useState<DirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [autoExpandParent, setAutoExpandParent] = useState(true);

  // 使用受控的展开和选中状态，如果没有提供则使用内部状态
  const finalExpandedKeys = controlledExpandedKeys || expandedKeys;
  const finalSelectedKeys = controlledSelectedKeys || selectedKeys;

  // 加载目录数据
  useEffect(() => {
    loadDirectories();
  }, []);

  // 根据当前路径设置选中状态
  useEffect(() => {
    if (router.pathname.startsWith('/docs/')) {
      const currentPath = router.pathname.replace('/docs', '');
      if (!controlledSelectedKeys) {
        setSelectedKeys([currentPath]);
      }
    }
  }, [router.pathname, controlledSelectedKeys]);

  const loadDirectories = async () => {
    try {
      setLoading(true);
      // TODO: 调用API获取目录结构
      // const response = await api.get('/directories');
      // setDirectories(response.data);
      
      // 模拟数据
      const mockData: DirectoryItem[] = [
        {
          id: 1,
          name: '快速开始',
          type: 'directory',
          path: '/quick-start',
          children: [
            {
              id: 2,
              name: '安装指南',
              type: 'document',
              path: '/quick-start/installation',
              parentId: 1,
              updatedAt: '2024-01-15',
            },
            {
              id: 3,
              name: '基础配置',
              type: 'document',
              path: '/quick-start/configuration',
              parentId: 1,
              updatedAt: '2024-01-14',
            },
            {
              id: 4,
              name: '常见问题',
              type: 'document',
              path: '/quick-start/faq',
              parentId: 1,
              updatedAt: '2024-01-13',
            },
          ],
        },
        {
          id: 5,
          name: 'API文档',
          type: 'directory',
          path: '/api',
          children: [
            {
              id: 6,
              name: '认证接口',
              type: 'document',
              path: '/api/auth',
              parentId: 5,
              updatedAt: '2024-01-12',
            },
            {
              id: 7,
              name: '文档接口',
              type: 'document',
              path: '/api/documents',
              parentId: 5,
              updatedAt: '2024-01-11',
            },
            {
              id: 8,
              name: '用户接口',
              type: 'directory',
              path: '/api/users',
              parentId: 5,
              children: [
                {
                  id: 9,
                  name: '用户管理',
                  type: 'document',
                  path: '/api/users/management',
                  parentId: 8,
                  updatedAt: '2024-01-10',
                },
                {
                  id: 10,
                  name: '权限控制',
                  type: 'document',
                  path: '/api/users/permissions',
                  parentId: 8,
                  updatedAt: '2024-01-09',
                },
              ],
            },
          ],
        },
        {
          id: 11,
          name: '部署指南',
          type: 'document',
          path: '/deployment',
          updatedAt: '2024-01-08',
        },
        {
          id: 12,
          name: '系统架构',
          type: 'document',
          path: '/architecture',
          updatedAt: '2024-01-07',
        },
      ];
      
      setDirectories(mockData);
      
      // 默认展开第一级目录
      const defaultExpanded = mockData
        .filter(item => item.type === 'directory')
        .map(item => item.path);
      if (!controlledExpandedKeys) {
        setExpandedKeys(defaultExpanded);
      }
    } catch (error) {
      console.error('加载目录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 将目录数据转换为Tree组件需要的格式
  const convertToTreeData = (items: DirectoryItem[]): TreeDataNode[] => {
    return items.map(item => ({
      key: item.path,
      title: item.name,
      icon: item.type === 'directory' 
        ? (finalExpandedKeys.includes(item.path) ? <FolderOpenOutlined /> : <FolderOutlined />)
        : <FileTextOutlined />,
      isLeaf: item.type === 'document',
      children: item.children ? convertToTreeData(item.children) : undefined,
      data: item, // 存储原始数据
    }));
  };

  // 搜索过滤
  const filteredTreeData = useMemo(() => {
    if (!searchValue) {
      return convertToTreeData(directories);
    }

    const filterTree = (items: DirectoryItem[]): DirectoryItem[] => {
      return items.reduce((acc: DirectoryItem[], item) => {
        const matchesSearch = item.name.toLowerCase().includes(searchValue.toLowerCase());
        const filteredChildren = item.children ? filterTree(item.children) : [];
        
        if (matchesSearch || filteredChildren.length > 0) {
          acc.push({
            ...item,
            children: filteredChildren.length > 0 ? filteredChildren : item.children,
          });
        }
        
        return acc;
      }, []);
    };

    return convertToTreeData(filterTree(directories));
  }, [directories, searchValue, finalExpandedKeys]);

  // 处理节点展开
  const handleExpand = (expandedKeysValue: React.Key[]) => {
    if (!controlledExpandedKeys) {
      setExpandedKeys(expandedKeysValue as string[]);
    }
    setAutoExpandParent(false);
  };

  // 处理节点选择
  const handleSelect = (selectedKeysValue: React.Key[], info: any) => {
    const selectedKey = selectedKeysValue[0] as string;
    const selectedItem = info.node.data as DirectoryItem;
    
    if (!controlledSelectedKeys) {
      setSelectedKeys(selectedKeysValue as string[]);
    }
    
    if (selectedItem) {
      // 如果是文档，导航到文档页面
      if (selectedItem.type === 'document') {
        router.push(`/docs${selectedItem.path}`);
      }
      
      // 调用回调函数
      onSelect?.(selectedKey, selectedItem);
    }
  };

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchValue(value);
    if (value) {
      // 搜索时展开所有匹配的节点
      const getAllKeys = (items: DirectoryItem[]): string[] => {
        let keys: string[] = [];
        items.forEach(item => {
          keys.push(item.path);
          if (item.children) {
            keys = keys.concat(getAllKeys(item.children));
          }
        });
        return keys;
      };
      
      if (!controlledExpandedKeys) {
        setExpandedKeys(getAllKeys(directories));
      }
      setAutoExpandParent(true);
    }
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-32 ${className || ''}`}>
        <Spin />
      </div>
    );
  }

  if (directories.length === 0) {
    return (
      <div className={className}>
        <Empty 
          description="暂无文档"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  return (
    <div className={className}>
      {showSearch && (
        <div className="mb-4 space-y-2">
          <Search
            placeholder="搜索文档..."
            allowClear
            onChange={(e) => handleSearch(e.target.value)}
            prefix={<SearchOutlined />}
          />
          <Button
            type="text"
            icon={<ReloadOutlined />}
            onClick={loadDirectories}
            size="small"
            className="w-full"
          >
            刷新目录
          </Button>
        </div>
      )}
      
      <Tree
        showIcon
        treeData={filteredTreeData}
        expandedKeys={finalExpandedKeys}
        selectedKeys={finalSelectedKeys}
        autoExpandParent={autoExpandParent}
        onExpand={handleExpand}
        onSelect={handleSelect}
        className="directory-tree"
      />
    </div>
  );
};

export default DirectoryTree;