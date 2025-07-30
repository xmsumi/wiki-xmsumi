-- 为用户表添加邮箱验证相关字段
ALTER TABLE users 
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE COMMENT '邮箱是否已验证',
ADD COLUMN email_verified_at TIMESTAMP NULL COMMENT '邮箱验证时间',
ADD INDEX idx_email_verified (email_verified);