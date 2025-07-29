-- 创建文件表
CREATE TABLE IF NOT EXISTS files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL COMMENT '存储文件名',
    original_name VARCHAR(255) NOT NULL COMMENT '原始文件名',
    file_path VARCHAR(500) NOT NULL COMMENT '文件路径',
    file_size BIGINT NOT NULL COMMENT '文件大小（字节）',
    mime_type VARCHAR(100) NOT NULL COMMENT 'MIME类型',
    file_hash VARCHAR(64) NOT NULL COMMENT '文件哈希',
    uploader_id INT NOT NULL COMMENT '上传者ID',
    document_id INT NULL COMMENT '关联文档ID',
    is_public BOOLEAN DEFAULT FALSE COMMENT '是否公开',
    download_count INT DEFAULT 0 COMMENT '下载次数',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL,
    
    INDEX idx_filename (filename),
    INDEX idx_uploader_id (uploader_id),
    INDEX idx_document_id (document_id),
    INDEX idx_mime_type (mime_type),
    INDEX idx_file_hash (file_hash),
    INDEX idx_created_at (created_at),
    INDEX idx_file_size (file_size)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文件表';