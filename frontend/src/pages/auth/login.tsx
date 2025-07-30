import { NextPage } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { Card, Form, Input, Button, message, Typography, Divider, Space, Alert } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';

const { Title, Paragraph } = Typography;

/**
 * 登录页面
 */
const LoginPage: NextPage = () => {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();

  const handleSubmit = async (values: { username: string; password: string }) => {
    try {
      setLoading(true);

      // 使用authService进行登录
      const loginResult = await authService.login(values);
      
      // 保存用户信息和token到store
      login(loginResult.user, loginResult.accessToken);
      
      message.success('登录成功！');
      
      // 重定向到原来的页面或首页
      const redirect = router.query.redirect as string;
      router.push(redirect || '/');
    } catch (error: any) {
      console.error('登录失败:', error);
      
      // 处理不同类型的错误
      let errorMsg = '登录失败，请稍后重试';
      
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Head>
        <title>登录 - Wiki知识库</title>
        <meta name="description" content="登录到Wiki知识库" />
      </Head>

      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <Title level={2}>Wiki知识库</Title>
          <Paragraph className="text-gray-600">
            登录到您的账户
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
            label="用户名或邮箱"
            rules={[
              { required: true, message: '请输入用户名或邮箱' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入用户名或邮箱"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <div className="flex justify-between items-center mb-4">
              <div></div>
              <Link href="/auth/forgot-password">
                <Button type="link" className="p-0">
                  忘记密码？
                </Button>
              </Link>
            </div>

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              block
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <Divider>或</Divider>

        <div className="text-center">
          <Paragraph className="text-gray-600 mb-4">
            还没有账户？
          </Paragraph>
          <Link href="/auth/register">
            <Button size="large" block>
              立即注册
            </Button>
          </Link>
        </div>

        <div className="mt-6">
          <Alert
            message="演示账户"
            description={
              <div>
                <p><strong>管理员:</strong> admin / admin123</p>
                <p><strong>编辑者:</strong> editor / editor123</p>
                <p><strong>查看者:</strong> viewer / viewer123</p>
              </div>
            }
            type="info"
            showIcon
          />
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;