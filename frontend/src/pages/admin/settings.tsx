import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { 
  Tabs, 
  Card, 
  Form, 
  Input, 
  Switch, 
  Select, 
  Button, 
  Space, 
  message, 
  Typography,
  Row,
  Col,
  Statistic,
  Progress,
  Table,
  Tag,
  Modal,
  InputNumber
} from 'antd';
import { 
  SettingOutlined,
  SaveOutlined,
  ReloadOutlined,
  DatabaseOutlined,
  InfoCircleOutlined,
  DownloadOutlined,
  DeleteOutlined,
  ClearOutlined,
  CloudUploadOutlined,
  ExperimentOutlined
} from '@ant-design/icons';
import { AppLayout } from '@/components';
import { AuthGuard } from '@/components/auth';
import { 
  settingsService, 
  SystemSettings, 
  SystemStatus, 
  BackupInfo, 
  SystemLog 
} from '@/services/settingsService';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

/**
 * 系统设置页面
 */
const SettingsPage: NextPage = () => {
  const [form] = Form.useForm();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // 加载系统设置
  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getSettings();
      setSettings(data);
      form.setFieldsValue(data);
    } catch (error) {
      console.error('加载设置失败:', error);
      message.error('加载设置失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载系统状态
  const loadSystemStatus = async () => {
    try {
      const status = await settingsService.getSystemStatus();
      setSystemStatus(status);
    } catch (error) {
      console.error('加载系统状态失败:', error);
    }
  };

  // 加载备份列表
  const loadBackups = async () => {
    try {
      const backupList = await settingsService.getBackups();
      setBackups(backupList);
    } catch (error) {
      console.error('加载备份列表失败:', error);
    }
  };

  // 加载系统日志
  const loadLogs = async () => {
    try {
      const response = await settingsService.getSystemLogs({ limit: 50 });
      setLogs(response.logs);
    } catch (error) {
      console.error('加载系统日志失败:', error);
    }
  };

  useEffect(() => {
    loadSettings();
    loadSystemStatus();
    loadBackups();
    loadLogs();
  }, []);

  // 保存设置
  const handleSaveSettings = async (values: Partial<SystemSettings>) => {
    try {
      setSaving(true);
      const updatedSettings = await settingsService.updateSettings(values);
      setSettings(updatedSettings);
      message.success('设置保存成功');
    } catch (error) {
      console.error('保存设置失败:', error);
      message.error('保存设置失败');
    } finally {
      setSaving(false);
    }
  };

  // 测试邮件设置
  const handleTestEmail = async () => {
    const values = form.getFieldsValue();
    
    Modal.confirm({
      title: '测试邮件设置',
      content: (
        <div>
          <p>请输入测试邮件地址：</p>
          <Input 
            id="testEmailInput" 
            placeholder="test@example.com" 
            style={{ marginTop: 8 }}
          />
        </div>
      ),
      onOk: async () => {
        const testEmailTo = (document.getElementById('testEmailInput') as HTMLInputElement)?.value;
        if (!testEmailTo) {
          message.error('请输入测试邮件地址');
          return;
        }

        try {
          const result = await settingsService.testEmailSettings({
            smtpHost: values.smtpHost,
            smtpPort: values.smtpPort,
            smtpSecure: values.smtpSecure,
            smtpUser: values.smtpUser,
            smtpPassword: values.smtpPassword,
            emailFromAddress: values.emailFromAddress,
            testEmailTo
          });
          
          if (result.success) {
            message.success('测试邮件发送成功');
          } else {
            message.error(`测试失败: ${result.message}`);
          }
        } catch (error) {
          console.error('测试邮件失败:', error);
          message.error('测试邮件失败');
        }
      }
    });
  };

  // 创建备份
  const handleCreateBackup = async () => {
    try {
      await settingsService.createBackup('手动备份');
      message.success('备份创建成功');
      loadBackups();
    } catch (error) {
      console.error('创建备份失败:', error);
      message.error('创建备份失败');
    }
  };

  // 下载备份
  const handleDownloadBackup = async (backup: BackupInfo) => {
    try {
      const blob = await settingsService.downloadBackup(backup.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = backup.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      message.success('备份下载成功');
    } catch (error) {
      console.error('下载备份失败:', error);
      message.error('下载备份失败');
    }
  };

  // 删除备份
  const handleDeleteBackup = async (backup: BackupInfo) => {
    try {
      await settingsService.deleteBackup(backup.id);
      message.success('备份删除成功');
      loadBackups();
    } catch (error) {
      console.error('删除备份失败:', error);
      message.error('删除备份失败');
    }
  };

  // 清理缓存
  const handleClearCache = async () => {
    try {
      await settingsService.clearCache();
      message.success('缓存清理成功');
    } catch (error) {
      console.error('清理缓存失败:', error);
      message.error('清理缓存失败');
    }
  };

  // 重建搜索索引
  const handleRebuildSearchIndex = async () => {
    try {
      await settingsService.rebuildSearchIndex();
      message.success('搜索索引重建成功');
    } catch (error) {
      console.error('重建搜索索引失败:', error);
      message.error('重建搜索索引失败');
    }
  };

  // 备份表格列
  const backupColumns = [
    {
      title: '文件名',
      dataIndex: 'filename',
      key: 'filename',
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      render: (size: number) => settingsService.formatFileSize(size),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'manual' ? 'blue' : 'green'}>
          {type === 'manual' ? '手动' : '自动'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={settingsService.getStatusColor(status)}>
          {status === 'completed' ? '完成' : status === 'failed' ? '失败' : '进行中'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: BackupInfo) => (
        <Space>
          <Button
            type="link"
            icon={<DownloadOutlined />}
            onClick={() => handleDownloadBackup(record)}
            size="small"
          >
            下载
          </Button>
          <Button
            type="link"
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteBackup(record)}
            danger
            size="small"
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  // 日志表格列
  const logColumns = [
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: string) => (
        <Tag color={settingsService.getLogLevelColor(level)}>
          {level.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: '消息',
      dataIndex: 'message',
      key: 'message',
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 120,
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 160,
      render: (date: string) => new Date(date).toLocaleString(),
    },
  ];

  if (loading || !settings) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div>加载中...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AuthGuard requireAuth={true} requiredRole="admin">
      <Head>
        <title>系统设置 - Wiki知识库</title>
        <meta name="description" content="配置Wiki知识库系统设置" />
      </Head>

      <AppLayout>
        <div className="p-6">
          <div className="mb-6">
            <Title level={2}>
              <SettingOutlined className="mr-2" />
              系统设置
            </Title>
          </div>

          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            items={[
              {
                key: 'basic',
                label: '基本设置',
                children: (
              <Card>
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSaveSettings}
                  initialValues={settings}
                >
                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item
                        name="siteName"
                        label="网站名称"
                        rules={[{ required: true, message: '请输入网站名称' }]}
                      >
                        <Input placeholder="请输入网站名称" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="siteUrl"
                        label="网站URL"
                        rules={[{ required: true, message: '请输入网站URL' }]}
                      >
                        <Input placeholder="https://example.com" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    name="siteDescription"
                    label="网站描述"
                  >
                    <TextArea rows={3} placeholder="请输入网站描述" />
                  </Form.Item>

                  <Form.Item
                    name="siteKeywords"
                    label="网站关键词"
                  >
                    <Input placeholder="关键词1,关键词2,关键词3" />
                  </Form.Item>

                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item
                        name="allowRegistration"
                        label="允许用户注册"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="requireEmailVerification"
                        label="需要邮箱验证"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    name="defaultUserRole"
                    label="默认用户角色"
                  >
                    <Select>
                      <Option value="viewer">查看者</Option>
                      <Option value="editor">编辑者</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item>
                    <Space>
                      <Button
                        type="primary"
                        htmlType="submit"
                        icon={<SaveOutlined />}
                        loading={saving}
                      >
                        保存设置
                      </Button>
                      <Button
                        icon={<ReloadOutlined />}
                        onClick={loadSettings}
                      >
                        重新加载
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              </Card>
                )
              },
              {
                key: 'email',
                label: '邮件设置',
                children: (
              <Card>
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSaveSettings}
                >
                  <Form.Item
                    name="emailEnabled"
                    label="启用邮件功能"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>

                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item
                        name="smtpHost"
                        label="SMTP主机"
                        tooltip="QQ邮箱请使用: smtp.qq.com"
                      >
                        <Input placeholder="smtp.qq.com (QQ邮箱)" />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        name="smtpPort"
                        label="SMTP端口"
                        tooltip="QQ邮箱SSL端口: 465, TLS端口: 587"
                      >
                        <InputNumber min={1} max={65535} placeholder="465" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        name="smtpSecure"
                        label="使用SSL/TLS"
                        valuePropName="checked"
                        tooltip="QQ邮箱建议启用SSL/TLS"
                      >
                        <Switch />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item
                        name="smtpUser"
                        label="SMTP用户名"
                        tooltip="QQ邮箱请填写完整邮箱地址"
                      >
                        <Input placeholder="your_email@qq.com" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="smtpPassword"
                        label="SMTP密码"
                        tooltip="QQ邮箱请使用16位授权码，不是QQ密码"
                      >
                        <Input.Password placeholder="请输入16位授权码" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item
                        name="emailFromAddress"
                        label="发件人邮箱"
                      >
                        <Input placeholder="noreply@example.com" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="emailFromName"
                        label="发件人姓名"
                      >
                        <Input placeholder="Wiki知识库" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item>
                    <Space>
                      <Button
                        type="primary"
                        htmlType="submit"
                        icon={<SaveOutlined />}
                        loading={saving}
                      >
                        保存设置
                      </Button>
                      <Button
                        icon={<ExperimentOutlined />}
                        onClick={handleTestEmail}
                      >
                        测试邮件
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              </Card>
                )
              },
              {
                key: 'status',
                label: '系统状态',
                children: (
                  <div>
                    <Row gutter={16} className="mb-6">
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="运行时间"
                      value={systemStatus ? settingsService.formatUptime(systemStatus.uptime) : '加载中...'}
                      prefix={<DatabaseOutlined />}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="活跃用户"
                      value={systemStatus?.activeUsers || 0}
                      prefix={<InfoCircleOutlined />}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-2">CPU使用率</div>
                      <Progress
                        type="circle"
                        percent={systemStatus?.cpuUsage || 0}
                        size={80}
                        status={systemStatus && systemStatus.cpuUsage > 80 ? 'exception' : 'normal'}
                      />
                    </div>
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-2">内存使用率</div>
                      <Progress
                        type="circle"
                        percent={systemStatus?.memoryUsage.percentage || 0}
                        size={80}
                        status={systemStatus && systemStatus.memoryUsage.percentage > 80 ? 'exception' : 'normal'}
                      />
                    </div>
                  </Card>
                </Col>
              </Row>

              <Card title="系统服务状态">
                <Row gutter={16}>
                  <Col span={8}>
                    <div className="text-center p-4">
                      <div className="text-lg font-medium mb-2">数据库</div>
                      <Tag color={settingsService.getStatusColor(systemStatus?.databaseStatus || 'error')}>
                        {systemStatus?.databaseStatus === 'connected' ? '已连接' : '未连接'}
                      </Tag>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div className="text-center p-4">
                      <div className="text-lg font-medium mb-2">搜索引擎</div>
                      <Tag color={settingsService.getStatusColor(systemStatus?.searchEngineStatus || 'error')}>
                        {systemStatus?.searchEngineStatus === 'connected' ? '已连接' : '未连接'}
                      </Tag>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div className="text-center p-4">
                      <div className="text-lg font-medium mb-2">最后备份</div>
                      <div className="text-sm text-gray-600">
                        {systemStatus?.lastBackup 
                          ? new Date(systemStatus.lastBackup).toLocaleString()
                          : '无备份记录'
                        }
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card>

              <Card title="系统操作" className="mt-4">
                <Space wrap>
                  <Button
                    icon={<ClearOutlined />}
                    onClick={handleClearCache}
                  >
                    清理缓存
                  </Button>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleRebuildSearchIndex}
                  >
                    重建搜索索引
                  </Button>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={loadSystemStatus}
                  >
                    刷新状态
                  </Button>
                </Space>
              </Card>
                  </div>
                )
              },
              {
                key: 'backup',
                label: '备份管理',
                children: (
                  <Card
                    title="备份列表"
                    extra={
                      <Button
                        type="primary"
                        icon={<CloudUploadOutlined />}
                        onClick={handleCreateBackup}
                      >
                        创建备份
                      </Button>
                    }
                  >
                    <Table
                      columns={backupColumns}
                      dataSource={backups}
                      rowKey="id"
                      pagination={{ pageSize: 10 }}
                    />
                  </Card>
                )
              },
              {
                key: 'logs',
                label: '系统日志',
                children: (
                  <Card
                    title="系统日志"
                    extra={
                      <Button
                        icon={<ReloadOutlined />}
                        onClick={loadLogs}
                      >
                        刷新日志
                      </Button>
                    }
                  >
                    <Table
                      columns={logColumns}
                      dataSource={logs}
                      rowKey="id"
                      pagination={{ pageSize: 20 }}
                      scroll={{ x: 800 }}
                    />
                  </Card>
                )
              }
            ]}
          />
        </div>
      </AppLayout>
    </AuthGuard>
  );
};

export default SettingsPage;