import React from 'react';
import { render, screen } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import Breadcrumb from '../Breadcrumb';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/docs/api/auth',
  }),
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ConfigProvider>
    {children}
  </ConfigProvider>
);

describe('Breadcrumb', () => {
  it('应该根据路径自动生成面包屑', () => {
    render(
      <TestWrapper>
        <Breadcrumb />
      </TestWrapper>
    );

    // 检查面包屑项目
    expect(screen.getByText('首页')).toBeInTheDocument();
    expect(screen.getByText('文档')).toBeInTheDocument();
    expect(screen.getByText('api')).toBeInTheDocument();
    expect(screen.getByText('auth')).toBeInTheDocument();
  });

  it('应该支持自定义面包屑项目', () => {
    const customItems = [
      { title: '首页', path: '/' },
      { title: '自定义页面', path: '/custom' },
      { title: '当前页面' },
    ];

    render(
      <TestWrapper>
        <Breadcrumb items={customItems} />
      </TestWrapper>
    );

    expect(screen.getByText('首页')).toBeInTheDocument();
    expect(screen.getByText('自定义页面')).toBeInTheDocument();
    expect(screen.getByText('当前页面')).toBeInTheDocument();
  });

  it('应该支持自定义样式类', () => {
    const { container } = render(
      <TestWrapper>
        <Breadcrumb className="custom-breadcrumb" />
      </TestWrapper>
    );

    expect(container.firstChild).toHaveClass('custom-breadcrumb');
  });
});