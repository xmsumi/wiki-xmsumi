import React, { useState, useRef, useEffect } from 'react';
import { Button, Space, Divider, Tooltip, message } from 'antd';
import { 
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  StrikethroughOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  LinkOutlined,
  PictureOutlined,
  CodeOutlined,
  TableOutlined,
  EyeOutlined,
  EditOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface MarkdownEditorProps {
  value?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  height?: number;
  disabled?: boolean;
  showPreview?: boolean;
  showToolbar?: boolean;
}

/**
 * Markdown编辑器组件
 * 提供Markdown语法支持和实时预览功能
 */
export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value = '',
  onChange,
  placeholder = '请输入Markdown内容...',
  height = 400,
  disabled = false,
  showPreview = true,
  showToolbar = true
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState(value);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 同步外部value变化
  useEffect(() => {
    setContent(value);
  }, [value]);

  // 处理内容变化
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    onChange?.(newContent);
  };

  // 获取当前选中的文本
  const getSelectedText = () => {
    const textarea = textareaRef.current;
    if (!textarea) return { start: 0, end: 0, text: '' };
    
    return {
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
      text: textarea.value.substring(textarea.selectionStart, textarea.selectionEnd)
    };
  };

  // 插入文本到光标位置
  const insertText = (before: string, after: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { start, end, text } = getSelectedText();
    const selectedText = text || placeholder;
    const newText = before + selectedText + after;
    
    const newContent = content.substring(0, start) + newText + content.substring(end);
    setContent(newContent);
    onChange?.(newContent);

    // 设置新的光标位置
    setTimeout(() => {
      textarea.focus();
      const newStart = start + before.length;
      const newEnd = newStart + selectedText.length;
      textarea.setSelectionRange(newStart, newEnd);
    }, 0);
  };

  // 工具栏按钮处理函数
  const handleBold = () => insertText('**', '**', '粗体文本');
  const handleItalic = () => insertText('*', '*', '斜体文本');
  const handleStrikethrough = () => insertText('~~', '~~', '删除线文本');
  const handleCode = () => insertText('`', '`', '代码');
  const handleCodeBlock = () => insertText('\n```\n', '\n```\n', '代码块');
  
  const handleHeading = (level: number) => {
    const prefix = '#'.repeat(level) + ' ';
    insertText(prefix, '', `标题${level}`);
  };

  const handleUnorderedList = () => insertText('- ', '', '列表项');
  const handleOrderedList = () => insertText('1. ', '', '列表项');
  
  const handleLink = () => {
    const { text } = getSelectedText();
    if (text) {
      insertText('[', '](url)', '');
    } else {
      insertText('[', '](url)', '链接文本');
    }
  };

  const handleImage = () => {
    const { text } = getSelectedText();
    if (text) {
      insertText('![', '](image-url)', '');
    } else {
      insertText('![', '](image-url)', '图片描述');
    }
  };

  const handleTable = () => {
    const tableTemplate = `
| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 内容1 | 内容2 | 内容3 |
| 内容4 | 内容5 | 内容6 |
`;
    insertText(tableTemplate, '');
  };

  const handleQuote = () => insertText('> ', '', '引用文本');

  // 切换预览模式
  const togglePreview = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  // 切换全屏模式
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // 复制内容到剪贴板
  const copyToClipboard = () => {
    navigator.clipboard.writeText(content).then(() => {
      message.success('内容已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败');
    });
  };

  // 自定义Markdown渲染组件
  const markdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={tomorrow}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    table({ children }: any) {
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            {children}
          </table>
        </div>
      );
    },
    th({ children }: any) {
      return (
        <th className="border border-gray-300 px-4 py-2 bg-gray-100 font-semibold text-left">
          {children}
        </th>
      );
    },
    td({ children }: any) {
      return (
        <td className="border border-gray-300 px-4 py-2">
          {children}
        </td>
      );
    },
    blockquote({ children }: any) {
      return (
        <blockquote className="border-l-4 border-gray-300 pl-4 py-2 my-4 bg-gray-50">
          {children}
        </blockquote>
      );
    }
  };

  const editorClass = isFullscreen 
    ? 'fixed inset-0 z-50 bg-white' 
    : '';

  return (
    <div className={`markdown-editor ${editorClass}`}>
      {/* 工具栏 */}
      {showToolbar && (
        <div className="border border-gray-300 border-b-0 rounded-t-md bg-gray-50 p-2">
          <div className="flex flex-wrap items-center gap-1">
            {/* 文本格式 */}
            <Space.Compact>
              <Tooltip title="粗体 (Ctrl+B)">
                <Button size="small" icon={<BoldOutlined />} onClick={handleBold} />
              </Tooltip>
              <Tooltip title="斜体 (Ctrl+I)">
                <Button size="small" icon={<ItalicOutlined />} onClick={handleItalic} />
              </Tooltip>
              <Tooltip title="删除线">
                <Button size="small" icon={<StrikethroughOutlined />} onClick={handleStrikethrough} />
              </Tooltip>
            </Space.Compact>

            <Divider type="vertical" />

            {/* 标题 */}
            <Space.Compact>
              {[1, 2, 3, 4, 5, 6].map(level => (
                <Tooltip key={level} title={`标题${level}`}>
                  <Button 
                    size="small" 
                    onClick={() => handleHeading(level)}
                  >
                    H{level}
                  </Button>
                </Tooltip>
              ))}
            </Space.Compact>

            <Divider type="vertical" />

            {/* 列表 */}
            <Space.Compact>
              <Tooltip title="无序列表">
                <Button size="small" icon={<UnorderedListOutlined />} onClick={handleUnorderedList} />
              </Tooltip>
              <Tooltip title="有序列表">
                <Button size="small" icon={<OrderedListOutlined />} onClick={handleOrderedList} />
              </Tooltip>
            </Space.Compact>

            <Divider type="vertical" />

            {/* 插入元素 */}
            <Space.Compact>
              <Tooltip title="链接">
                <Button size="small" icon={<LinkOutlined />} onClick={handleLink} />
              </Tooltip>
              <Tooltip title="图片">
                <Button size="small" icon={<PictureOutlined />} onClick={handleImage} />
              </Tooltip>
              <Tooltip title="代码">
                <Button size="small" icon={<CodeOutlined />} onClick={handleCode} />
              </Tooltip>
              <Tooltip title="表格">
                <Button size="small" icon={<TableOutlined />} onClick={handleTable} />
              </Tooltip>
            </Space.Compact>

            <Divider type="vertical" />

            {/* 其他功能 */}
            <Space.Compact>
              <Tooltip title="引用">
                <Button size="small" onClick={handleQuote}>
                  &quot;
                </Button>
              </Tooltip>
              <Tooltip title="代码块">
                <Button size="small" onClick={handleCodeBlock}>
                  {'{}'}
                </Button>
              </Tooltip>
            </Space.Compact>

            <div className="flex-1" />

            {/* 右侧按钮 */}
            <Space.Compact>
              {showPreview && (
                <Tooltip title={isPreviewMode ? '编辑模式' : '预览模式'}>
                  <Button 
                    size="small" 
                    type={isPreviewMode ? 'primary' : 'default'}
                    icon={isPreviewMode ? <EditOutlined /> : <EyeOutlined />} 
                    onClick={togglePreview} 
                  />
                </Tooltip>
              )}
              <Tooltip title={isFullscreen ? '退出全屏' : '全屏'}>
                <Button 
                  size="small" 
                  icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />} 
                  onClick={toggleFullscreen} 
                />
              </Tooltip>
            </Space.Compact>
          </div>
        </div>
      )}

      {/* 编辑器内容区域 */}
      <div className="flex" style={{ height: isFullscreen ? 'calc(100vh - 60px)' : height }}>
        {/* 编辑区域 */}
        {(!isPreviewMode || !showPreview) && (
          <div className={showPreview && !isPreviewMode ? 'w-1/2' : 'w-full'}>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              placeholder={placeholder}
              disabled={disabled}
              className="w-full h-full border border-gray-300 rounded-none rounded-bl-md p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ 
                borderTop: showToolbar ? 'none' : undefined,
                borderRadius: showToolbar ? '0 0 0 6px' : '6px'
              }}
            />
          </div>
        )}

        {/* 预览区域 */}
        {showPreview && (isPreviewMode || !isPreviewMode) && (
          <div className={isPreviewMode ? 'w-full' : 'w-1/2 border-l border-gray-300'}>
            <div className="h-full overflow-auto p-4 bg-white prose prose-sm max-w-none">
              <ReactMarkdown components={markdownComponents}>
                {content || '暂无内容...'}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      {/* 状态栏 */}
      <div className="border border-gray-300 border-t-0 rounded-b-md bg-gray-50 px-3 py-1 text-xs text-gray-600 flex justify-between items-center">
        <div>
          字符数: {content.length} | 行数: {content.split('\n').length}
        </div>
        <div className="space-x-2">
          <Button type="link" size="small" onClick={copyToClipboard}>
            复制内容
          </Button>
          <span>Markdown</span>
        </div>
      </div>
    </div>
  );
};