import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Typography, Progress, Alert } from 'antd';
import { LockOutlined, CheckCircleOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import Link from 'next/link';

const { Title, Paragraph } = Typography;

/**
 * 密码重置页面
 */
const ResetPasswordPage: NextPage = () => {
  const router = useRouter();
  const { token } = router.query;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [email, setEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    if (token) {
      validateToken();
    }
  }, [token]);

  const validateToken = async () => {
    try {
      setValidating(true);

      const response = await fetch(`/api/auth/validate-reset-token?token=${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setTokenValid(true);
        setEmail(data.data.email);
      } else {
        setTokenValid(false);
        message.error(data.error.message);
      }
    } catch (error) {
      console.error('验证重置令牌失败:', error);
      setTokenValid(false);
      message.error('验证重置令牌失败');
    } finally {
      setValidating(false);
    }
  };

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

  const handleSubmit = async (values: { newPassword: string; confirmPassword: string }) => {
    try {
      setLoading(true);

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: values.newPassword,
          confirmPassword: values.confirmPassword
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResetSuccess(true);
        message.success('密码重置成功！');
      } else {
        message.error(data.error.message);
      }
    } catch (error) {
      console.error('重置密码失败:', error);
      message.error('重置密码失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Head>
          <title>验证中 - Wiki知识库</title>
        </Head>
        <Card className="w-full max-w-md">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">正在验证重置链接...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Head>
          <title>链接无效 - Wiki知识库</title>
        </Head>
        <Card className="w-full max-w-md">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">❌</span>
            </div>
            <Title level={3}>重置链接无效</Title>
            <Paragraph className="text-gray-600 mb-6">
              重置链接已过期或无效，请重新申请密码重置。
            </Paragraph>
            <div className="space-y-2">
              <Link href="/auth/forgot-password">
                <Button type="primary" size="large" block>
                  重新申请密码重置
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="large" block>
                  返回登录
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Head>
          <title>重置成功 - Wiki知识库</title>
        </Head>
        <Card className="w-full max-w-md">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleOutlined className="text-2xl text-green-600" />
            </div>
            <Title level={3}>密码重置成功！</Title>
            <Paragraph className="text-gray-600 mb-6">
              您的密码已成功重置，现在可以使用新密码登录了。
            </Paragraph>
            <Link href="/auth/login">
              <Button type="primary" size="large" block>
                立即登录
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Head>
        <title>重置密码 - Wiki知识库</title>
        <meta name="description" content="设置您的新密码" />
      </Head>

      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <Title level={3}>重置密码</Title>
          <Paragraph className="text-gray-600">
            为账户 <strong>{email}</strong> 设置新密码
          </Paragraph>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
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
              placeholder="请输入新密码"
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
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>

          <Alert
            message="密码安全提示"
            description="建议使用包含大小写字母、数字和特殊字符的8位以上密码"
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
              重置密码
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center">
          <Link href="/auth/login">
            <Button type="link">
              返回登录
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;