import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  Input, 
  Select, 
  Tag, 
  Modal, 
  message, 
  Popconfirm,
  Typography,
  Card,
  Row,
  Col,
  Statistic,
  Dropdown,
  Menu,
  Avatar,
  Switch,
  Form,
  Upload
} from 'antd';
import { 
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  FilterOutlined,
  ExportOutlined,
  ImportOutlined,
  UserOutlined,
  MoreOutlined,
  MailOutlined,
  KeyOutlined,
  EyeOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/router';
import { AppLayout } from '@/components';
import { AuthGuard } from '@/components/auth';
import { 
  userService, 
  User, 
  UserRole, 
  UserSearchParams,
  CreateUserRequest,
  UpdateUserRequest
} from '@/services/userService';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

/**
 * 用户管理页面
 */
const UsersManagePage: NextPage = () => {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [searchParams, setSearchParams] = useState<UserSearchParams>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total: number, range: [number, number]) => 
      `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
  });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    byRole: [] as Array<{ role: UserRole; count: number }>
  });

  // 模态框状态
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // 加载用户列表
  const loadUsers = async (params?: UserSearchParams) => {
    try {
      setLoading(true);
      const response = await userService.getUsers(params || searchParams);
      setUsers(response.users);
      setPagination(prev => ({
        ...prev,
        current: response.pagination.page,
        pageSize: response.pagination.limit,
        total: response.pagination.total
      }));
    } catch (error) {
      console.error('加载用户列表失败:', error);
      message.error('加载用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载统计信息
  const loadStats = async () => {
    try {
      const statsData = await userService.getUserStats();
      setStats(statsData);
    } catch (error) {
      console.error('加载统计信息失败:', error);
    }
  };

  // 初始化数据
  useEffect(() => {
    loadUsers();
    loadStats();
  }, []);

  // 处理搜索
  const handleSearch = (value: string) => {
    const newParams = { ...searchParams, search: value, page: 1 };
    setSearchParams(newParams);
    loadUsers(newParams);
  };

  // 处理筛选
  const handleFilter = (key: string, value: any) => {
    const newParams = { ...searchParams, [key]: value, page: 1 };
    setSearchParams(newParams);
    loadUsers(newParams);
  };

  // 处理表格变化
  const handleTableChange = (paginationConfig: any, filters: any, sorter: any) => {
    const newParams = {
      ...searchParams,
      page: paginationConfig.current,
      limit: paginationConfig.pageSize,
      sortBy: sorter.field || 'createdAt',
      sortOrder: sorter.order === 'ascend' ? 'asc' : 'desc'
    };
    setSearchParams(newParams);
    loadUsers(newParams);
  };

  // 创建用户
  const handleCreateUser = async (values: CreateUserRequest) => {
    try {
      await userService.createUser(values);
      message.success('用户创建成功');
      setIsCreateModalVisible(false);
      createForm.resetFields();
      loadUsers();
      loadStats();
    } catch (error) {
      console.error('创建用户失败:', error);
      message.error('创建用户失败');
    }
  };

  // 编辑用户
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    editForm.setFieldsValue({
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    });
    setIsEditModalVisible(true);
  };

  // 更新用户
  const handleUpdateUser = async (values: UpdateUserRequest) => {
    if (!editingUser) return;

    try {
      await userService.updateUser(editingUser.id, values);
      message.success('用户更新成功');
      setIsEditModalVisible(false);
      setEditingUser(null);
      editForm.resetFields();
      loadUsers();
      loadStats();
    } catch (error) {
      console.error('更新用户失败:', error);
      message.error('更新用户失败');
    }
  };

  // 删除用户
  const handleDeleteUser = async (id: number) => {
    try {
      await userService.deleteUser(id);
      message.success('用户删除成功');
      loadUsers();
      loadStats();
    } catch (error) {
      console.error('删除用户失败:', error);
      message.error('删除用户失败');
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的用户');
      return;
    }

    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个用户吗？此操作不可恢复。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await userService.deleteUsers(selectedRowKeys);
          message.success(`成功删除 ${selectedRowKeys.length} 个用户`);
          setSelectedRowKeys([]);
          loadUsers();
          loadStats();
        } catch (error) {
          console.error('批量删除失败:', error);
          message.error('批量删除失败');
        }
      }
    });
  };

  // 切换用户状态
  const handleToggleUserStatus = async (user: User) => {
    try {
      if (user.isActive) {
        await userService.deactivateUser(user.id);
        message.success('用户已停用');
      } else {
        await userService.activateUser(user.id);
        message.success('用户已激活');
      }
      loadUsers();
      loadStats();
    } catch (error) {
      console.error('切换用户状态失败:', error);
      message.error('操作失败');
    }
  };

  // 重置密码
  const handleResetPassword = async (user: User) => {
    try {
      const result = await userService.resetUserPassword(user.id);
      Modal.info({
        title: '密码重置成功',
        content: (
          <div>
            <p>用户 {user.username} 的密码已重置</p>
            {result.password && (
              <div>
                <p>新密码: <code>{result.password}</code></p>
                <p className="text-red-500">请将新密码告知用户，并提醒用户及时修改密码</p>
              </div>
            )}
          </div>
        ),
      });
      message.success('密码重置成功');
    } catch (error) {
      console.error('重置密码失败:', error);
      message.error('重置密码失败');
    }
  };

  // 发送邀请
  const handleSendInvitation = (email: string, role: UserRole) => {
    Modal.confirm({
      title: '发送邀请',
      content: `确定要向 ${email} 发送${userService.formatRole(role)}邀请吗？`,
      onOk: async () => {
        try {
          await userService.sendInvitation(email, role);
          message.success('邀请已发送');
        } catch (error) {
          console.error('发送邀请失败:', error);
          message.error('发送邀请失败');
        }
      }
    });
  };

  // 导出用户
  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const blob = await userService.exportUsers(format, searchParams);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `users.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败');
    }
  };

  // 导入用户
  const handleImport = async (file: File) => {
    try {
      const result = await userService.importUsers(file);
      message.success(`导入完成：成功 ${result.success} 个，失败 ${result.failed} 个`);
      if (result.errors.length > 0) {
        Modal.warning({
          title: '导入错误',
          content: (
            <div>
              <p>以下行导入失败：</p>
              <ul>
                {result.errors.map((error, index) => (
                  <li key={index}>第 {error.row} 行: {error.error}</li>
                ))}
              </ul>
            </div>
          ),
        });
      }
      setIsImportModalVisible(false);
      loadUsers();
      loadStats();
    } catch (error) {
      console.error('导入失败:', error);
      message.error('导入失败');
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '用户',
      key: 'user',
      render: (_, record: User) => (
        <div className="flex items-center">
          <Avatar
            size="small"
            src={record.avatar_url}
            icon={<UserOutlined />}
            className="mr-3"
          />
          <div>
            <div className="font-medium">{record.username}</div>
            <div className="text-sm text-gray-500">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role: UserRole) => (
        <Tag color={userService.getRoleColor(role)}>
          {userService.formatRole(role)}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive: boolean, record: User) => (
        <Switch
          checked={isActive}
          onChange={() => handleToggleUserStatus(record)}
          checkedChildren="启用"
          unCheckedChildren="停用"
          size="small"
        />
      ),
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: 150,
      render: (date: string | null) => 
        date ? new Date(date).toLocaleString() : '从未登录',
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      sorter: true,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record: User) => {
        const actionMenu = (
          <Menu>
            <Menu.Item 
              key="view" 
              icon={<EyeOutlined />}
              onClick={() => router.push(`/admin/users/${record.id}`)}
            >
              查看详情
            </Menu.Item>
            <Menu.Item 
              key="resetPassword" 
              icon={<KeyOutlined />}
              onClick={() => handleResetPassword(record)}
            >
              重置密码
            </Menu.Item>
            <Menu.Item 
              key="sendInvite" 
              icon={<MailOutlined />}
              onClick={() => handleSendInvitation(record.email, record.role)}
            >
              发送邀请
            </Menu.Item>
          </Menu>
        );

        return (
          <Space>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEditUser(record)}
              size="small"
            >
              编辑
            </Button>
            <Popconfirm
              title="确定要删除这个用户吗？"
              onConfirm={() => handleDeleteUser(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                icon={<DeleteOutlined />}
                danger
                size="small"
              >
                删除
              </Button>
            </Popconfirm>
            <Dropdown overlay={actionMenu} trigger={['click']}>
              <Button type="link" icon={<MoreOutlined />} size="small" />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  // 行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys as number[]),
  };

  return (
    <AuthGuard requireAuth={true} requiredRole="admin">
      <Head>
        <title>用户管理 - Wiki知识库</title>
        <meta name="description" content="管理Wiki知识库的用户账户" />
      </Head>

      <AppLayout>
        <div className="p-6">
          <div className="mb-6">
            <Title level={2}>用户管理</Title>
          </div>

          {/* 统计卡片 */}
          <Row gutter={16} className="mb-6">
            <Col span={6}>
              <Card>
                <Statistic
                  title="总用户数"
                  value={stats.total}
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="活跃用户"
                  value={stats.active}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="停用用户"
                  value={stats.inactive}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-2">角色分布</div>
                  <div className="space-x-2">
                    {stats.byRole.map(item => (
                      <Tag key={item.role} color={userService.getRoleColor(item.role)}>
                        {userService.formatRole(item.role)}: {item.count}
                      </Tag>
                    ))}
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          {/* 操作栏 */}
          <Card className="mb-4">
            <div className="flex justify-between items-center">
              <Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setIsCreateModalVisible(true)}
                >
                  新建用户
                </Button>
                <Button
                  icon={<ImportOutlined />}
                  onClick={() => setIsImportModalVisible(true)}
                >
                  导入用户
                </Button>
                {selectedRowKeys.length > 0 && (
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleBatchDelete}
                  >
                    批量删除 ({selectedRowKeys.length})
                  </Button>
                )}
              </Space>

              <Space>
                <Search
                  placeholder="搜索用户名或邮箱"
                  allowClear
                  onSearch={handleSearch}
                  style={{ width: 250 }}
                />
                <Select
                  placeholder="角色筛选"
                  allowClear
                  style={{ width: 120 }}
                  onChange={(value) => handleFilter('role', value)}
                >
                  <Option value={UserRole.ADMIN}>管理员</Option>
                  <Option value={UserRole.EDITOR}>编辑者</Option>
                  <Option value={UserRole.VIEWER}>查看者</Option>
                </Select>
                <Select
                  placeholder="状态筛选"
                  allowClear
                  style={{ width: 120 }}
                  onChange={(value) => handleFilter('isActive', value)}
                >
                  <Option value={true}>启用</Option>
                  <Option value={false}>停用</Option>
                </Select>
                <Dropdown
                  overlay={
                    <Menu>
                      <Menu.Item onClick={() => handleExport('csv')}>
                        导出为 CSV
                      </Menu.Item>
                      <Menu.Item onClick={() => handleExport('excel')}>
                        导出为 Excel
                      </Menu.Item>
                    </Menu>
                  }
                >
                  <Button icon={<ExportOutlined />}>
                    导出
                  </Button>
                </Dropdown>
              </Space>
            </div>
          </Card>

          {/* 用户表格 */}
          <Card>
            <Table
              columns={columns}
              dataSource={users}
              rowKey="id"
              loading={loading}
              pagination={pagination}
              rowSelection={rowSelection}
              onChange={handleTableChange}
              scroll={{ x: 1200 }}
            />
          </Card>

          {/* 创建用户对话框 */}
          <Modal
            title="创建用户"
            open={isCreateModalVisible}
            onCancel={() => {
              setIsCreateModalVisible(false);
              createForm.resetFields();
            }}
            footer={null}
          >
            <Form
              form={createForm}
              layout="vertical"
              onFinish={handleCreateUser}
            >
              <Form.Item
                name="username"
                label="用户名"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 3, message: '用户名至少3个字符' },
                  { pattern: /^[a-zA-Z0-9_-]+$/, message: '用户名只能包含字母、数字、下划线和连字符' }
                ]}
              >
                <Input placeholder="请输入用户名" />
              </Form.Item>

              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>

              <Form.Item
                name="password"
                label="密码"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6个字符' }
                ]}
              >
                <Input.Password placeholder="请输入密码" />
              </Form.Item>

              <Form.Item
                name="role"
                label="角色"
                rules={[{ required: true, message: '请选择角色' }]}
              >
                <Select placeholder="请选择角色">
                  <Option value={UserRole.ADMIN}>管理员</Option>
                  <Option value={UserRole.EDITOR}>编辑者</Option>
                  <Option value={UserRole.VIEWER}>查看者</Option>
                </Select>
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit">
                    创建
                  </Button>
                  <Button onClick={() => {
                    setIsCreateModalVisible(false);
                    createForm.resetFields();
                  }}>
                    取消
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>

          {/* 编辑用户对话框 */}
          <Modal
            title="编辑用户"
            open={isEditModalVisible}
            onCancel={() => {
              setIsEditModalVisible(false);
              setEditingUser(null);
              editForm.resetFields();
            }}
            footer={null}
          >
            <Form
              form={editForm}
              layout="vertical"
              onFinish={handleUpdateUser}
            >
              <Form.Item
                name="username"
                label="用户名"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 3, message: '用户名至少3个字符' },
                  { pattern: /^[a-zA-Z0-9_-]+$/, message: '用户名只能包含字母、数字、下划线和连字符' }
                ]}
              >
                <Input placeholder="请输入用户名" />
              </Form.Item>

              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>

              <Form.Item
                name="role"
                label="角色"
                rules={[{ required: true, message: '请选择角色' }]}
              >
                <Select placeholder="请选择角色">
                  <Option value={UserRole.ADMIN}>管理员</Option>
                  <Option value={UserRole.EDITOR}>编辑者</Option>
                  <Option value={UserRole.VIEWER}>查看者</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="isActive"
                label="状态"
                valuePropName="checked"
              >
                <Switch checkedChildren="启用" unCheckedChildren="停用" />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit">
                    更新
                  </Button>
                  <Button onClick={() => {
                    setIsEditModalVisible(false);
                    setEditingUser(null);
                    editForm.resetFields();
                  }}>
                    取消
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>

          {/* 导入用户对话框 */}
          <Modal
            title="导入用户"
            open={isImportModalVisible}
            onCancel={() => setIsImportModalVisible(false)}
            footer={null}
          >
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  支持导入CSV或Excel格式的用户数据文件。文件应包含以下列：
                </p>
                <ul className="text-sm text-gray-500 list-disc list-inside space-y-1">
                  <li>username (用户名)</li>
                  <li>email (邮箱)</li>
                  <li>password (密码)</li>
                  <li>role (角色: admin/editor/viewer)</li>
                </ul>
              </div>
              
              <Upload
                accept=".csv,.xlsx,.xls"
                showUploadList={false}
                beforeUpload={(file) => {
                  handleImport(file);
                  return false;
                }}
              >
                <Button icon={<UploadOutlined />} block>
                  选择文件
                </Button>
              </Upload>
            </div>
          </Modal>
        </div>
      </AppLayout>
    </AuthGuard>
  );
};

export default UsersManagePage;