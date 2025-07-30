import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  Table, 
  Button, 
  Space, 
  Card, 
  message, 
  Breadcrumb,
  Typography,
  Modal,
  Popconfirm,
  Tag,
  Tooltip,
  Divider
} from 'antd';
import { 
  ArrowLeftOutlined,
  EyeOutlined,
  RestoreOutlined,
  HistoryOutlined,
  UserOutlined,
  CalendarOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { AppLayout } from '@/components';
import { AuthGuard } from '@/components/auth';
import { 
  documentService, 
  Document, 
  DocumentVersion 
} from '@/services/documentService';

const { Title, Paragraph } = Typography;

/**
 * 文档版本历史页面
 */
const DocumentVersionsPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const [document, setDocument] = useState<Document | null>(null);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const [isCompareModalVisible, setIsCompareModalVisible] = useState(false);
  const [compareVersions, setCompareVersions] = useState<{
    version1: DocumentVersion | null;
    version2: DocumentVersion | null;
  }>({ version1: null, version2: null });

  // 加载文档信息
  const loadDocument = async () => {
    if (!id || Array.isArray(id)) return;

    try {
      const doc = await documentService.getDocument(parseInt(id));
      setDocument(doc);
    } catch (error) {
      console.error('加载文档失败:', error);
      message.error('加载文档失败');
    }
  };

  // 加载版本历史
  const loadVersions = async () => {
    if (!id || Array.isArray(id)) return;

    try {
      setLoading(true);
      const versionList = await documentService.getDocumentVersions(parseInt(id));
      setVersions(versionList);
    } catch (error) {
      console.error('加载版本历史失败:', error);
      message.error('加载版本历史失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocument();
    loadVersions();
  }, [id]);

  // 预览版本
  const handlePreviewVersion = (version: DocumentVersion) => {
    setSelectedVersion(version);
    setIsPreviewModalVisible(true);
  };

  // 恢复到指定版本
  const handleRestoreVersion = async (version: DocumentVersion) => {
    if (!document) return;

    try {
      await documentService.restoreDocumentVersion(document.id, version.versionNumber);
      message.success(`已恢复到版本 ${version.versionNumber}`);
      
      // 刷新数据
      loadDocument();
      loadVersions();
    } catch (error) {
      console.error('恢复版本失败:', error);
      message.error('恢复版本失败');
    }
  };

  // 比较版本
  const handleCompareVersions = (version1: DocumentVersion, version2: DocumentVersion) => {
    setCompareVersions({ version1, version2 });
    setIsCompareModalVisible(true);
  };

  // 格式化文件大小
  const formatContentSize = (content: string): string => {
    const bytes = new Blob([content]).size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 计算内容变化
  const getContentChanges = (oldContent: string, newContent: string) => {
    const oldLines = oldContent.split('\n').length;
    const newLines = newContent.split('\n').length;
    const lineDiff = newLines - oldLines;
    
    return {
      lineDiff,
      sizeDiff: new Blob([newContent]).size - new Blob([oldContent]).size
    };
  };

  // 表格列定义
  const columns = [
    {
      title: '版本',
      dataIndex: 'versionNumber',
      key: 'versionNumber',
      width: 80,
      render: (versionNumber: number, record: DocumentVersion) => (
        <div className="flex items-center">
          <Tag color="blue">v{versionNumber}</Tag>
          {versionNumber === 1 && <Tag color="green" size="small">初始版本</Tag>}
        </div>
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: DocumentVersion) => (
        <div>
          <div className="font-medium">{title}</div>
          {record.changeSummary && (
            <div className="text-sm text-gray-500 mt-1">
              {record.changeSummary}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
      width: 120,
      render: (author: any) => (
        <div className="flex items-center">
          <UserOutlined className="mr-2 text-gray-400" />
          {author?.username || '未知'}
        </div>
      ),
    },
    {
      title: '内容大小',
      dataIndex: 'content',
      key: 'contentSize',
      width: 100,
      render: (content: string) => (
        <span className="text-sm text-gray-600">
          {formatContentSize(content)}
        </span>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => (
        <div className="flex items-center text-sm">
          <CalendarOutlined className="mr-2 text-gray-400" />
          {new Date(date).toLocaleString()}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record: DocumentVersion, index: number) => (
        <Space>
          <Tooltip title="预览此版本">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handlePreviewVersion(record)}
              size="small"
            >
              预览
            </Button>
          </Tooltip>
          
          {index > 0 && (
            <Tooltip title="与上一版本比较">
              <Button
                type="link"
                onClick={() => handleCompareVersions(versions[index - 1], record)}
                size="small"
              >
                比较
              </Button>
            </Tooltip>
          )}
          
          {record.versionNumber !== versions[0]?.versionNumber && (
            <Popconfirm
              title={`确定要恢复到版本 ${record.versionNumber} 吗？`}
              description="恢复后当前版本将被保存为新版本"
              onConfirm={() => handleRestoreVersion(record)}
              okText="确定"
              cancelText="取消"
            >
              <Tooltip title="恢复到此版本">
                <Button
                  type="link"
                  icon={<RestoreOutlined />}
                  size="small"
                  danger
                >
                  恢复
                </Button>
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  if (!document) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div>加载中...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AuthGuard requireAuth={true} requiredRole="editor">
      <Head>
        <title>版本历史: {document.title} - Wiki知识库</title>
        <meta name="description" content={`查看文档"${document.title}"的版本历史`} />
      </Head>

      <AppLayout>
        <div className="p-6">
          {/* 面包屑导航 */}
          <Breadcrumb className="mb-4">
            <Breadcrumb.Item>
              <Link href="/admin/documents">文档管理</Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <Link href={`/admin/documents/${document.id}/edit`}>
                {document.title}
              </Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>版本历史</Breadcrumb.Item>
          </Breadcrumb>

          {/* 页面标题和操作 */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <Title level={2}>
                <HistoryOutlined className="mr-2" />
                版本历史
              </Title>
              <Paragraph className="text-gray-600">
                文档: {document.title}
              </Paragraph>
            </div>
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => router.back()}
              >
                返回
              </Button>
              <Button
                type="primary"
                onClick={() => router.push(`/admin/documents/${document.id}/edit`)}
              >
                编辑文档
              </Button>
            </Space>
          </div>

          {/* 版本统计 */}
          <Card className="mb-6">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {versions.length}
                </div>
                <div className="text-sm text-gray-600">总版本数</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {versions[0]?.versionNumber || 0}
                </div>
                <div className="text-sm text-gray-600">当前版本</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {document.author?.username || '未知'}
                </div>
                <div className="text-sm text-gray-600">原作者</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {new Date(document.createdAt).toLocaleDateString()}
                </div>
                <div className="text-sm text-gray-600">创建日期</div>
              </div>
            </div>
          </Card>

          {/* 版本列表 */}
          <Card>
            <Table
              columns={columns}
              dataSource={versions}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `第 ${range[0]}-${range[1]} 条，共 ${total} 条版本`
              }}
            />
          </Card>

          {/* 版本预览对话框 */}
          <Modal
            title={
              selectedVersion ? (
                <div>
                  <FileTextOutlined className="mr-2" />
                  版本 {selectedVersion.versionNumber} 预览
                </div>
              ) : '版本预览'
            }
            open={isPreviewModalVisible}
            onCancel={() => setIsPreviewModalVisible(false)}
            footer={null}
            width={800}
            bodyStyle={{ maxHeight: '70vh', overflow: 'auto' }}
          >
            {selectedVersion && (
              <div>
                <div className="mb-4 p-3 bg-gray-50 rounded">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">标题:</span>
                      <span className="ml-2 font-medium">{selectedVersion.title}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">作者:</span>
                      <span className="ml-2">{selectedVersion.author?.username}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">创建时间:</span>
                      <span className="ml-2">{new Date(selectedVersion.createdAt).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">内容大小:</span>
                      <span className="ml-2">{formatContentSize(selectedVersion.content)}</span>
                    </div>
                  </div>
                  {selectedVersion.changeSummary && (
                    <div className="mt-2">
                      <span className="text-gray-600">变更摘要:</span>
                      <span className="ml-2">{selectedVersion.changeSummary}</span>
                    </div>
                  )}
                </div>
                
                <Divider />
                
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded text-sm">
                    {selectedVersion.content}
                  </pre>
                </div>
              </div>
            )}
          </Modal>

          {/* 版本比较对话框 */}
          <Modal
            title="版本比较"
            open={isCompareModalVisible}
            onCancel={() => setIsCompareModalVisible(false)}
            footer={null}
            width={1200}
            bodyStyle={{ maxHeight: '70vh', overflow: 'auto' }}
          >
            {compareVersions.version1 && compareVersions.version2 && (
              <div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Card size="small" title={`版本 ${compareVersions.version1.versionNumber}`}>
                    <div className="text-sm space-y-1">
                      <div>作者: {compareVersions.version1.author?.username}</div>
                      <div>时间: {new Date(compareVersions.version1.createdAt).toLocaleString()}</div>
                      <div>大小: {formatContentSize(compareVersions.version1.content)}</div>
                    </div>
                  </Card>
                  <Card size="small" title={`版本 ${compareVersions.version2.versionNumber}`}>
                    <div className="text-sm space-y-1">
                      <div>作者: {compareVersions.version2.author?.username}</div>
                      <div>时间: {new Date(compareVersions.version2.createdAt).toLocaleString()}</div>
                      <div>大小: {formatContentSize(compareVersions.version2.content)}</div>
                    </div>
                  </Card>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">版本 {compareVersions.version1.versionNumber}</h4>
                    <pre className="whitespace-pre-wrap bg-red-50 p-4 rounded text-sm border">
                      {compareVersions.version1.content}
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">版本 {compareVersions.version2.versionNumber}</h4>
                    <pre className="whitespace-pre-wrap bg-green-50 p-4 rounded text-sm border">
                      {compareVersions.version2.content}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </Modal>
        </div>
      </AppLayout>
    </AuthGuard>
  );
};

export default DocumentVersionsPage;