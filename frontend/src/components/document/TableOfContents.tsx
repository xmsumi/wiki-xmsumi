import React, { useState, useEffect, useMemo } from 'react';
import { Typography, Anchor } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Link } = Anchor;

interface TocItem {
  id: string;
  title: string;
  level: number;
  children?: TocItem[];
}

interface TableOfContentsProps {
  content: string;
  className?: string;
  maxLevel?: number;
  showTitle?: boolean;
}

/**
 * 文档大纲导航组件
 * 自动提取Markdown文档中的标题层级，生成可点击的目录导航
 */
const TableOfContents: React.FC<TableOfContentsProps> = ({
  content,
  className,
  maxLevel = 6,
  showTitle = true,
}) => {
  const [activeLink, setActiveLink] = useState<string>('');

  // 生成标题ID
  const generateId = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5\s-]/g, '') // 保留中文、英文、数字、空格和连字符
      .replace(/\s+/g, '-') // 空格替换为连字符
      .replace(/-+/g, '-') // 多个连字符合并为一个
      .trim();
  };

  // 构建层级结构
  const buildTocTree = (items: TocItem[]): TocItem[] => {
    const result: TocItem[] = [];
    const stack: TocItem[] = [];

    items.forEach(item => {
      // 找到合适的父级
      while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
        stack.pop();
      }

      if (stack.length === 0) {
        // 顶级项目
        result.push(item);
      } else {
        // 子项目
        const parent = stack[stack.length - 1];
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(item);
      }

      stack.push(item);
    });

    return result;
  };

  // 从Markdown内容中提取标题
  const tocItems = useMemo(() => {
    if (!content) return [];

    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const headings: TocItem[] = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      if (level <= maxLevel) {
        const title = match[2].trim();
        const id = generateId(title);
        
        headings.push({
          id,
          title,
          level,
        });
      }
    }

    return buildTocTree(headings);
  }, [content, maxLevel]);

  // 渲染目录项
  const renderTocItems = (items: TocItem[]): React.ReactNode => {
    return items.map(item => (
      <Link
        key={item.id}
        href={`#${item.id}`}
        title={
          <span 
            className={`block py-1 text-sm hover:text-blue-600 transition-colors ${
              item.level === 1 ? 'font-medium' : 
              item.level === 2 ? 'font-normal' : 'font-light'
            }`}
            style={{ 
              paddingLeft: `${(item.level - 1) * 12}px`,
              color: activeLink === `#${item.id}` ? '#1890ff' : undefined,
            }}
          >
            {item.title}
          </span>
        }
      >
        {item.children && renderTocItems(item.children)}
      </Link>
    ));
  };

  // 监听滚动事件，更新当前激活的链接
  useEffect(() => {
    const handleScroll = () => {
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      
      let currentHeading = '';
      
      headings.forEach(heading => {
        const rect = heading.getBoundingClientRect();
        if (rect.top <= 100) { // 距离顶部100px时激活
          currentHeading = `#${heading.id}`;
        }
      });
      
      if (currentHeading !== activeLink) {
        setActiveLink(currentHeading);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // 初始化

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [activeLink]);

  // 为文档内容中的标题添加ID
  useEffect(() => {
    const addIdsToHeadings = () => {
      const headings = document.querySelectorAll('.document-content h1, .document-content h2, .document-content h3, .document-content h4, .document-content h5, .document-content h6');
      
      headings.forEach(heading => {
        if (!heading.id) {
          const title = heading.textContent || '';
          heading.id = generateId(title);
        }
      });
    };

    // 延迟执行，确保DOM已渲染
    const timer = setTimeout(addIdsToHeadings, 100);
    return () => clearTimeout(timer);
  }, [content]);

  if (tocItems.length === 0) {
    return null;
  }

  return (
    <div className={`table-of-contents ${className || ''}`}>
      {showTitle && (
        <div className="flex items-center mb-4 pb-2 border-b border-gray-200">
          <FileTextOutlined className="mr-2 text-gray-600" />
          <Title level={5} className="!mb-0">
            目录
          </Title>
        </div>
      )}
      
      <Anchor
        affix={false}
        showInkInFixed={true}
        targetOffset={80}
        onChange={setActiveLink}
        className="toc-anchor"
      >
        {renderTocItems(tocItems)}
      </Anchor>
    </div>
  );
};

export default TableOfContents;