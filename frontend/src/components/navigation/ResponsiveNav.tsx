import React, { useState, useEffect } from 'react';
import { Drawer, Menu, Button } from 'antd';
import { MenuOutlined, CloseOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface NavItem {
  key: string;
  label: string;
  path: string;
  icon?: React.ReactNode;
  children?: NavItem[];
}

interface ResponsiveNavProps {
  items: NavItem[];
  className?: string;
}

/**
 * 响应式导航组件
 * 在大屏幕显示水平菜单，小屏幕显示抽屉式菜单
 */
const ResponsiveNav: React.FC<ResponsiveNavProps> = ({ items, className }) => {
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 检测屏幕尺寸
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  // 路由变化时关闭抽屉
  useEffect(() => {
    setDrawerVisible(false);
  }, [router.pathname]);

  // 转换导航项为菜单项
  const convertToMenuItems = (navItems: NavItem[]): any[] => {
    return navItems.map(item => ({
      key: item.key,
      icon: item.icon,
      label: (
        <Link href={item.path} className="no-underline">
          {item.label}
        </Link>
      ),
      children: item.children ? convertToMenuItems(item.children) : undefined,
    }));
  };

  const menuItems = convertToMenuItems(items);

  // 移动端抽屉菜单
  if (isMobile) {
    return (
      <>
        <Button
          type="text"
          icon={<MenuOutlined />}
          onClick={() => setDrawerVisible(true)}
          className={`lg:hidden ${className || ''}`}
        />
        <Drawer
          title="导航菜单"
          placement="left"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          width={280}
          closeIcon={<CloseOutlined />}
        >
          <Menu
            mode="inline"
            selectedKeys={[router.pathname]}
            items={menuItems}
            className="border-none"
          />
        </Drawer>
      </>
    );
  }

  // 桌面端水平菜单
  return (
    <Menu
      mode="horizontal"
      selectedKeys={[router.pathname]}
      items={menuItems}
      className={`border-none bg-transparent ${className || ''}`}
    />
  );
};

export default ResponsiveNav;