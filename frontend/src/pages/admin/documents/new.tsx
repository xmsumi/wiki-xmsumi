import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useRef } from 'react';
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
  Typography,
  Row,
  Col
} from 'antd';
import { 
  SaveOutlined,
  ArrowLeftOutlined,
  TagsOutlined,
  FolderOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { AppLayout } from '@/components';
import { AuthGuard } from '@/components/auth';
import { DocumentEditor, DocumentEditorRef } from '@/components/editor';
import { 
  documentService, 
  DocumentStatus, 
  CreateDocumentRequest 
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
}

/**
 * 新建文档页面
 */
const NewDocumentPage: NextPage = () => {
  const router = useRouter();
  const [form] = Form.useForm();
  const editorRef = useRef<DocumentEditorRef>(null);
  
  const [saving, setSaving] = useState(false);
  const [availableTags] = useState<string[]>([
    '技术', '教程', '指南', 'API', '最佳实践', '故障排除', 
    '新手入门', '高级技巧', '工具使用', '项目管理'
  ]);
  const [directories] = useState<any[]>([
    { id: 1, name: '技术文档', path: '/tech' },
    { id: 2, name: '用户指南', path: '/guide' },
    { id: 3, name: 'API文档', path: '/api' },
    { id: 4, name: '常见问题', path: '/faq' }
  ]);

  // 处理表单提交
  const handleSubmit = async (values: DocumentForm) => {
    try {
      setSaving(true);
      
      // 获取编辑器内容
      const content = editorRef.current?.getContent() || values.content || '';
      const contentType = editorRef.current?.getMode() || values.contentType;

      const createData: CreateDocumentRequest = {
        title: values.title,
        content,
        contentType,
        directoryId: values.directoryId,
        status: values.status,
        tags: values.tags || [],
      };

      const newDocument = await documentService.createDocument(createData);
      
      message.success('文档创建成功');
      
      // 跳转到编辑页面
      router.push(`/admin/documents/${newDocument.id}/edit`);
    } catch (error) {
      console.error('创建文档失败:', error);
      message.error('创建文档失败');
    } finally {
      setSaving(false);
    }
  };

  // 处理编辑器保存
  const handleEditorSave = async (content: string) => {
    const values = form.getFieldsValue();
    
    // 如果标题为空，提示用户填写
    if (!values.title) {
      message.warning('请先填写文档标题');
      return;
    }

    await handleSubmit({
      ...values,
      content,
      contentType: editorRef.current?.getMode() || 'markdown'
    });
  };

  // 生成默认内容模板
  const getDefaultContent = (type: 'tutorial' | 'api' | 'guide' | 'faq') => {
    const templates = {
      tutorial: `# 教程标题

## 概述
简要描述本教程的目标和内容。

## 前置条件
- 条件1
- 条件2

## 步骤

### 步骤1：准备工作
详细描述第一步需要做什么。

### 步骤2：具体操作
详细描述具体的操作步骤。

## 总结
总结本教程的要点和注意事项。

## 相关链接
- [相关文档1](link1)
- [相关文档2](link2)
`,
      api: `# API 文档

## 接口概述
描述API的基本信息和用途。

## 请求方式
\`\`\`
POST /api/endpoint
\`\`\`

## 请求参数
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| param1 | string | 是 | 参数说明 |
| param2 | number | 否 | 参数说明 |

## 响应格式
\`\`\`json
{
  "success": true,
  "data": {
    "result": "示例数据"
  }
}
\`\`\`

## 错误码
| 错误码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 500 | 服务器错误 |

## 示例代码
\`\`\`javascript
// JavaScript 示例
fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    param1: 'value1'
  })
});
\`\`\`
`,
      guide: `# 使用指南

## 简介
简要介绍本指南的目的和适用范围。

## 快速开始

### 安装
描述安装步骤。

### 配置
描述配置方法。

### 基本使用
描述基本的使用方法。

## 高级功能

### 功能1
详细描述高级功能的使用方法。

### 功能2
详细描述另一个高级功能。

## 常见问题

### 问题1
**问题描述**
问题的具体描述。

**解决方案**
详细的解决步骤。

### 问题2
**问题描述**
另一个问题的描述。

**解决方案**
对应的解决方案。

## 更多资源
- [官方文档](link)
- [社区论坛](link)
`,
      faq: `# 常见问题

## 一般问题

### Q: 这是一个常见问题？
A: 这是对应的答案，提供详细的解释和解决方案。

### Q: 另一个常见问题？
A: 相应的答案和说明。

## 技术问题

### Q: 如何解决技术问题X？
A: 详细的技术解决方案，包括步骤和代码示例。

\`\`\`bash
# 示例命令
command --option value
\`\`\`

### Q: 遇到错误Y怎么办？
A: 错误分析和解决步骤。

## 账户问题

### Q: 如何重置密码？
A: 密码重置的详细步骤。

### Q: 如何修改个人信息？
A: 个人信息修改的操作指南。

## 联系我们
如果您的问题没有在此找到答案，请通过以下方式联系我们：
- 邮箱: support@example.com
- 电话: 400-xxx-xxxx
`
    };
    return templates[type];
  };

  // 应用模板
  const applyTemplate = (type: 'tutorial' | 'api' | 'guide' | 'faq') => {
    const content = getDefaultContent(type);
    if (editorRef.current) {
      editorRef.current.setContent(content);
    }
    
    // 设置相应的标签和目录
    const templateConfig = {
      tutorial: { tags: ['教程'], directoryId: 2 },
      api: { tags: ['API'], directoryId: 3 },
      guide: { tags: ['指南'], directoryId: 2 },
      faq: { tags: ['常见问题'], directoryId: 4 }
    };
    
    const config = templateConfig[type];
    form.setFieldsValue({
      tags: config.tags,
      directoryId: config.directoryId
    });
    
    message.success(`已应用${type}模板`);
  };

  return (
    <AuthGuard requireAuth={true} requiredRole="editor">
      <Head>
        <title>新建文档 - Wiki知识库</title>
        <meta name="description" content="创建新的Wiki文档" />
      </Head>

      <AppLayout>
        <div className="p-6">
          {/* 面包屑导航 */}
          <Breadcrumb className="mb-4">
            <Breadcrumb.Item>
              <Link href="/admin/documents">文档管理</Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>新建文档</Breadcrumb.Item>
          </Breadcrumb>

          {/* 页面标题和操作 */}
          <div className="flex justify-between items-center mb-6">
            <Title level={2}>新建文档</Title>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.back()}
            >
              返回
            </Button>
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
                      onSave={handleEditorSave}
                      height={600}
                      showSaveButton={false}
                      showModeToggle={true}
                      defaultMode="markdown"
                      placeholder="开始编写您的文档内容..."
                    />
                  </Form.Item>
                </Card>
              </Col>

              {/* 右侧：设置面板 */}
              <Col span={6}>
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  {/* 文档模板 */}
                  <Card title="文档模板" size="small">
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        size="small" 
                        onClick={() => applyTemplate('tutorial')}
                      >
                        教程
                      </Button>
                      <Button 
                        size="small" 
                        onClick={() => applyTemplate('api')}
                      >
                        API
                      </Button>
                      <Button 
                        size="small" 
                        onClick={() => applyTemplate('guide')}
                      >
                        指南
                      </Button>
                      <Button 
                        size="small" 
                        onClick={() => applyTemplate('faq')}
                      >
                        FAQ
                      </Button>
                    </div>
                  </Card>

                  {/* 发布设置 */}
                  <Card title="发布设置" size="small">
                    <Form.Item
                      name="status"
                      label="状态"
                    >
                      <Select>
                        <Option value={DocumentStatus.DRAFT}>草稿</Option>
                        <Option value={DocumentStatus.PUBLISHED}>已发布</Option>
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
                      {saving ? '创建中...' : '创建文档'}
                    </Button>
                  </Card>

                  {/* 提示信息 */}
                  <Card title="提示" size="small">
                    <div className="text-sm text-gray-600 space-y-2">
                      <p>• 文档创建后可以继续编辑</p>
                      <p>• 草稿状态的文档不会在前台显示</p>
                      <p>• 支持Markdown和富文本两种编辑模式</p>
                      <p>• 可以随时切换编辑模式</p>
                    </div>
                  </Card>
                </Space>
              </Col>
            </Row>
          </Form>
        </div>
      </AppLayout>
    </AuthGuard>
  );
};

export default NewDocumentPage;