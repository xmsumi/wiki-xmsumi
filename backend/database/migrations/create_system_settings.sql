-- 创建系统设置表
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    settings JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建唯一索引，确保只有一条设置记录
CREATE UNIQUE INDEX IF NOT EXISTS idx_system_settings_single ON system_settings ((1));

-- 插入默认设置
INSERT INTO system_settings (settings) VALUES (
    '{
        "siteName": "Wiki知识库",
        "siteDescription": "基于AI的智能知识管理系统",
        "siteUrl": "http://localhost:3000",
        "adminEmail": "admin@example.com",
        "smtpHost": "",
        "smtpPort": 587,
        "smtpUser": "",
        "smtpPassword": "",
        "smtpSecure": false,
        "searchEnabled": true,
        "searchIndexName": "wiki_documents",
        "maxFileSize": 10485760,
        "allowedFileTypes": [".pdf", ".doc", ".docx", ".txt", ".md"],
        "sessionTimeout": 86400000,
        "passwordMinLength": 8,
        "enableTwoFactor": false,
        "enableRegistration": true,
        "defaultUserRole": "viewer",
        "maintenanceMode": false
    }'::jsonb
) ON CONFLICT DO NOTHING;

-- 创建系统日志表
CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,
    level VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    source VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs (level);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs (created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_source ON system_logs (source);

-- 创建备份记录表
CREATE TABLE IF NOT EXISTS system_backups (
    id VARCHAR(100) PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(500),
    size BIGINT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'in_progress',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_system_backups_status ON system_backups (status);
CREATE INDEX IF NOT EXISTS idx_system_backups_created_at ON system_backups (created_at);