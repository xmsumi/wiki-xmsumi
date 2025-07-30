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
  Menu
} from 'antd';
import { 
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  FilterOutlined,
  ExportOutlined,
  CopyOutlined,
  MoreOutlined,
  FileTextOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { AppLayout } from '@/components';
import { AuthGuard } from '@/components/auth';
import { 
  documentService, 
  Document, 
  DocumentStatus, 
  DocumentSearchParams 
} from '@/services/documentService';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

/**
 * 文档管理页面
 */
const DocumentsManagePage: NextPage = () => {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [searchParams, setSearchParams] = useState<DocumentSearchParams>({
    page: 1,
    limit: 10,
    sortBy: 'updatedAt',
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
    published: 0,
    draft: 0,
    archived: 0
  });

  // 加载文档列表
  const loadDocuments = async (params?: DocumentSearchParams) => {
    try {
      setLoading(true);
      const response = await documentService.getDocuments(params || searchParams);
      setDocuments(response.documents);
      setPagination(prev => ({
        ...prev,
        current: response.pagination.page,
        pageSize: response.pagination.limit,
        total: response.pagination.total
      }));
    } catch (error) {
      console.error('加载文档列表失败:', error);
      message.error('加载文档列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载统计信息
  const loadStats = async () => {
    try {
      const statsData = await documentService.getDocumentStats();
      setStats({
        total: statsData.total,
        published: statsData.published,
        draft: statsData.draft,
        archived: statsData.archived
      });
    } catch (error) {
      console.error('加载统计信息失败:', error);
    }
  };

  // 初始化数据
  useEffect(() => {
    loadDocuments();
    loadStats();
  }, []);

  // 处理搜索
  const handleSearch = (value: string) => {
    const newParams = { ...searchParams, search: value, page: 1 };
    setSearchParams(newParams);
    loadDocuments(newParams);
  };

  // 处理筛选
  const handleFilter = (key: string, value: any) => {
    const newParams = { ...searchParams, [key]: value, page: 1 };
    setSearchParams(newParams);
    loadDocuments(newParams);
  };

  // 处理表格变化
  const handleTableChange = (paginationConfig: any, filters: any, sorter: any) => {
    const newParams = {
      ...searchParams,
      page: paginationConfig.current,
      limit: paginationConfig.pageSize,
      sortBy: sorter.field || 'updatedAt',
      sortOrder: sorter.order === 'ascend' ? 'asc' : 'desc'
    };
    setSearchParams(newParams);
    loadDocuments(newParams);
  };

  // 删除文档
  const handleDelete = async (id: number) => {
    try {
      await documentService.deleteDocument(id);
      message.success('文档删除成功');
      loadDocuments();
      loadStats();
    } catch (error) {
      console.error('删除文档失败:', error);
      message.error('删除文档失败');
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的文档');
      return;
    }

    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个文档吗？此操作不可恢复。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await documentService.deleteDocuments(selectedRowKeys);
          message.success(`成功删除 ${selectedRowKeys.length} 个文档`);
          setSelectedRowKeys([]);
          loadDocuments();
          loadStats();
        } catch (error) {
          console.error('批量删除失败:', error);
          message.error('批量删除失败');
        }
      }
    });
  };

  // 复制文档
  const handleDuplicate = async (id: number, title: string) => {
    try {
      await documentService.duplicateDocument(id, `${title} - 副本`);
      message.success('文档复制成功');
      loadDocuments();
      loadStats();
    } catch (error) {
      console.error('复制文档失败:', error);
      message.error('复制文档失败');
    }
  };

  // 更改文档状态
  const handleStatusChange = async (id: number, status: DocumentStatus) => {
    try {
      switch (status) {
        case DocumentStatus.PUBLISHED:
          await documentService.publishDocument(id);
          break;
        case DocumentStatus.ARCHIVED:
          await documentService.archiveDocument(id);
          break;
        case DocumentStatus.DRAFT:
          await documentService.unpublishDocument(id);
          break;
      }
      message.success('状态更新成功');
      loadDocuments();
      loadStats();
    } catch (error) {
      console.error('状态更新失败:', error);
      message.error('状态更新失败');
    }
  };

  // 导出文档
  const handleExport = async (id: number, format: 'pdf' | 'html' | 'markdown') => {
    try {
      const blob = await documentService.exportDocument(id, format);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `document.${format}`;
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

  // 表格列定义
  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      sorter: true,
      render: (title: string, record: Document) => (
        <div>
          <Link href={`/docs/${record.slug}`} className="text-blue-600 hover:text-blue-800">
            {title}
          </Link>
          {record.directory && (
            <div className="text-xs text-gray-500 mt-1">
              {record.directory.path}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: DocumentStatus) => (
        <Tag color={documentService.getStatusColor(status)}>
          {documentService.formatStatus(status)}
        </Tag>
      ),
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
      width: 120,
      render: (author: any) => author?.username || '未知',
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 150,
      render: (tags: string[]) => (
        <div>
          {tags.slice(0, 2).map(tag => (
            <Tag key={tag} size="small">{tag}</Tag>
          ))}
          {tags.length > 2 && <Tag size="small">+{tags.length - 2}</Tag>}
        </div>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 150,
      sorter: true,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record: Document) => {
        const actionMenu = (
          <Menu>
            <Menu.Item 
              key="duplicate" 
              icon={<CopyOutlined />}
              onClick={() => handleDuplicate(record.id, record.title)}
            >
              复制
            </Menu.Item>
            <Menu.Item 
              key="versions" 
              icon={<HistoryOutlined />}
              onClick={() => router.push(`/admin/documents/${record.id}/versions`)}
            >
              版本历史
            </Menu.Item>
            <Menu.SubMenu key="export" title="导出" icon={<ExportOutlined />}>
              <Menu.Item onClick={() => handleExport(record.id, 'pdf')}>PDF</Menu.Item>
              <Menu.Item onClick={() => handleExport(record.id, 'html')}>HTML</Menu.Item>
              <Menu.Item onClick={() => handleExport(record.id, 'markdown')}>Markdown</Menu.Item>
            </Menu.SubMenu>
            <Menu.SubMenu key="status" title="更改状态">
              {record.status !== DocumentStatus.PUBLISHED && (
                <Menu.Item onClick={() => handleStatusChange(record.id, DocumentStatus.PUBLISHED)}>
                  发布
                </Menu.Item>
              )}
              {record.status !== DocumentStatus.DRAFT && (
                <Menu.Item onClick={() => handleStatusChange(record.id, DocumentStatus.DRAFT)}>
                  设为草稿
                </Menu.Item>
              )}
              {record.status !== DocumentStatus.ARCHIVED && (
                <Menu.Item onClick={() => handleStatusChange(record.id, DocumentStatus.ARCHIVED)}>
                  归档
                </Menu.Item>
              )}
            </Menu.SubMenu>
          </Menu>
        );

        return (
          <Space>
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => router.push(`/docs/${record.slug}`)}
              size="small"
            >
              查看
            </Button>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => router.push(`/admin/documents/${record.id}/edit`)}
              size="small"
            >
              编辑
            </Button>
            <Popconfirm
              title="确定要删除这个文档吗？"
              onConfirm={() => handleDelete(record.id)}
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
    <AuthGuard requireAuth={true} requiredRole="editor">
      <Head>
        <title>文档管理 - Wiki知识库</title>
        <meta name="description" content="管理Wiki知识库中的所有文档" />
      </Head>

      <AppLayout>
        <div className="p-6">
          <div className="mb-6">
            <Title level={2}>文档管理</Title>
          </div>

          {/* 统计卡片 */}
          <Row gutter={16} className="mb-6">
            <Col span={6}>
              <Card>
                <Statistic
                  title="总文档数"
                  value={stats.total}
                  prefix={<FileTextOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="已发布"
                  value={stats.published}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="草稿"
                  value={stats.draft}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="已归档"
                  value={stats.archived}
                  valueStyle={{ color: '#8c8c8c' }}
                />
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
                  onClick={() => router.push('/admin/documents/new')}
                >
                  新建文档
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
                  placeholder="搜索文档标题或内容"
                  allowClear
                  onSearch={handleSearch}
                  style={{ width: 250 }}
                />
                <Select
                  placeholder="状态筛选"
                  allowClear
                  style={{ width: 120 }}
                  onChange={(value) => handleFilter('status', value)}
                >
                  <Option value={DocumentStatus.PUBLISHED}>已发布</Option>
                  <Option value={DocumentStatus.DRAFT}>草稿</Option>
                  <Option value={DocumentStatus.ARCHIVED}>已归档</Option>
                </Select>
                <Button icon={<FilterOutlined />}>
                  更多筛选
                </Button>
              </Space>
            </div>
          </Card>

          {/* 文档表格 */}
          <Card>
            <Table
              columns={columns}
              dataSource={documents}
              rowKey="id"
              loading={loading}
              pagination={pagination}
              rowSelection={rowSelection}
              onChange={handleTableChange}
              scroll={{ x: 1200 }}
            />
          </Card>
        </div>
      </AppLayout>
    </AuthGuard>
  );
};

export default DocumentsManagePage;