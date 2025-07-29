-- 插入默认管理员用户
-- 密码: admin123 (请在生产环境中修改)
INSERT INTO users (username, email, password_hash, role, is_active) VALUES 
('admin', 'admin@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/hL.LBHyuu', 'admin', TRUE)
ON DUPLICATE KEY UPDATE 
    password_hash = VALUES(password_hash),
    role = VALUES(role),
    is_active = VALUES(is_active);

-- 插入测试编辑者用户
-- 密码: editor123
INSERT INTO users (username, email, password_hash, role, is_active) VALUES 
('editor', 'editor@example.com', '$2b$12$8Y8.QQJ5ZQJ5ZQJ5ZQJ5ZOJ5ZQJ5ZQJ5ZQJ5ZQJ5ZQJ5ZQJ5ZQJ5Z', 'editor', TRUE)
ON DUPLICATE KEY UPDATE 
    password_hash = VALUES(password_hash),
    role = VALUES(role),
    is_active = VALUES(is_active);

-- 插入测试查看者用户
-- 密码: viewer123
INSERT INTO users (username, email, password_hash, role, is_active) VALUES 
('viewer', 'viewer@example.com', '$2b$12$9Z9.RRK6ARK6ARK6ARK6AQK6ARK6ARK6ARK6ARK6ARK6ARK6ARK6A', 'viewer', TRUE)
ON DUPLICATE KEY UPDATE 
    password_hash = VALUES(password_hash),
    role = VALUES(role),
    is_active = VALUES(is_active);