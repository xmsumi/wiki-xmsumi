import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useRef } from 'react';
import { Card, Button, Space, message, Typography } from 'antd';
import { AppLayout } from '@/components';
import { DocumentEditor, DocumentEditorRef } from '@/components/editor';

const { Title, Paragraph } = Typography;

/**
 * 编辑器演示页面
 */
const EditorDemoPage: NextPage = () => {
  const [content, setContent] = useState(`# 欢迎使用文档编辑器

这是一个功能强大的文档编辑器，支持：

## 富文本编辑模式
- **粗体文本**
- *斜体文本*
- ~~删除线文本~~
- [链接](https://example.com)
- 列表项目
- 代码块

## Markdown模式
支持完整的Markdown语法，包括：

\`\`\`javascript
// 代码高亮
function hello() {
  console.log('Hello, World!');
}
\`\`\`

> 这是一个引用块

| 表格 | 列1 | 列2 |
|------|-----|-----|
| 行1  | 数据1 | 数据2 |
| 行2  | 数据3 | 数据4 |

## 功能特性
1. 所见即所得编辑
2. Markdown语法支持
3. 实时预览
4. 文件导入导出
5. 图片上传
6. 代码高亮
7. 表格编辑
8. 全屏编辑

开始编辑您的文档吧！`);

  const editorRef = useRef<DocumentEditorRef>(null);

  // 处理内容变化
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  // 处理保存
  const handleSave = async (content: string) => {
    // 模拟保存API调用
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('保存内容:', content);
    // 这里可以调用实际的保存API
  };

  // 获取编辑器内容
  const getEditorContent = () => {
    if (editorRef.current) {
      const content = editorRef.current.getContent();
      message.info(`当前内容长度: ${content.length} 字符`);
      console.log('编辑器内容:', content);
    }
  };

  // 设置编辑器内容
  const setEditorContent = () => {
    if (editorRef.current) {
      const newContent = `# 新的文档标题

这是通过程序设置的新内容。

当前时间: ${new Date().toLocaleString()}`;
      
      editorRef.current.setContent(newContent);
      message.success('内容已更新');
    }
  };

  // 切换编辑模式
  const toggleEditorMode = () => {
    if (editorRef.current) {
      const currentMode = editorRef.current.getMode();
      const newMode = currentMode === 'wysiwyg' ? 'markdown' : 'wysiwyg';
      editorRef.current.setMode(newMode);
      message.info(`已切换到${newMode === 'wysiwyg' ? '富文本' : 'Markdown'}模式`);
    }
  };

  return (
    <>
      <Head>
        <title>编辑器演示 - Wiki知识库</title>
        <meta name="description" content="文档编辑器功能演示" />
      </Head>

      <AppLayout>
        <div className="max-w-6xl mx-auto p-6">
          <div className="mb-6">
            <Title level={2}>文档编辑器演示</Title>
            <Paragraph className="text-gray-600">
              体验富文本编辑器和Markdown编辑器的强大功能
            </Paragraph>
          </div>

          {/* 控制面板 */}
          <Card className="mb-6">
            <Space wrap>
              <Button onClick={getEditorContent}>
                获取内容
              </Button>
              <Button onClick={setEditorContent}>
                设置内容
              </Button>
              <Button onClick={toggleEditorMode}>
                切换模式
              </Button>
              <Button onClick={() => editorRef.current?.focus()}>
                聚焦编辑器
              </Button>
            </Space>
          </Card>

          {/* 编辑器 */}
          <DocumentEditor
            ref={editorRef}
            value={content}
            onChange={handleContentChange}
            onSave={handleSave}
            title="文档编辑器"
            height={600}
            showSaveButton={true}
            showModeToggle={true}
            defaultMode="markdown"
            placeholder="开始编写您的文档..."
          />

          {/* 内容统计 */}
          <Card className="mt-6" title="内容统计">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {content.length}
                </div>
                <div className="text-sm text-gray-600">字符数</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {content.split('\n').length}
                </div>
                <div className="text-sm text-gray-600">行数</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {content.split(/\s+/).filter(word => word.length > 0).length}
                </div>
                <div className="text-sm text-gray-600">单词数</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {Math.ceil(content.split(/\s+/).filter(word => word.length > 0).length / 200)}
                </div>
                <div className="text-sm text-gray-600">预计阅读时间(分钟)</div>
              </div>
            </div>
          </Card>
        </div>
      </AppLayout>
    </>
  );
};

export default EditorDemoPage;