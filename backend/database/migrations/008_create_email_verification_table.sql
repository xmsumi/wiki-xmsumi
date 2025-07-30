-- 创建邮件验证表
CREATE TABLE IF NOT EXISTS email_verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    email VARCHAR(255) NOT NULL COMMENT '邮箱地址',
    verification_code VARCHAR(32) NOT NULL COMMENT '验证码',
    token VARCHAR(255) NOT NULL COMMENT '验证令牌',
    expires_at TIMESTAMP NOT NULL COMMENT '过期时间',
    verified_at TIMESTAMP NULL COMMENT '验证时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_email (email),
    INDEX idx_token (token),
    INDEX idx_verification_code (verification_code),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='邮件验证表';