import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Spin } from 'antd';
import { 
  FolderOutlined, 
  FileTextOutlined, 
  HomeOutlined,
  SettingOutlined,
  PlusOutlined,
  EditOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

const { Sider } = Layout;

interface DirectoryItem {
  id: number;
  name: string;
  type: 'directory' | 'document';
  path: string;
  children?: DirectoryItem[];
}

/**
 * 侧边栏组件
 * 包含目录树导航和管理功能入口
 */
const Sidebar: React.FC = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [directories, setDirectories] = useState<DirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 加载目录结构
  useEffect(() => {
    loadDirectories();
  }, []);

  const loadDirectories = async () => {
    try {
      setLoading(true);
      // TODO: 调用API获取目录结构
      // const response = await api.get('/directories');
      // setDirectories(response.data);
      
      // 临时模拟数据
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
              path: '/quick-start/installation'
            },
            {
              id: 3,
              name: '基础配置',
              type: 'document',
              path: '/quick-start/configuration'
            }
          ]
        },
        {
          id: 4,
          name: 'API文档',
          type: 'directory',
          path: '/api',
          children: [
            {
              id: 5,
              name: '认证接口',
              type: 'document',
              path: '/api/auth'
            },
            {
              id: 6,
              name: '文档接口',
              type: 'document',
              path: '/api/documents'
            }
          ]
        }
      ];
      setDirectories(mockData);
    } catch (error) {
      console.error('加载目录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 将目录数据转换为菜单项
  const convertToMenuItems = (items: DirectoryItem[]): any[] => {
    return items.map(item => ({
      key: item.path,
      icon: item.type === 'directory' ? <FolderOutlined /> : <FileTextOutlined />,
      label: (
        <Link href={`/docs${item.path}`} className="no-underline">
          {item.name}
        </Link>
      ),
      children: item.children ? convertToMenuItems(item.children) : undefined,
    }));
  };

  // 管理员菜单项
  const adminMenuItems = user ? [
    {
      type: 'divider' as const,
    },
    {
      key: 'admin',
      icon: <SettingOutlined />,
      label: '管理功能',
      children: [
        {
          key: '/admin/documents',
          icon: <EditOutlined />,
          label: (
            <Link href="/admin/documents" className="no-underline">
              文档管理
            </Link>
          ),
        },
        {
          key: '/admin/directories',
          icon: <FolderOutlined />,
          label: (
            <Link href="/admin/directories" className="no-underline">
              目录管理
            </Link>
          ),
        },
        {
          key: '/admin/users',
          icon: <SettingOutlined />,
          label: (
            <Link href="/admin/users" className="no-underline">
              用户管理
            </Link>
          ),
        },
      ],
    },
  ] : [];

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: (
        <Link href="/" className="no-underline">
          首页
        </Link>
      ),
    },
    ...convertToMenuItems(directories),
    ...adminMenuItems,
  ];

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      width={280}
      className="bg-white border-r border-gray-200"
      breakpoint="lg"
      collapsedWidth={0}
    >
      <div className="h-full flex flex-col">
        {/* 快捷操作按钮 */}
        {user && !collapsed && (
          <div className="p-4 border-b border-gray-200">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              block
              onClick={() => router.push('/admin/documents/new')}
            >
              新建文档
            </Button>
          </div>
        )}

        {/* 目录导航 */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <Spin />
            </div>
          ) : (
            <Menu
              mode="inline"
              selectedKeys={[router.pathname]}
              defaultOpenKeys={['/quick-start', '/api']}
              items={menuItems}
              className="border-none"
            />
          )}
        </div>
      </div>
    </Sider>
  );
};

export default Sidebar;