import { NextPage } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import { Card, Form, Input, Button, message, Typography, Space } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import Link from 'next/link';

const { Title, Paragraph } = Typography;

/**
 * 忘记密码页面
 */
const ForgotPasswordPage: NextPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (values: { email: string }) => {
    try {
      setLoading(true);
      setEmail(values.email);

      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email,
          baseUrl: window.location.origin
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEmailSent(true);
        message.success('密码重置邮件已发送');
      } else {
        message.error(data.error.message);
      }
    } catch (error) {
      console.error('请求密码重置失败:', error);
      message.error('请求密码重置失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) return;
    
    try {
      setLoading(true);

      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          baseUrl: window.location.origin
        }),
      });

      const data = await response.json();

      if (data.success) {
        message.success('密码重置邮件已重新发送');
      } else {
        message.error(data.error.message);
      }
    } catch (error) {
      console.error('重新发送邮件失败:', error);
      message.error('重新发送邮件失败');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Head>
          <title>邮件已发送 - Wiki知识库</title>
        </Head>

        <Card className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MailOutlined className="text-2xl text-blue-600" />
            </div>
            <Title level={3}>邮件已发送</Title>
            <Paragraph className="text-gray-600">
              我们已向 <strong>{email}</strong> 发送了密码重置邮件。
            </Paragraph>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <Paragraph className="text-sm text-blue-800 mb-2">
                <strong>接下来的步骤：</strong>
              </Paragraph>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>1. 检查您的邮箱（包括垃圾邮件箱）</li>
                <li>2. 点击邮件中的重置链接</li>
                <li>3. 设置新密码</li>
              </ul>
            </div>

            <div className="text-center">
              <Paragraph className="text-sm text-gray-500 mb-4">
                没有收到邮件？
              </Paragraph>
              <Space>
                <Button 
                  onClick={handleResendEmail}
                  loading={loading}
                  type="link"
                >
                  重新发送
                </Button>
                <Link href="/auth/login">
                  <Button type="link">
                    返回登录
                  </Button>
                </Link>
              </Space>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Head>
        <title>忘记密码 - Wiki知识库</title>
        <meta name="description" content="重置您的密码" />
      </Head>

      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <Title level={3}>忘记密码</Title>
          <Paragraph className="text-gray-600">
            输入您的邮箱地址，我们将发送密码重置链接给您。
          </Paragraph>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
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
              placeholder="请输入您的邮箱地址"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              block
            >
              发送重置邮件
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center">
          <Link href="/auth/login">
            <Button type="link" icon={<ArrowLeftOutlined />}>
              返回登录
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;