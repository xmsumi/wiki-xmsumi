import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { Card, Result, Button, Spin, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, MailOutlined } from '@ant-design/icons';
import Link from 'next/link';

/**
 * 邮箱验证页面
 */
const VerifyEmailPage: NextPage = () => {
  const router = useRouter();
  const { token, code } = router.query;
  const [loading, setLoading] = useState(true);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (token) {
      verifyEmail();
    }
  }, [token, code]);

  const verifyEmail = async () => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams();
      queryParams.append('token', token as string);
      if (code) {
        queryParams.append('code', code as string);
      }

      const response = await fetch(`/api/auth/verify-email?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setVerificationResult({
          success: true,
          message: data.data.message
        });
        message.success('邮箱验证成功！');
      } else {
        setVerificationResult({
          success: false,
          message: data.error.message
        });
        message.error(data.error.message);
      }
    } catch (error) {
      console.error('邮箱验证失败:', error);
      setVerificationResult({
        success: false,
        message: '邮箱验证失败，请稍后重试'
      });
      message.error('邮箱验证失败');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    try {
      const response = await fetch('/api/auth/resend-verification-email', {
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
        message.success('验证邮件已重新发送，请检查您的邮箱');
      } else {
        message.error(data.error.message);
      }
    } catch (error) {
      console.error('重新发送验证邮件失败:', error);
      message.error('重新发送验证邮件失败');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Head>
          <title>邮箱验证中 - Wiki知识库</title>
        </Head>
        <Card className="w-full max-w-md">
          <div className="text-center py-8">
            <Spin size="large" />
            <p className="mt-4 text-gray-600">正在验证您的邮箱...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Head>
        <title>邮箱验证 - Wiki知识库</title>
        <meta name="description" content="验证您的邮箱地址" />
      </Head>

      <Card className="w-full max-w-md">
        {verificationResult?.success ? (
          <Result
            icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            title="邮箱验证成功！"
            subTitle={verificationResult.message}
            extra={[
              <Link key="login" href="/auth/login">
                <Button type="primary" size="large">
                  立即登录
                </Button>
              </Link>,
              <Link key="home" href="/">
                <Button size="large">
                  返回首页
                </Button>
              </Link>
            ]}
          />
        ) : (
          <Result
            icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
            title="邮箱验证失败"
            subTitle={verificationResult?.message || '验证链接无效或已过期'}
            extra={[
              <Button
                key="resend"
                type="primary"
                icon={<MailOutlined />}
                onClick={handleResendEmail}
                size="large"
              >
                重新发送验证邮件
              </Button>,
              <Link key="login" href="/auth/login">
                <Button size="large">
                  返回登录
                </Button>
              </Link>
            ]}
          />
        )}
      </Card>
    </div>
  );
};

export default VerifyEmailPage;