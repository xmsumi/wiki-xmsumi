import { NextPage } from 'next';
import Head from 'next/head';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  message, 
  Typography,
  Alert,
  Progress,
  Divider
} from 'antd';
import { 
  LockOutlined,
  SaveOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { AppLayout } from '@/components';
import { AuthGuard } from '@/components/auth';
import { authService, PasswordStrengthResponse } from '@/services/authService';

const { Title, Paragraph } = Typography;

interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * 修改密码页面
 */
const ChangePasswordPage: NextPage = () => {
  const router = useRouter();
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrengthResponse | null>(null);

  // 密码强度颜色映射
  const getPasswordStrengthColor = (level: string) => {
    switch (level) {
      case 'weak': return '#ff4d4f';
      case 'fair': return '#faad14';
      case 'good': return '#52c41a';
      case 'strong': return '#1890ff';
      default: return '#d9d9d9';
    }
  };

  // 密码强度文本映射
  const getPasswordStrengthText = (level: string) => {
    switch (level) {
      case 'weak': return '弱';
      case 'fair': return '一般';
      case 'good': return '良好';
      case 'strong': return '强';
      default: return '';
    }
  };

  // 检查密码强度
  const checkPasswordStrength = async (password: string) => {
    if (!password) {
      setPasswordStrength(null);
      return;
    }

    try {
      const strength = await authService.checkPasswordStrength(password);
      setPasswordStrength(strength);
    } catch (error) {
      console.error('密码强度检查失败:', error);
    }
  };

  // 处理表单提交
  const handleSubmit = async (values: ChangePasswordForm) => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      // 检查新密码确认
      if (values.newPassword !== values.confirmPassword) {
        setErrorMessage('两次输入的新密码不一致');
        return;
      }

      // 检查新密码是否与当前密码相同
      if (values.currentPassword === values.newPassword) {
        setErrorMessage('新密码不能与当前密码相同');
        return;
      }

      // 调用修改密码API
      await authService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      
      message.success('密码修改成功，请重新登录');
      
      // 清空表单
      form.resetFields();
      
      // 跳转到登录页面
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (error: any) {
      console.error('修改密码失败:', error);
      
      let errorMsg = '修改密码失败，请稍后重试';
      
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

  // 生成随机密码
  const handleGeneratePassword = async () => {
    try {
      const result = await authService.generatePassword(12);
      form.setFieldsValue({ 
        newPassword: result.password,
        confirmPassword: result.password 
      });
      await checkPasswordStrength(result.password);
      message.success('已生成强密码，请记住并保存');
    } catch (error) {
      message.error('生成密码失败，请重试');
    }
  };

  return (
    <AuthGuard requireAuth={true}>
      <Head>
        <title>修改密码 - Wiki知识库</title>
        <meta name="description" content="修改账户密码" />
      </Head>

      <AppLayout>
        <div className="max-w-2xl mx-auto p-6">
          <div className="mb-6">
            <Link href="/profile" className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center">
              <ArrowLeftOutlined className="mr-2" />
              返回个人资料
            </Link>
            <Title level={2}>修改密码</Title>
            <Paragraph className="text-gray-600">
              为了账户安全，请定期更换密码
            </Paragraph>
          </div>

          <Card>
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
                name="currentPassword"
                label="当前密码"
                rules={[
                  { required: true, message: '请输入当前密码' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="请输入当前密码"
                />
              </Form.Item>

              <Divider />

              <Form.Item
                name="newPassword"
                label="新密码"
                rules={[
                  { required: true, message: '请输入新密码' },
                  { min: 6, message: '密码至少6个字符' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="请输入新密码"
                  onChange={(e) => checkPasswordStrength(e.target.value)}
                />
              </Form.Item>

              {/* 密码强度指示器 */}
              {passwordStrength && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">密码强度:</span>
                    <span 
                      className="text-sm font-medium"
                      style={{ color: getPasswordStrengthColor(passwordStrength.level) }}
                    >
                      {getPasswordStrengthText(passwordStrength.level)}
                    </span>
                  </div>
                  <Progress
                    percent={(passwordStrength.score / 4) * 100}
                    strokeColor={getPasswordStrengthColor(passwordStrength.level)}
                    showInfo={false}
                    size="small"
                  />
                  {passwordStrength.feedback.length > 0 && (
                    <div className="mt-2">
                      {passwordStrength.feedback.map((feedback, index) => (
                        <div key={index} className="text-xs text-gray-500">
                          • {feedback}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

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
                    {isSubmitting ? '修改中...' : '修改密码'}
                  </Button>
                  <Button onClick={handleGeneratePassword}>
                    生成强密码
                  </Button>
                  <Button onClick={() => router.back()}>
                    取消
                  </Button>
                </div>
              </Form.Item>
            </Form>

            <Divider />

            <div className="text-gray-600">
              <Title level={5}>密码安全建议</Title>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>密码长度至少8个字符</li>
                <li>包含大小写字母、数字和特殊字符</li>
                <li>不要使用常见的密码或个人信息</li>
                <li>定期更换密码，建议每3-6个月更换一次</li>
                <li>不要在多个网站使用相同密码</li>
              </ul>
            </div>
          </Card>
        </div>
      </AppLayout>
    </AuthGuard>
  );
};

export default ChangePasswordPage;