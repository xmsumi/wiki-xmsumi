import React, { useRef, useState, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { Button, Space, message, Upload, Modal } from 'antd';
import { 
  EyeOutlined, 
  EditOutlined, 
  UploadOutlined,
  PictureOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { apiClient } from '@/services/api';

interface RichTextEditorProps {
  value?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  height?: number;
  disabled?: boolean;
  showModeToggle?: boolean;
  mode?: 'wysiwyg' | 'markdown';
  onModeChange?: (mode: 'wysiwyg' | 'markdown') => void;
}

/**
 * 富文本编辑器组件
 * 支持TinyMCE所见即所得编辑和Markdown模式切换
 */
export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value = '',
  onChange,
  placeholder = '请输入内容...',
  height = 400,
  disabled = false,
  showModeToggle = true,
  mode = 'wysiwyg',
  onModeChange
}) => {
  const editorRef = useRef<any>(null);
  const [currentMode, setCurrentMode] = useState<'wysiwyg' | 'markdown'>(mode);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [markdownContent, setMarkdownContent] = useState(value);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);

  // 同步外部mode变化
  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  // 同步外部value变化
  useEffect(() => {
    if (currentMode === 'markdown') {
      setMarkdownContent(value);
    }
  }, [value, currentMode]);

  // TinyMCE配置
  const editorConfig = {
    height,
    menubar: false,
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'help', 'wordcount', 'codesample'
    ],
    toolbar: [
      'undo redo | blocks | bold italic forecolor backcolor | alignleft aligncenter alignright alignjustify',
      'bullist numlist outdent indent | removeformat | link image media table | codesample code preview fullscreen help'
    ].join(' | '),
    content_style: `
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        font-size: 14px;
        line-height: 1.6;
      }
      pre { 
        background-color: #f5f5f5; 
        padding: 10px; 
        border-radius: 4px; 
        overflow-x: auto; 
      }
      code { 
        background-color: #f5f5f5; 
        padding: 2px 4px; 
        border-radius: 3px; 
        font-family: 'Monaco', 'Consolas', monospace; 
      }
      blockquote { 
        border-left: 4px solid #ddd; 
        margin: 0; 
        padding-left: 16px; 
        color: #666; 
      }
      table { 
        border-collapse: collapse; 
        width: 100%; 
      }
      table td, table th { 
        border: 1px solid #ddd; 
        padding: 8px; 
      }
      table th { 
        background-color: #f2f2f2; 
        font-weight: bold; 
      }
    `,
    placeholder,
    language: 'zh_CN',
    branding: false,
    resize: false,
    statusbar: false,
    // 图片上传处理
    images_upload_handler: handleImageUpload,
    // 文件选择处理
    file_picker_callback: handleFilePicker,
    // 自动保存
    autosave_ask_before_unload: true,
    autosave_interval: '30s',
    autosave_prefix: 'tinymce-autosave-{path}{query}-{id}-',
    autosave_restore_when_empty: false,
    autosave_retention: '2m',
  };

  // 处理编辑器内容变化
  const handleEditorChange = (content: string) => {
    onChange?.(content);
  };

  // 处理Markdown内容变化
  const handleMarkdownChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setMarkdownContent(content);
    onChange?.(content);
  };

  // 切换编辑模式
  const handleModeToggle = (newMode: 'wysiwyg' | 'markdown') => {
    setCurrentMode(newMode);
    onModeChange?.(newMode);
    
    if (newMode === 'markdown' && editorRef.current) {
      // 从WYSIWYG切换到Markdown，需要转换内容
      const htmlContent = editorRef.current.getContent();
      // TODO: 实现HTML到Markdown的转换
      setMarkdownContent(htmlContent);
    } else if (newMode === 'wysiwyg' && editorRef.current) {
      // 从Markdown切换到WYSIWYG，需要转换内容
      // TODO: 实现Markdown到HTML的转换
      editorRef.current.setContent(markdownContent);
    }
  };

  // 处理图片上传
  async function handleImageUpload(blobInfo: any, progress: (percent: number) => void): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', blobInfo.blob(), blobInfo.filename());

      // 模拟上传进度
      const progressInterval = setInterval(() => {
        progress(Math.random() * 100);
      }, 100);

      // 调用上传API
      const result = await apiClient.upload('/api/files/upload', blobInfo.blob());
      
      clearInterval(progressInterval);
      progress(100);

      // 返回图片URL
      return result.url || URL.createObjectURL(blobInfo.blob());
    } catch (error) {
      console.error('图片上传失败:', error);
      message.error('图片上传失败');
      throw error;
    }
  }

  // 处理文件选择
  function handleFilePicker(callback: any, value: string, meta: any) {
    if (meta.filetype === 'image') {
      setIsImageModalVisible(true);
      // TODO: 实现图片选择对话框
    } else if (meta.filetype === 'media') {
      // TODO: 实现媒体文件选择
    } else {
      // TODO: 实现其他文件选择
    }
  }

  // 插入图片
  const handleInsertImage = (imageUrl: string, alt?: string) => {
    if (editorRef.current) {
      editorRef.current.insertContent(`<img src="${imageUrl}" alt="${alt || ''}" />`);
    }
    setIsImageModalVisible(false);
  };

  // 获取编辑器内容
  const getContent = () => {
    if (currentMode === 'wysiwyg' && editorRef.current) {
      return editorRef.current.getContent();
    }
    return markdownContent;
  };

  // 设置编辑器内容
  const setContent = (content: string) => {
    if (currentMode === 'wysiwyg' && editorRef.current) {
      editorRef.current.setContent(content);
    } else {
      setMarkdownContent(content);
    }
  };

  // 暴露方法给父组件
  React.useImperativeHandle(editorRef, () => ({
    getContent,
    setContent,
    focus: () => {
      if (currentMode === 'wysiwyg' && editorRef.current) {
        editorRef.current.focus();
      }
    }
  }));

  return (
    <div className="rich-text-editor">
      {/* 工具栏 */}
      {showModeToggle && (
        <div className="mb-4 flex justify-between items-center">
          <Space>
            <Button
              type={currentMode === 'wysiwyg' ? 'primary' : 'default'}
              icon={<EditOutlined />}
              onClick={() => handleModeToggle('wysiwyg')}
              size="small"
            >
              所见即所得
            </Button>
            <Button
              type={currentMode === 'markdown' ? 'primary' : 'default'}
              icon={<FileTextOutlined />}
              onClick={() => handleModeToggle('markdown')}
              size="small"
            >
              Markdown
            </Button>
          </Space>
          
          {currentMode === 'markdown' && (
            <Button
              type={isPreviewMode ? 'primary' : 'default'}
              icon={<EyeOutlined />}
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              size="small"
            >
              {isPreviewMode ? '编辑' : '预览'}
            </Button>
          )}
        </div>
      )}

      {/* 编辑器内容 */}
      {currentMode === 'wysiwyg' ? (
        <Editor
          onInit={(evt, editor) => editorRef.current = editor}
          value={value}
          init={editorConfig}
          onEditorChange={handleEditorChange}
          disabled={disabled}
        />
      ) : (
        <div className="markdown-editor">
          {!isPreviewMode ? (
            <textarea
              value={markdownContent}
              onChange={handleMarkdownChange}
              placeholder={placeholder}
              disabled={disabled}
              className="w-full border border-gray-300 rounded-md p-3 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ height: `${height}px` }}
            />
          ) : (
            <div 
              className="markdown-preview border border-gray-300 rounded-md p-3 bg-white overflow-auto"
              style={{ height: `${height}px` }}
            >
              {/* TODO: 实现Markdown预览 */}
              <div dangerouslySetInnerHTML={{ __html: markdownContent }} />
            </div>
          )}
        </div>
      )}

      {/* 图片插入对话框 */}
      <Modal
        title="插入图片"
        open={isImageModalVisible}
        onCancel={() => setIsImageModalVisible(false)}
        footer={null}
      >
        <div className="space-y-4">
          <Upload
            accept="image/*"
            showUploadList={false}
            beforeUpload={(file) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                const imageUrl = e.target?.result as string;
                handleInsertImage(imageUrl, file.name);
              };
              reader.readAsDataURL(file);
              return false;
            }}
          >
            <Button icon={<UploadOutlined />} block>
              上传图片
            </Button>
          </Upload>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              或输入图片URL:
            </label>
            <div className="flex space-x-2">
              <input
                type="url"
                placeholder="https://example.com/image.jpg"
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const url = (e.target as HTMLInputElement).value;
                    if (url) {
                      handleInsertImage(url);
                    }
                  }
                }}
              />
              <Button
                type="primary"
                icon={<PictureOutlined />}
                onClick={() => {
                  const input = document.querySelector('input[type="url"]') as HTMLInputElement;
                  const url = input?.value;
                  if (url) {
                    handleInsertImage(url);
                  }
                }}
              >
                插入
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};