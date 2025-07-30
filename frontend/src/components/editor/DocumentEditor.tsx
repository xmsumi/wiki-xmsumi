import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { Card, Switch, Space, Button, message, Modal, Upload } from 'antd';
import { 
  SaveOutlined, 
  EyeOutlined, 
  UploadOutlined,
  FileTextOutlined,
  EditOutlined
} from '@ant-design/icons';
import { RichTextEditor } from './RichTextEditor';
import { MarkdownEditor } from './MarkdownEditor';

export interface DocumentEditorRef {
  getContent: () => string;
  setContent: (content: string) => void;
  getMode: () => 'wysiwyg' | 'markdown';
  setMode: (mode: 'wysiwyg' | 'markdown') => void;
  focus: () => void;
}

interface DocumentEditorProps {
  value?: string;
  onChange?: (content: string) => void;
  onSave?: (content: string) => Promise<void>;
  placeholder?: string;
  height?: number;
  disabled?: boolean;
  showSaveButton?: boolean;
  showModeToggle?: boolean;
  defaultMode?: 'wysiwyg' | 'markdown';
  title?: string;
}

/**
 * 文档编辑器组件
 * 整合富文本编辑器和Markdown编辑器，支持模式切换
 */
export const DocumentEditor = forwardRef<DocumentEditorRef, DocumentEditorProps>(({
  value = '',
  onChange,
  onSave,
  placeholder = '请输入文档内容...',
  height = 500,
  disabled = false,
  showSaveButton = true,
  showModeToggle = true,
  defaultMode = 'wysiwyg',
  title
}, ref) => {
  const [content, setContent] = useState(value);
  const [mode, setMode] = useState<'wysiwyg' | 'markdown'>(defaultMode);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isFileModalVisible, setIsFileModalVisible] = useState(false);
  
  const richTextEditorRef = useRef<any>(null);
  const markdownEditorRef = useRef<any>(null);

  // 处理内容变化
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    onChange?.(newContent);
  };

  // 处理模式切换
  const handleModeChange = (newMode: 'wysiwyg' | 'markdown') => {
    setMode(newMode);
    
    // 在模式切换时，可能需要进行内容格式转换
    if (newMode === 'markdown' && mode === 'wysiwyg') {
      // TODO: 实现HTML到Markdown的转换
      console.log('切换到Markdown模式，需要转换HTML内容');
    } else if (newMode === 'wysiwyg' && mode === 'markdown') {
      // TODO: 实现Markdown到HTML的转换
      console.log('切换到富文本模式，需要转换Markdown内容');
    }
  };

  // 处理保存
  const handleSave = async () => {
    if (!onSave) return;

    try {
      setIsSaving(true);
      await onSave(content);
      message.success('保存成功');
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  // 处理文件上传
  const handleFileUpload = async (file: File) => {
    try {
      // TODO: 实现文件上传逻辑
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileContent = e.target?.result as string;
        
        // 根据文件类型处理内容
        if (file.name.endsWith('.md')) {
          setMode('markdown');
          handleContentChange(fileContent);
        } else if (file.name.endsWith('.html')) {
          setMode('wysiwyg');
          handleContentChange(fileContent);
        } else {
          // 其他文件类型作为文本处理
          handleContentChange(fileContent);
        }
        
        message.success('文件导入成功');
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('文件上传失败:', error);
      message.error('文件上传失败');
    } finally {
      setIsFileModalVisible(false);
    }
  };

  // 导出内容
  const handleExport = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `document.${mode === 'markdown' ? 'md' : 'html'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success('文档已导出');
  };

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    getContent: () => content,
    setContent: (newContent: string) => {
      setContent(newContent);
      if (mode === 'wysiwyg' && richTextEditorRef.current) {
        richTextEditorRef.current.setContent(newContent);
      }
    },
    getMode: () => mode,
    setMode: (newMode: 'wysiwyg' | 'markdown') => {
      handleModeChange(newMode);
    },
    focus: () => {
      if (mode === 'wysiwyg' && richTextEditorRef.current) {
        richTextEditorRef.current.focus();
      } else if (mode === 'markdown' && markdownEditorRef.current) {
        markdownEditorRef.current.focus();
      }
    }
  }));

  return (
    <Card
      title={title}
      extra={
        <Space>
          {/* 模式切换 */}
          {showModeToggle && (
            <Space>
              <span className="text-sm text-gray-600">编辑模式:</span>
              <Switch
                checkedChildren={<FileTextOutlined />}
                unCheckedChildren={<EditOutlined />}
                checked={mode === 'markdown'}
                onChange={(checked) => handleModeChange(checked ? 'markdown' : 'wysiwyg')}
              />
              <span className="text-sm text-gray-600">
                {mode === 'wysiwyg' ? '所见即所得' : 'Markdown'}
              </span>
            </Space>
          )}

          {/* 预览切换 (仅Markdown模式) */}
          {mode === 'markdown' && (
            <Button
              type={isPreviewMode ? 'primary' : 'default'}
              icon={<EyeOutlined />}
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              size="small"
            >
              {isPreviewMode ? '编辑' : '预览'}
            </Button>
          )}

          {/* 文件操作 */}
          <Button
            icon={<UploadOutlined />}
            onClick={() => setIsFileModalVisible(true)}
            size="small"
          >
            导入
          </Button>

          <Button
            onClick={handleExport}
            size="small"
          >
            导出
          </Button>

          {/* 保存按钮 */}
          {showSaveButton && (
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={isSaving}
              disabled={disabled}
            >
              {isSaving ? '保存中...' : '保存'}
            </Button>
          )}
        </Space>
      }
      bodyStyle={{ padding: 0 }}
    >
      {/* 编辑器内容 */}
      {mode === 'wysiwyg' ? (
        <RichTextEditor
          ref={richTextEditorRef}
          value={content}
          onChange={handleContentChange}
          placeholder={placeholder}
          height={height}
          disabled={disabled}
          showModeToggle={false}
        />
      ) : (
        <MarkdownEditor
          ref={markdownEditorRef}
          value={content}
          onChange={handleContentChange}
          placeholder={placeholder}
          height={height}
          disabled={disabled}
          showPreview={true}
          showToolbar={true}
        />
      )}

      {/* 文件导入对话框 */}
      <Modal
        title="导入文档"
        open={isFileModalVisible}
        onCancel={() => setIsFileModalVisible(false)}
        footer={null}
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-3">
              支持导入以下格式的文件：
            </p>
            <ul className="text-sm text-gray-500 list-disc list-inside space-y-1">
              <li>Markdown文件 (.md)</li>
              <li>HTML文件 (.html)</li>
              <li>纯文本文件 (.txt)</li>
            </ul>
          </div>
          
          <Upload
            accept=".md,.html,.txt"
            showUploadList={false}
            beforeUpload={(file) => {
              handleFileUpload(file);
              return false; // 阻止默认上传
            }}
          >
            <Button icon={<UploadOutlined />} block>
              选择文件
            </Button>
          </Upload>
        </div>
      </Modal>
    </Card>
  );
});

DocumentEditor.displayName = 'DocumentEditor';