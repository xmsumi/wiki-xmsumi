import React from 'react';
import { Breadcrumb as AntBreadcrumb } from 'antd';
import { HomeOutlined, FolderOutlined, FileTextOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface BreadcrumbItem {
  title: string;
  path?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

/**
 * 面包屑导航组件
 * 显示当前页面在网站结构中的位置
 */
const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className }) => {
  const router = useRouter();

  // 如果没有传入items，根据当前路径自动生成
  const generateBreadcrumbItems = (): BreadcrumbItem[] => {
    const pathSegments = router.pathname.split('/').filter(Boolean);
    const breadcrumbItems: BreadcrumbItem[] = [
      {
        title: '首页',
        path: '/',
        icon: <HomeOutlined />,
      },
    ];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // 根据路径段生成标题
      let title = segment;
      let icon = <FolderOutlined />;
      
      // 特殊路径的标题映射
      const titleMap: Record<string, string> = {
        'docs': '文档',
        'admin': '管理后台',
        'search': '搜索结果',
        'profile': '个人资料',
        'settings': '系统设置',
        'documents': '文档管理',
        'directories': '目录管理',
        'users': '用户管理',
      };
      
      if (titleMap[segment]) {
        title = titleMap[segment];
      }
      
      // 最后一个段通常是文档，使用文档图标
      if (index === pathSegments.length - 1 && router.pathname.includes('/docs/')) {
        icon = <FileTextOutlined />;
      }

      breadcrumbItems.push({
        title,
        path: index === pathSegments.length - 1 ? undefined : currentPath,
        icon,
      });
    });

    return breadcrumbItems;
  };

  const breadcrumbItems = items || generateBreadcrumbItems();

  // 转换为Ant Design Breadcrumb需要的格式
  const antBreadcrumbItems = breadcrumbItems.map((item, index) => ({
    key: item.path || index,
    title: (
      <span className="flex items-center space-x-1">
        {item.icon}
        <span>
          {item.path ? (
            <Link href={item.path} className="text-gray-600 hover:text-blue-600 no-underline">
              {item.title}
            </Link>
          ) : (
            <span className="text-gray-800">{item.title}</span>
          )}
        </span>
      </span>
    ),
  }));

  return (
    <div className={`bg-gray-50 px-6 py-3 border-b border-gray-200 ${className || ''}`}>
      <AntBreadcrumb items={antBreadcrumbItems} />
    </div>
  );
};

export default Breadcrumb;