import React from 'react';
import { Layout, Space, Divider } from 'antd';
import { GithubOutlined, HeartFilled } from '@ant-design/icons';

const { Footer: AntFooter } = Layout;

/**
 * 页面底部组件
 * 显示版权信息和相关链接
 */
const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <AntFooter className="text-center bg-gray-50 border-t border-gray-200">
      <div className="max-w-6xl mx-auto px-4">
        <Space split={<Divider type="vertical" />} className="mb-2">
          <a 
            href="/about" 
            className="text-gray-600 hover:text-blue-600 no-underline"
          >
            关于我们
          </a>
          <a 
            href="/help" 
            className="text-gray-600 hover:text-blue-600 no-underline"
          >
            帮助中心
          </a>
          <a 
            href="/privacy" 
            className="text-gray-600 hover:text-blue-600 no-underline"
          >
            隐私政策
          </a>
          <a 
            href="/terms" 
            className="text-gray-600 hover:text-blue-600 no-underline"
          >
            服务条款
          </a>
        </Space>
        
        <div className="text-gray-500 text-sm">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <span>Made with</span>
            <HeartFilled className="text-red-500" />
            <span>by Wiki Team</span>
          </div>
          <div>
            © {currentYear} Wiki知识库. All rights reserved.
          </div>
        </div>
      </div>
    </AntFooter>
  );
};

export default Footer;