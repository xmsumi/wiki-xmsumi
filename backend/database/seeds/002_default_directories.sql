-- 插入默认目录结构
INSERT INTO directories (name, description, parent_id, path, sort_order, created_by) VALUES 
('根目录', '系统根目录', NULL, '/', 0, 1),
('技术文档', '技术相关文档', 1, '/技术文档', 1, 1),
('产品文档', '产品相关文档', 1, '/产品文档', 2, 1),
('运营文档', '运营相关文档', 1, '/运营文档', 3, 1),
('API文档', 'API接口文档', 2, '/技术文档/API文档', 1, 1),
('开发指南', '开发相关指南', 2, '/技术文档/开发指南', 2, 1),
('部署文档', '部署相关文档', 2, '/技术文档/部署文档', 3, 1),
('需求文档', '产品需求文档', 3, '/产品文档/需求文档', 1, 1),
('设计文档', '产品设计文档', 3, '/产品文档/设计文档', 2, 1),
('用户手册', '用户使用手册', 3, '/产品文档/用户手册', 3, 1)
ON DUPLICATE KEY UPDATE 
    description = VALUES(description),
    path = VALUES(path),
    sort_order = VALUES(sort_order);