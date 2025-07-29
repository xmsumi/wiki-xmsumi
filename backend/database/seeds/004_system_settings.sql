-- 插入系统默认设置
INSERT INTO system_settings (setting_key, setting_value, description, is_public) VALUES 
(
    'site_info',
    JSON_OBJECT(
        'name', 'Wiki知识库',
        'description', '专业的知识管理系统',
        'version', '1.0.0',
        'logo', '/logo.png',
        'favicon', '/favicon.ico'
    ),
    '网站基本信息',
    TRUE
),
(
    'features',
    JSON_OBJECT(
        'registration', FALSE,
        'search', TRUE,
        'comments', FALSE,
        'file_upload', TRUE,
        'version_control', TRUE
    ),
    '功能开关配置',
    FALSE
),
(
    'limits',
    JSON_OBJECT(
        'max_file_size', 10485760,
        'max_documents', 10000,
        'max_users', 1000,
        'max_upload_per_day', 100
    ),
    '系统限制配置',
    FALSE
),
(
    'search_config',
    JSON_OBJECT(
        'enabled', TRUE,
        'elasticsearch_url', 'http://localhost:9200',
        'index_name', 'wiki_documents',
        'max_results', 50
    ),
    '搜索引擎配置',
    FALSE
),
(
    'email_config',
    JSON_OBJECT(
        'enabled', FALSE,
        'smtp_host', 'smtp.example.com',
        'smtp_port', 587,
        'smtp_user', '',
        'smtp_password', '',
        'from_email', 'noreply@example.com',
        'from_name', 'Wiki知识库'
    ),
    '邮件服务配置',
    FALSE
),
(
    'security_config',
    JSON_OBJECT(
        'password_min_length', 8,
        'password_require_uppercase', TRUE,
        'password_require_lowercase', TRUE,
        'password_require_numbers', TRUE,
        'password_require_symbols', TRUE,
        'max_login_attempts', 5,
        'lockout_duration', 900,
        'session_timeout', 86400
    ),
    '安全策略配置',
    FALSE
)
ON DUPLICATE KEY UPDATE 
    setting_value = VALUES(setting_value),
    description = VALUES(description),
    updated_at = CURRENT_TIMESTAMP;