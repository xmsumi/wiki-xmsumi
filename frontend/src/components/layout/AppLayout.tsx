import React, { ReactNode } from 'react';
import { Layout } from 'antd';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

const { Content } = Layout;

interface AppLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

/**
 * 应用主布局组件
 * 提供统一的页面布局结构，包含头部、侧边栏、内容区域和底部
 */
const AppLayout: React.FC<AppLayoutProps> = ({ children, showSidebar = true }) => {
  return (
    <Layout className="min-h-screen">
      <Header />
      <Layout>
        {showSidebar && <Sidebar />}
        <Layout className="site-layout">
          <Content className="site-layout-background p-6">
            {children}
          </Content>
          <Footer />
        </Layout>
      </Layout>
    </Layout>
  );
};

export default AppLayout;