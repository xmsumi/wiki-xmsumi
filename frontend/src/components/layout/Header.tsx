import React, { useState } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, Space, Input } from 'antd';
import { 
  MenuOutlined, 
  SearchOutlined, 
  UserOutlined, 
  SettingOutlined, 
  LogoutOutlined,
  HomeOutlined 
} from '@ant-design/icons';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

const { Header: AntHeader } = Layout;
const { Search } = Input;

/**
 * 页面头部组件
 * 包含网站标题、搜索框、用户菜单等功能
 */
const Header: React.FC = () => {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  // 用户下拉菜单项
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
      onClick: () => router.push('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置',
      onClick: () => router.push('/admin/settings'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: logout,
    },
  ];

  // 处理搜索
  const handleSearch = (value: string) => {
    if (value.trim()) {
      router.push(`/search?q=${encodeURIComponent(value.trim())}`);
    }
  };

  return (
    <AntHeader className="bg-white shadow-sm border-b border-gray-200 px-4 flex items-center justify-between">
      {/* 左侧：Logo和标题 */}
      <div className="flex items-center space-x-4">
        <Button
          type="text"
          icon={<MenuOutlined />}
          onClick={() => setCollapsed(!collapsed)}
          className="lg:hidden"
        />
        <Link href="/" className="flex items-center space-x-2 no-underline">
          <HomeOutlined className="text-xl text-blue-600" />
          <span className="text-xl font-bold text-gray-800 hidden sm:inline">
            Wiki知识库
          </span>
        </Link>
      </div>

      {/* 中间：搜索框 */}
      <div className="flex-1 max-w-md mx-4">
        <Search
          placeholder="搜索文档内容..."
          allowClear
          enterButton={<SearchOutlined />}
          size="middle"
          onSearch={handleSearch}
          className="w-full"
        />
      </div>

      {/* 右侧：用户菜单 */}
      <div className="flex items-center space-x-4">
        {user ? (
          <Dropdown
            menu={{ items: userMenuItems }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Space className="cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
              <Avatar 
                size="small" 
                icon={<UserOutlined />}
                src={user.avatar_url}
              />
              <span className="hidden sm:inline text-gray-700">
                {user.username}
              </span>
            </Space>
          </Dropdown>
        ) : (
          <Button 
            type="primary" 
            onClick={() => router.push('/login')}
          >
            登录
          </Button>
        )}
      </div>
    </AntHeader>
  );
};

export default Header;