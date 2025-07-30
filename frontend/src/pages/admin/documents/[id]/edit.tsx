import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { 
  Form, 
  Input, 
  Select, 
  Button, 
  Card, 
  Space, 
  message, 
  Breadcrumb,
  Tag,
  Modal,
  Typography,
  Divider,
  Row,
  Col
} from 'antd';
import { 
  SaveOutlined,
  EyeOutlined,
  ArrowLeftOutlined,
  HistoryOutlined,
  TagsOutlined,
  FolderOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { AppLayout } from '@/components';
import { AuthGuard } from '@/components/auth';
import { DocumentEditor, DocumentEditorRef } from '@/components/editor';
import { 
  documentService, 
  Document, 
  DocumentStatus, 
  UpdateDocumentRequest 
} from '@/services/documentService';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface DocumentForm {
  title: string;
  content: string;
  contentType: 'markdown' | 'html';
  directoryId?: number;
  status: DocumentStatus;
  tags: string[];
  changeSummary?: string;
}

/**
 * 文档编辑页面
 */
const DocumentEditPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [form] = Form.useForm();
  const editorRef = useRef<DocumentEditorRef>(null);
  
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isVersionModalVisible, setIsVersionModalVisible] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [directories, setDirectories] = useState<any[]>([]);

  // 加载文档数据
  const loadDocument = async () => {
    if (!id || Array.isArray(id)) return;

    try {
      setLoading(true);
      const doc = await documentService.getDocument(parseInt(id));
      setDocument(doc);
      
      // 设置表单值
      form.setFieldsValue({
        title: doc.title,
        content: doc.content,
        contentType: doc.contentType,
        directoryId: doc.directoryId,
        status: doc.status,
        tags: doc.tags,
      });

      // 设置编辑器内容
      if (editorRef.current) {
        editorRef.current.setContent(doc.content);
        editorRef.current.setMode(doc.contentType === 'markdown' ? 'markdown' : 'wysiwyg');
      }
    } catch (error) {
      console.error('加载文档失败:', error);
      message.error('加载文档失败');
      router.push('/admin/documents');
    } finally {
      setLoading(false);
    }
  };

  // 加载目录列表
  const loadDirectories = async () => {
    try {
      // TODO: 实现目录服务
      // const dirs = await directoryService.getDirectories();
      // setDirectories(dirs);
    } catch (error) {
      console.error('加载目录失败:', error);
    }
  };

  // 加载可用标签
  const loadAvailableTags = async () => {
    try {
      // TODO: 实现标签服务
      // const tags = await tagService.getTags();
      // setAvailableTags(tags);
      setAvailableTags(['技术', '教程', '指南', 'API', '最佳实践', '故障排除']);
    } catch (error) {
      console.error('加载标签失败:', error);
    }
  };

  useEffect(() => {
    loadDocument();
    loadDirectories();
    loadAvailableTags();
  }, [id]);

  // 处理表单提交
  const handleSubmit = async (values: DocumentForm) => {
    if (!document) return;

    try {
      setSaving(true);
      
      // 获取编辑器内容
      const content = editorRef.current?.getContent() || values.content;
      const contentType = editorRef.current?.getMode() || values.contentType;

      const updateData: UpdateDocumentRequest = {
        title: values.title,
        content,
        contentType,
        directoryId: values.directoryId,
        status: values.status,
        tags: values.tags,
        changeSummary: values.changeSummary,
      };

      const updatedDoc = await documentService.updateDocument(document.id, updateData);
      setDocument(updatedDoc);
      
      message.success('文档保存成功');
      
      // 清空变更摘要
      form.setFieldValue('changeSummary', '');
    } catch (error) {
      console.error('保存文档失败:', error);
      message.error('保存文档失败');
    } finally {
      setSaving(false);
    }
  };

  // 处理编辑器保存
  const handleEditorSave = async (content: string) => {
    if (!document) return;

    const values = form.getFieldsValue();
    await handleSubmit({
      ...values,
      content,
      contentType: editorRef.current?.getMode() || 'markdown'
    });
  };

  // 预览文档
  const handlePreview = () => {
    if (document) {
      window.open(`/docs/${document.slug}`, '_blank');
    }
  };

  // 查看版本历史
  const handleViewVersions = () => {
    setIsVersionModalVisible(true);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div>加载中...</div>
        </div>
      </AppLayout>
    );
  }

  if (!document) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div>文档不存在</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AuthGuard requireAuth={true} requiredRole="editor">
      <Head>
        <title>编辑文档: {document.title} - Wiki知识库</title>
        <meta name="description" content={`编辑文档: ${document.title}`} />
      </Head>

      <AppLayout>
        <div className="p-6">
          {/* 面包屑导航 */}
          <Breadcrumb className="mb-4">
            <Breadcrumb.Item>
              <Link href="/admin/documents">文档管理</Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>编辑文档</Breadcrumb.Item>
          </Breadcrumb>

          {/* 页面标题和操作 */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <Title level={2}>编辑文档</Title>
              <div className="text-gray-600">
                最后更新: {new Date(document.updatedAt).toLocaleString()}
              </div>
            </div>
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => router.back()}
              >
                返回
              </Button>
              <Button
                icon={<EyeOutlined />}
                onClick={handlePreview}
              >
                预览
              </Button>
              <Button
                icon={<HistoryOutlined />}
                onClick={handleViewVersions}
              >
                版本历史
              </Button>
            </Space>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              status: DocumentStatus.DRAFT,
              contentType: 'markdown',
              tags: []
            }}
          >
            <Row gutter={24}>
              {/* 左侧：编辑器 */}
              <Col span={18}>
                <Card>
                  <Form.Item
                    name="title"
                    label="文档标题"
                    rules={[
                      { required: true, message: '请输入文档标题' },
                      { max: 255, message: '标题长度不能超过255个字符' }
                    ]}
                  >
                    <Input
                      placeholder="请输入文档标题"
                      size="large"
                    />
                  </Form.Item>

                  <Form.Item name="content" label="文档内容">
                    <DocumentEditor
                      ref={editorRef}
                      value={document.content}
                      onSave={handleEditorSave}
                      height={600}
                      showSaveButton={false}
                      showModeToggle={true}
                      defaultMode={document.contentType === 'markdown' ? 'markdown' : 'wysiwyg'}
                    />
                  </Form.Item>
                </Card>
              </Col>

              {/* 右侧：设置面板 */}
              <Col span={6}>
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  {/* 发布设置 */}
                  <Card title="发布设置" size="small">
                    <Form.Item
                      name="status"
                      label="状态"
                    >
                      <Select>
                        <Option value={DocumentStatus.DRAFT}>草稿</Option>
                        <Option value={DocumentStatus.PUBLISHED}>已发布</Option>
                        <Option value={DocumentStatus.ARCHIVED}>已归档</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item
                      name="directoryId"
                      label="所属目录"
                    >
                      <Select
                        placeholder="选择目录"
                        allowClear
                      >
                        {directories.map(dir => (
                          <Option key={dir.id} value={dir.id}>
                            <FolderOutlined className="mr-2" />
                            {dir.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Card>

                  {/* 标签设置 */}
                  <Card title="标签" size="small">
                    <Form.Item name="tags">
                      <Select
                        mode="tags"
                        placeholder="添加标签"
                        tokenSeparators={[',']}
                      >
                        {availableTags.map(tag => (
                          <Option key={tag} value={tag}>
                            <TagsOutlined className="mr-1" />
                            {tag}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Card>

                  {/* 变更摘要 */}
                  <Card title="变更摘要" size="small">
                    <Form.Item
                      name="changeSummary"
                      help="描述本次修改的主要内容"
                    >
                      <TextArea
                        placeholder="例如：修复了API文档中的错误，更新了示例代码"
                        rows={3}
                      />
                    </Form.Item>
                  </Card>

                  {/* 保存按钮 */}
                  <Card size="small">
                    <Button
                      type="primary"
                      htmlType="submit"
                      icon={<SaveOutlined />}
                      loading={saving}
                      block
                      size="large"
                    >
                      {saving ? '保存中...' : '保存文档'}
                    </Button>
                  </Card>

                  {/* 文档信息 */}
                  <Card title="文档信息" size="small">
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">作者:</span>
                        <span className="ml-2">{document.author?.username}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">创建时间:</span>
                        <span className="ml-2">
                          {new Date(document.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">文档ID:</span>
                        <span className="ml-2">{document.id}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Slug:</span>
                        <span className="ml-2 font-mono text-xs">{document.slug}</span>
                      </div>
                    </div>
                  </Card>
                </Space>
              </Col>
            </Row>
          </Form>

          {/* 版本历史对话框 */}
          <Modal
            title="版本历史"
            open={isVersionModalVisible}
            onCancel={() => setIsVersionModalVisible(false)}
            footer={null}
            width={800}
          >
            <div>
              {/* TODO: 实现版本历史组件 */}
              <p>版本历史功能正在开发中...</p>
            </div>
          </Modal>
        </div>
      </AppLayout>
    </AuthGuard>
  );
};

export default DocumentEditPage;