import { body, param, query } from 'express-validator';
import { DocumentStatus, DocumentContentType } from '@/types/document';

/**
 * 创建文档验证规则
 */
export const createDocumentValidation = [
  body('title')
    .notEmpty()
    .withMessage('标题不能为空')
    .isLength({ min: 1, max: 255 })
    .withMessage('标题长度必须在1-255个字符之间')
    .trim(),
  
  body('content')
    .notEmpty()
    .withMessage('内容不能为空'),
  
  body('content_type')
    .optional()
    .isIn(Object.values(DocumentContentType))
    .withMessage('内容类型无效'),
  
  body('directory_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('目录ID必须是正整数'),
  
  body('status')
    .optional()
    .isIn(Object.values(DocumentStatus))
    .withMessage('文档状态无效'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('标签必须是数组')
    .custom((tags: string[]) => {
      if (tags.some(tag => typeof tag !== 'string' || tag.trim().length === 0)) {
        throw new Error('标签不能为空字符串');
      }
      return true;
    }),
  
  body('meta_data')
    .optional()
    .isObject()
    .withMessage('元数据必须是对象')
];

/**
 * 更新文档验证规则
 */
export const updateDocumentValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('文档ID必须是正整数'),
  
  body('title')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('标题长度必须在1-255个字符之间')
    .trim(),
  
  body('content')
    .optional()
    .notEmpty()
    .withMessage('内容不能为空'),
  
  body('content_type')
    .optional()
    .isIn(Object.values(DocumentContentType))
    .withMessage('内容类型无效'),
  
  body('directory_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('目录ID必须是正整数'),
  
  body('status')
    .optional()
    .isIn(Object.values(DocumentStatus))
    .withMessage('文档状态无效'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('标签必须是数组')
    .custom((tags: string[]) => {
      if (tags.some(tag => typeof tag !== 'string' || tag.trim().length === 0)) {
        throw new Error('标签不能为空字符串');
      }
      return true;
    }),
  
  body('meta_data')
    .optional()
    .isObject()
    .withMessage('元数据必须是对象'),
  
  body('change_summary')
    .optional()
    .isString()
    .withMessage('变更摘要必须是字符串')
    .isLength({ max: 500 })
    .withMessage('变更摘要长度不能超过500个字符')
];

/**
 * 获取文档验证规则
 */
export const getDocumentValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('文档ID必须是正整数')
];

/**
 * 删除文档验证规则
 */
export const deleteDocumentValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('文档ID必须是正整数')
];

/**
 * 文档列表查询验证规则
 */
export const getDocumentsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须在1-100之间'),
  
  query('title')
    .optional()
    .isString()
    .withMessage('标题搜索必须是字符串')
    .trim(),
  
  query('directory_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('目录ID必须是正整数'),
  
  query('author_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('作者ID必须是正整数'),
  
  query('status')
    .optional()
    .isIn(Object.values(DocumentStatus))
    .withMessage('文档状态无效'),
  
  query('content_type')
    .optional()
    .isIn(Object.values(DocumentContentType))
    .withMessage('内容类型无效'),
  
  query('search')
    .optional()
    .isString()
    .withMessage('搜索关键词必须是字符串')
    .trim(),
  
  query('sort_by')
    .optional()
    .isIn(['created_at', 'updated_at', 'title'])
    .withMessage('排序字段无效'),
  
  query('sort_order')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('排序方向无效')
];

/**
 * 获取文档版本验证规则
 */
export const getDocumentVersionsValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('文档ID必须是正整数'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('每页数量必须在1-50之间')
];

/**
 * 获取特定版本验证规则
 */
export const getDocumentVersionValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('文档ID必须是正整数'),
  
  param('version')
    .isInt({ min: 1 })
    .withMessage('版本号必须是正整数')
];