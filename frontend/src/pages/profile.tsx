import { NextPage } from 'next';
import Head from 'next/head';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Avatar, 
  Upload, 
  message, 
  Divider, 
  Typography,
  Row,
  Col,
  Tag,
  Alert
} from 'antd';
import { 
  UserOutlined, 
  MailOutlined, 
  CameraOutlined,
  SaveOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { AppLayout } from '@/components';
import { AuthGuard } from '@/components/auth';
import { useAuthStore } from '@/store/authStore';
import { authService, UpdateProfileRequest } from '@/services/authService';

const { Title, Paragraph } = Typography;

interface ProfileForm {
  username: string;
  email: string;
}

/**
 * 个人资料页面
 */
const ProfilePage: NextPage = () => {
  const router = useRouter();
  const { user, updateUser, refreshUserProfile } = useAuthStore();
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 初始化表单数据
  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        username: user.username,
        email: user.email,
      });
    }
  }, [user, form]);

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
      case 'admin': return 'red';
      case 'editor': return 'blue';
      case 'viewer': return 'green';
      default: return 'default';
    }
  };

  // 处理头像上传
  const handleAvatarUpload = async (file: File) => {
    try {
      setIsUploading(true);
      
      // TODO: 实现头像上传API
      // const uploadResult = await fileService.uploadAvatar(file);
      
      // 模拟上传
      await new Promise(resolve => setTimeout(resolve, 2000));
      const mockAvatarUrl = URL.createObjectURL(file);
      
      // 更新用户头像
      await authService.updateProfile({ avatar_url: mockAvatarUrl });
      updateUser({ avatar_url: mockAvatarUrl });
      
      message.success('头像更新成功');
    } catch (error: any) {
      console.error('头像上传失败:', error);
      message.error('头像上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  // 处理表单提交
  const handleSubmit = async (values: ProfileForm) => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      // 检查是否有变更
      if (user && values.username === user.username && values.email === user.email) {
        message.info('没有需要更新的信息');
        return;
      }

      // 调用更新API
      const updateData: UpdateProfileRequest = {};
      if (values.username !== user?.username) {
        updateData.username = values.username;
      }
      if (values.email !== user?.email) {
        updateData.email = values.email;
      }

      const updatedUser = await authService.updateProfile(updateData);
      updateUser(updatedUser);
      
      message.success('个人信息更新成功');
    } catch (error: any) {
      console.error('更新个人信息失败:', error);
      
      let errorMsg = '更新失败，请稍后重试';
      
      if (error.response?.data?.error?.message) {
        errorMsg = error.response.data.error.message;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      setErrorMessage(errorMsg);
      message.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 刷新用户信息
  const handleRefresh = async () => {
    try {
      await refreshUserProfile();
      message.success('用户信息已刷新');
    } catch (error) {
      message.error('刷新失败，请重试');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <AuthGuard requireAuth={true}>
      <Head>
        <title>个人资料 - Wiki知识库</title>
        <meta name="description" content="查看和编辑个人资料信息" />
      </Head>

      <AppLayout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="mb-6">
            <Title level={2}>个人资料</Title>
            <Paragraph className="text-gray-600">
              查看和编辑您的个人信息
            </Paragraph>
          </div>

          <Row gutter={24}>
            {/* 左侧：头像和基本信息 */}
            <Col xs={24} md={8}>
              <Card>
                <div className="text-center">
                  <div className="relative inline-block mb-4">
                    <Avatar
                      size={120}
                      src={user.avatar_url}
                      icon={<UserOutlined />}
                      className="border-4 border-gray-200"
                    />
                    <Upload
                      accept="image/*"
                      showUploadList={false}
                      beforeUpload={(file) => {
                        handleAvatarUpload(file);
                        return false; // 阻止默认上传
                      }}
                    >
                      <Button
                        type="primary"
                        shape="circle"
                        icon={isUploading ? <LoadingOutlined /> : <CameraOutlined />}
                        size="small"
                        className="absolute bottom-0 right-0"
                        loading={isUploading}
                      />
                    </Upload>
                  </div>
                  
                  <Title level={4} className="mb-2">{user.username}</Title>
                  <Tag color={getRoleColor(user.role)} className="mb-4">
                    {getRoleText(user.role)}
                  </Tag>
                  
                  <div className="text-gray-600 space-y-2">
                    <div>
                      <MailOutlined className="mr-2" />
                      {user.email}
                    </div>
                    {user.createdAt && (
                      <div className="text-sm">
                        注册时间: {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    )}
                    {user.updatedAt && (
                      <div className="text-sm">
                        更新时间: {new Date(user.updatedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </Col>

            {/* 右侧：编辑表单 */}
            <Col xs={24} md={16}>
              <Card title="编辑个人信息">
                {/* 错误提示 */}
                {errorMessage && (
                  <Alert
                    message={errorMessage}
                    type="error"
                    showIcon
                    closable
                    onClose={() => setErrorMessage(null)}
                    className="mb-4"
                  />
                )}

                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSubmit}
                  size="large"
                >
                  <Form.Item
                    name="username"
                    label="用户名"
                    rules={[
                      { required: true, message: '请输入用户名' },
                      { min: 3, message: '用户名至少3个字符' },
                      { max: 50, message: '用户名最多50个字符' },
                      { pattern: /^[a-zA-Z0-9_-]+$/, message: '用户名只能包含字母、数字、下划线和连字符' },
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined />}
                      placeholder="请输入用户名"
                    />
                  </Form.Item>

                  <Form.Item
                    name="email"
                    label="邮箱"
                    rules={[
                      { required: true, message: '请输入邮箱' },
                      { type: 'email', message: '请输入有效的邮箱地址' },
                    ]}
                  >
                    <Input
                      prefix={<MailOutlined />}
                      placeholder="请输入邮箱"
                    />
                  </Form.Item>

                  <Form.Item>
                    <div className="flex space-x-4">
                      <Button
                        type="primary"
                        htmlType="submit"
                        icon={<SaveOutlined />}
                        loading={isSubmitting}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? '保存中...' : '保存更改'}
                      </Button>
                      <Button onClick={handleRefresh}>
                        刷新信息
                      </Button>
                      <Button onClick={() => router.push('/change-password')}>
                        修改密码
                      </Button>
                    </div>
                  </Form.Item>
                </Form>

                <Divider />

                <div className="text-gray-600">
                  <Title level={5}>账户信息</Title>
                  <div className="space-y-2">
                    <div>用户ID: {user.id}</div>
                    <div>账户角色: {getRoleText(user.role)}</div>
                    <div>账户状态: 正常</div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </AppLayout>
    </AuthGuard>
  );
};

export default ProfilePage;