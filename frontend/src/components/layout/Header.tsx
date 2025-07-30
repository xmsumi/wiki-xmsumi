import React, { useState } from 'react';
import { Layout, Button, Input } from 'antd';
import { 
  MenuOutlined, 
  SearchOutlined, 
  HomeOutlined 
} from '@ant-design/icons';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { UserInfo } from '@/components/auth';

const { Header: AntHeader } = Layout;
const { Search } = Input;

/**
 * 页面头部组件
 * 包含网站标题、搜索框、用户菜单等功能
 */
const Header: React.FC = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

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
          <UserInfo user={user} showName={true} size="small" />
        ) : (
          <Button 
            type="primary" 
            onClick={() => router.push('/auth/login')}
          >
            登录
          </Button>
        )}
      </div>
    </AntHeader>
  );
};

export default Header;