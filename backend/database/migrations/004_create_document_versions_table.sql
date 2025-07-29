-- 创建文档版本表
CREATE TABLE IF NOT EXISTS document_versions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NOT NULL COMMENT '文档ID',
    version_number INT NOT NULL COMMENT '版本号',
    title VARCHAR(255) NOT NULL COMMENT '版本标题',
    content LONGTEXT NOT NULL COMMENT '版本内容',
    author_id INT NOT NULL COMMENT '修改者ID',
    change_summary TEXT NULL COMMENT '修改摘要',
    content_hash VARCHAR(64) NOT NULL COMMENT '内容哈希',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_document_id (document_id),
    INDEX idx_version_number (version_number),
    INDEX idx_author_id (author_id),
    INDEX idx_created_at (created_at),
    INDEX idx_content_hash (content_hash),
    
    UNIQUE KEY uk_document_version (document_id, version_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文档版本表';