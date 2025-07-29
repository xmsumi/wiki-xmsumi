-- 创建文档表
CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL COMMENT '文档标题',
    slug VARCHAR(255) UNIQUE NOT NULL COMMENT '文档别名',
    content LONGTEXT NOT NULL COMMENT '文档内容',
    content_type ENUM('markdown', 'html') DEFAULT 'markdown' COMMENT '内容类型',
    directory_id INT NULL COMMENT '所属目录ID',
    author_id INT NOT NULL COMMENT '作者ID',
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft' COMMENT '文档状态',
    tags JSON NULL COMMENT '标签列表',
    meta_data JSON NULL COMMENT '元数据',
    view_count INT DEFAULT 0 COMMENT '查看次数',
    is_featured BOOLEAN DEFAULT FALSE COMMENT '是否精选',
    published_at TIMESTAMP NULL COMMENT '发布时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    FOREIGN KEY (directory_id) REFERENCES directories(id) ON DELETE SET NULL,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_slug (slug),
    INDEX idx_directory_id (directory_id),
    INDEX idx_author_id (author_id),
    INDEX idx_status (status),
    INDEX idx_published_at (published_at),
    INDEX idx_created_at (created_at),
    INDEX idx_view_count (view_count),
    
    FULLTEXT KEY ft_title_content (title, content)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文档表';