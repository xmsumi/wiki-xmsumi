import { NextPage } from 'next';
import Head from 'next/head';
import { Form, Input, Button, Card, Typography, Divider, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { AppLayout } from '@/components';
import { useAuthStore } from '@/store/authStore';

const { Title, Paragraph } = Typography;

interface LoginForm {
  username: string;
  password: string;
}

/**
 * 登录页面
 */
const LoginPage: NextPage = () => {
  const router = useRouter();
  const { login } = useAuthStore();
  const [form] = Form.useForm();

  // 处理登录提交
  const handleLogin = async (values: LoginForm) => {
    try {
      // TODO: 调用登录API
      console.log('登录信息:', values);
      
      // 模拟登录成功
      const mockUser = {
        id: 1,
        username: values.username,
        email: `${values.username}@example.com`,
        role: 'admin' as const,
        avatar_url: null,
      };
      
      login(mockUser, 'mock-token');
      message.success('登录成功！');
      
      // 跳转到首页或之前的页面
      const redirect = router.query.redirect as string;
      router.push(redirect || '/');
    } catch (error) {
      console.error('登录失败:', error);
      message.error('登录失败，请检查用户名和密码');
    }
  };

  return (
    <>
      <Head>
        <title>用户登录 - Wiki知识库</title>
        <meta name="description" content="登录Wiki知识库管理系统" />
      </Head>

      <AppLayout showSidebar={false}>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <div className="text-center mb-8">
              <Title level={2}>用户登录</Title>
              <Paragraph className="text-gray-600">
                登录Wiki知识库管理系统
              </Paragraph>
            </div>

            <Form
              form={form}
              name="login"
              onFinish={handleLogin}
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="username"
                label="用户名"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 3, message: '用户名至少3个字符' },
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="请输入用户名"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label="密码"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6个字符' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="请输入密码"
                />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" block>
                  登录
                </Button>
              </Form.Item>
            </Form>

            <Divider />

            <div className="text-center text-gray-600">
              <Paragraph>
                还没有账号？
                <Link href="/register" className="text-blue-600 hover:text-blue-800 ml-1">
                  立即注册
                </Link>
              </Paragraph>
              <Paragraph>
                <Link href="/forgot-password" className="text-blue-600 hover:text-blue-800">
                  忘记密码？
                </Link>
              </Paragraph>
            </div>
          </Card>
        </div>
      </AppLayout>
    </>
  );
};

export default LoginPage;