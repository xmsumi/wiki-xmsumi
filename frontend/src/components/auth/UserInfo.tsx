import { useState } from 'react';
import { Avatar, Dropdown, Menu, Button, Modal, message } from 'antd';
import { 
  UserOutlined, 
  SettingOutlined, 
  LogoutOutlined, 
  EditOutlined,
  KeyOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/router';
import { useAuthStore, User } from '@/store/authStore';

interface UserInfoProps {
  user: User;
  showName?: boolean;
  size?: 'small' | 'default' | 'large';
}

/**
 * 用户信息组件
 * 显示用户头像和下拉菜单
 */
export const UserInfo: React.FC<UserInfoProps> = ({
  user,
  showName = true,
  size = 'default'
}) => {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

  // 获取用户角色显示文本
  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return '管理员';
      case 'editor': return '编辑者';
      case 'viewer': return '查看者';
      default: return '用户';
    }
  };

  // 获取用户角色颜色
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#f50';
      case 'editor': return '#2db7f5';
      case 'viewer': return '#87d068';
      default: return '#108ee9';
    }
  };

  // 处理菜单点击
  const handleMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case 'profile':
        router.push('/profile');
        break;
      case 'settings':
        // 只有管理员才能访问系统设置
        if (user.role === 'admin') {
          router.push('/admin/settings');
        } else {
          message.warning('您没有权限访问系统设置');
        }
        break;
      case 'change-password':
        router.push('/change-password');
        break;
      case 'logout':
        setIsLogoutModalVisible(true);
        break;
    }
  };

  // 处理注销
  const handleLogout = async () => {
    try {
      await logout();
      message.success('注销成功');
      router.push('/auth/login');
    } catch (error) {
      console.error('注销失败:', error);
      message.error('注销失败，请重试');
    } finally {
      setIsLogoutModalVisible(false);
    }
  };

  // 用户菜单
  const userMenu = (
    <Menu onClick={handleMenuClick}>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        个人资料
      </Menu.Item>
      <Menu.Item key="change-password" icon={<KeyOutlined />}>
        修改密码
      </Menu.Item>
      {user.role === 'admin' && (
        <>
          <Menu.Divider />
          <Menu.Item key="settings" icon={<SettingOutlined />}>
            系统设置
          </Menu.Item>
        </>
      )}
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} danger>
        注销登录
      </Menu.Item>
    </Menu>
  );

  return (
    <>
      <Dropdown overlay={userMenu} placement="bottomRight" trigger={['click']}>
        <Button type="text" className="flex items-center space-x-2 h-auto p-2">
          <Avatar
            size={size}
            src={user.avatar_url}
            icon={<UserOutlined />}
            className="flex-shrink-0"
          />
          {showName && (
            <div className="flex flex-col items-start min-w-0">
              <span className="text-sm font-medium truncate max-w-24">
                {user.username}
              </span>
              <span 
                className="text-xs truncate max-w-24"
                style={{ color: getRoleColor(user.role) }}
              >
                {getRoleText(user.role)}
              </span>
            </div>
          )}
        </Button>
      </Dropdown>

      {/* 注销确认对话框 */}
      <Modal
        title="确认注销"
        open={isLogoutModalVisible}
        onOk={handleLogout}
        onCancel={() => setIsLogoutModalVisible(false)}
        okText="确认注销"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p>您确定要注销登录吗？</p>
      </Modal>
    </>
  );
};