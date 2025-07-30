import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { 
  Card, 
  Tabs, 
  Form, 
  Input, 
  Button, 
  message, 
  Typography, 
  Space, 
  Alert,
  Tag,
  Divider
} from 'antd';
import { 
  UserOutlined, 
  MailOutlined, 
  LockOutlined, 
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SendOutlined
} from '@ant-design/icons';
import { AppLayout } from '@/components';
import { AuthGuard } from '@/components/auth';
import { useAuthStore } from '@/store/authStore';

const { Title, Paragraph } = Typography;

/**
 * 用户设置页面
 */
const UserSettingsPage: NextPage = () => {
  const { user, updateUser } = useAuthStore();
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<{
    isVerified: boolean;
    pendingVerification: boolean;
    lastSentAt?: string;
  } | null>(null);

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        username: user.username,
        email: user.email
      });
      loadVerificationStatus();
    }
  }, [user]);

  const loadVerificationStatus = async () => {
    try {
      const response = await fetch('/api/auth/verification-status', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setVerificationStatus(data.data);
      }
    } catch (error) {
      console.error('获取验证状态失败:', error);
    }
  };

  const handleUpdateProfile = async (values: { username: string; email: string }) => {
    try {
      setLoading(true);

      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (data.success) {
        updateUser(data.data);
        message.success('个人信息更新成功');
        
        // 如果邮箱发生变化，重新加载验证状态
        if (values.email !== user?.email) {
          loadVerificationStatus();
        }
      } else {
        message.error(data.error.message);
      }
    } catch (error) {
      console.error('更新个人信息失败:', error);
      message.error('更新个人信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (values: { 
    currentPassword: string; 
    newPassword: string; 
    confirmPassword: string;
  }) => {
    try {
      setLoading(true);

      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword
        }),
      });

      const data = await response.json();

      if (data.success) {
        passwordForm.resetFields();
        message.success('密码修改成功');
      } else {
        message.error(data.error.message);
      }
    } catch (error) {
      console.error('修改密码失败:', error);
      message.error('修改密码失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSendVerificationEmail = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/auth/send-verification-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          baseUrl: window.location.origin
        }),
      });

      const data = await response.json();

      if (data.success) {
        message.success('验证邮件已发送，请检查您的邮箱');
        loadVerificationStatus();
      } else {
        message.error(data.error.message);
      }
    } catch (error) {
      console.error('发送验证邮件失败:', error);
      message.error('发送验证邮件失败');
    } finally {
      setLoading(false);
    }
  };

  const tabItems = [
    {
      key: 'profile',
      label: '个人信息',
      children: (
        <div>
          <Title level={4}>基本信息</Title>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleUpdateProfile}
            autoComplete="off"
          >
            <Form.Item
              name="username"
              label="用户名"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 3, message: '用户名至少3个字符' },
                { max: 20, message: '用户名最多20个字符' }
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="请输入用户名"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="email"
              label="邮箱地址"
              rules={[
                { required: true, message: '请输入邮箱地址' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="请输入邮箱地址"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
              >
                保存更改
              </Button>
            </Form.Item>
          </Form>

          <Divider />

          <Title level={4}>邮箱验证状态</Title>
          {verificationStatus && (
            <div>
              {verificationStatus.isVerified ? (
                <Alert
                  message="邮箱已验证"
                  description="您的邮箱地址已通过验证"
                  type="success"
                  icon={<CheckCircleOutlined />}
                  showIcon
                />
              ) : (
                <div>
                  <Alert
                    message="邮箱未验证"
                    description="为了账户安全，请验证您的邮箱地址"
                    type="warning"
                    icon={<ExclamationCircleOutlined />}
                    showIcon
                    className="mb-4"
                  />
                  
                  {verificationStatus.pendingVerification && (
                    <Alert
                      message="验证邮件已发送"
                      description={`验证邮件已发送到您的邮箱，请检查收件箱。${
                        verificationStatus.lastSentAt 
                          ? `发送时间: ${new Date(verificationStatus.lastSentAt).toLocaleString()}`
                          : ''
                      }`}
                      type="info"
                      className="mb-4"
                    />
                  )}

                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSendVerificationEmail}
                    loading={loading}
                  >
                    {verificationStatus.pendingVerification ? '重新发送验证邮件' : '发送验证邮件'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'security',
      label: '安全设置',
      children: (
        <div>
          <Title level={4}>修改密码</Title>
          <Paragraph className="text-gray-600 mb-6">
            定期更换密码有助于保护您的账户安全
          </Paragraph>

          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handleChangePassword}
            autoComplete="off"
          >
            <Form.Item
              name="currentPassword"
              label="当前密码"
              rules={[
                { required: true, message: '请输入当前密码' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请输入当前密码"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="newPassword"
              label="新密码"
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 6, message: '密码长度至少为6位' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请输入新密码"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="确认新密码"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: '请确认新密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请再次输入新密码"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
              >
                修改密码
              </Button>
            </Form.Item>
          </Form>

          <Alert
            message="密码安全提示"
            description="建议使用包含大小写字母、数字和特殊字符的8位以上密码"
            type="info"
            showIcon
          />
        </div>
      )
    }
  ];

  return (
    <AuthGuard requireAuth={true}>
      <Head>
        <title>用户设置 - Wiki知识库</title>
        <meta name="description" content="管理您的账户设置" />
      </Head>

      <AppLayout>
        <div className="p-6">
          <div className="mb-6">
            <Title level={2}>用户设置</Title>
            <Paragraph className="text-gray-600">
              管理您的个人信息和账户安全设置
            </Paragraph>
          </div>

          <Card>
            <Tabs items={tabItems} />
          </Card>
        </div>
      </AppLayout>
    </AuthGuard>
  );
};

export default UserSettingsPage;