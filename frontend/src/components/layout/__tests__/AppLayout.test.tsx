import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ConfigProvider } from 'antd';
import AppLayout from '../AppLayout';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/',
    push: jest.fn(),
    query: {},
  }),
}));

// Mock zustand store
jest.mock('@/store/authStore', () => ({
  useAuthStore: () => ({
    user: null,
    logout: jest.fn(),
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <ConfigProvider>
      {children}
    </ConfigProvider>
  </QueryClientProvider>
);

describe('AppLayout', () => {
  it('应该渲染主布局组件', () => {
    render(
      <TestWrapper>
        <AppLayout>
          <div>测试内容</div>
        </AppLayout>
      </TestWrapper>
    );

    // 检查是否渲染了头部
    expect(screen.getByText('Wiki知识库')).toBeInTheDocument();
    
    // 检查是否渲染了内容
    expect(screen.getByText('测试内容')).toBeInTheDocument();
    
    // 检查是否渲染了底部
    expect(screen.getByText(/© \d{4} Wiki知识库/)).toBeInTheDocument();
  });

  it('应该支持隐藏侧边栏', () => {
    render(
      <TestWrapper>
        <AppLayout showSidebar={false}>
          <div>测试内容</div>
        </AppLayout>
      </TestWrapper>
    );

    // 检查侧边栏是否被隐藏
    expect(screen.queryByText('新建文档')).not.toBeInTheDocument();
  });

  it('应该显示侧边栏', () => {
    render(
      <TestWrapper>
        <AppLayout showSidebar={true}>
          <div>测试内容</div>
        </AppLayout>
      </TestWrapper>
    );

    // 检查侧边栏内容
    expect(screen.getByText('首页')).toBeInTheDocument();
  });
});