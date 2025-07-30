import { NextPage } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { Card, Form, Input, Button, message, Typography, Divider, Progress, Alert, Space } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import Link from 'next/link';
import { authService } from '@/services/authService';

const { Title, Paragraph } = Typography;

/**
 * 注册页面
 */
const RegisterPage: NextPage = () => {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password)) strength += 12.5;
    if (/[A-Z]/.test(password)) strength += 12.5;
    if (/[0-9]/.test(password)) strength += 12.5;
    if (/[^A-Za-z0-9]/.test(password)) strength += 12.5;
    
    return Math.min(100, strength);
  };

  const getPasswordStrengthColor = (strength: number): string => {
    if (strength < 30) return '#ff4d4f';
    if (strength < 60) return '#faad14';
    if (strength < 80) return '#1890ff';
    return '#52c41a';
  };

  const getPasswordStrengthText = (strength: number): string => {
    if (strength < 30) return '弱';
    if (strength < 60) return '中等';
    if (strength < 80) return '强';
    return '很强';
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    const strength = calculatePasswordStrength(password);
    setPasswordStrength(strength);
  };

  const handleSubmit = async (values: { 
    username: string; 
    email: string; 
    password: string; 
    confirmPassword: string;
  }) => {
    try {
      setLoading(true);
      setUserEmail(values.email);

      // 使用authService进行注册
      const registerResult = await authService.register({
        username: values.username,
        email: values.email,
        password: values.password
      });

      setRegistrationSuccess(true);
      message.success('注册成功！');
      
      // 自动发送验证邮件
      try {
        await sendVerificationEmail();
      } catch (error) {
        console.error('发送验证邮件失败:', error);
      }
    } catch (error: any) {
      console.error('注册失败:', error);
      
      // 处理不同类型的错误
      let errorMsg = '注册失败，请稍后重试';
      
      if (error.response?.data?.error?.message) {
        errorMsg = error.response.data.error.message;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const sendVerificationEmail = async (userId?: number) => {
    try {
      // 如果有userId，说明是注册后自动发送
      // 否则是手动重新发送
      const response = await fetch('/api/auth/send-verification-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userId && { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` })
        },
        body: JSON.stringify({
          baseUrl: window.location.origin
        }),
      });

      const data = await response.json();

      if (data.success) {
        message.success('验证邮件已发送，请检查您的邮箱');
      } else {
        message.error(data.error.message);
      }
    } catch (error) {
      console.error('发送验证邮件失败:', error);
      message.error('发送验证邮件失败');
    }
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Head>
          <title>注册成功 - Wiki知识库</title>
        </Head>

        <Card className="w-full max-w-md">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MailOutlined className="text-2xl text-green-600" />
            </div>
            <Title level={3}>注册成功！</Title>
            <Paragraph className="text-gray-600 mb-4">
              您的账户已创建成功。我们已向 <strong>{userEmail}</strong> 发送了验证邮件。
            </Paragraph>

            <Alert
              message="请验证您的邮箱"
              description="为了确保账户安全，请点击邮件中的验证链接完成邮箱验证。"
              type="info"
              showIcon
              className="mb-6"
            />

            <Space direction="vertical" className="w-full">
              <Button
                type="primary"
                size="large"
                block
                onClick={() => sendVerificationEmail()}
              >
                重新发送验证邮件
              </Button>
              
              <Link href="/auth/login">
                <Button size="large" block>
                  立即登录
                </Button>
              </Link>
            </Space>

            <div className="mt-4">
              <Paragraph className="text-sm text-gray-500">
                没有收到邮件？请检查垃圾邮件箱，或稍后重新发送。
              </Paragraph>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Head>
        <title>注册 - Wiki知识库</title>
        <meta name="description" content="注册Wiki知识库账户" />
      </Head>

      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <Title level={2}>创建账户</Title>
          <Paragraph className="text-gray-600">
            加入Wiki知识库，开始您的知识管理之旅
          </Paragraph>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
              { max: 20, message: '用户名最多20个字符' },
              { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' }
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

          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码长度至少为6位' },
              {
                validator: (_, value) => {
                  if (!value || calculatePasswordStrength(value) >= 30) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('密码强度太弱，请设置更复杂的密码'));
                }
              }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码"
              size="large"
              onChange={handlePasswordChange}
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>

          {passwordStrength > 0 && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">密码强度</span>
                <span className="text-sm" style={{ color: getPasswordStrengthColor(passwordStrength) }}>
                  {getPasswordStrengthText(passwordStrength)}
                </span>
              </div>
              <Progress
                percent={passwordStrength}
                strokeColor={getPasswordStrengthColor(passwordStrength)}
                showInfo={false}
                size="small"
              />
            </div>
          )}

          <Form.Item
            name="confirmPassword"
            label="确认密码"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请再次输入密码"
              size="large"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>

          <Alert
            message="注册须知"
            description="注册后我们将向您的邮箱发送验证邮件，请及时验证以确保账户安全。"
            type="info"
            showIcon
            className="mb-4"
          />

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              block
            >
              注册账户
            </Button>
          </Form.Item>
        </Form>

        <Divider>或</Divider>

        <div className="text-center">
          <Paragraph className="text-gray-600 mb-4">
            已有账户？
          </Paragraph>
          <Link href="/auth/login">
            <Button size="large" block>
              立即登录
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default RegisterPage;