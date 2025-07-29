import { body, param, query } from 'express-validator';
import { Directory } from '@/models/Directory';

/**
 * 创建目录验证规则
 */
export const createDirectoryValidation = [
  body('name')
    .notEmpty()
    .withMessage('目录名称不能为空')
    .isLength({ min: 1, max: 255 })
    .withMessage('目录名称长度必须在1-255个字符之间')
    .custom((value) => {
      if (!Directory.validateName(value)) {
        throw new Error('目录名称包含非法字符或为保留名称');
      }
      return true;
    }),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('目录描述长度不能超过1000个字符')
    .custom((value) => {
      if (value !== undefined && !Directory.validateDescription(value)) {
        throw new Error('目录描述格式无效');
      }
      return true;
    }),
  
  body('parent_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('父目录ID必须是正整数'),
  
  body('sort_order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('排序顺序必须是非负整数')
    .custom((value) => {
      if (value !== undefined && !Directory.validateSortOrder(value)) {
        throw new Error('排序顺序格式无效');
      }
      return true;
    })
];

/**
 * 更新目录验证规则
 */
export const updateDirectoryValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('目录ID必须是正整数'),
  
  body('name')
    .optional()
    .notEmpty()
    .withMessage('目录名称不能为空')
    .isLength({ min: 1, max: 255 })
    .withMessage('目录名称长度必须在1-255个字符之间')
    .custom((value) => {
      if (value !== undefined && !Directory.validateName(value)) {
        throw new Error('目录名称包含非法字符或为保留名称');
      }
      return true;
    }),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('目录描述长度不能超过1000个字符')
    .custom((value) => {
      if (value !== undefined && !Directory.validateDescription(value)) {
        throw new Error('目录描述格式无效');
      }
      return true;
    }),
  
  body('parent_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('父目录ID必须是正整数'),
  
  body('sort_order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('排序顺序必须是非负整数')
    .custom((value) => {
      if (value !== undefined && !Directory.validateSortOrder(value)) {
        throw new Error('排序顺序格式无效');
      }
      return true;
    })
];

/**
 * 目录ID验证规则
 */
export const directoryIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('目录ID必须是正整数')
];

/**
 * 移动目录验证规则
 */
export const moveDirectoryValidation = [
  body('source_id')
    .isInt({ min: 1 })
    .withMessage('源目录ID必须是正整数'),
  
  body('target_parent_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('目标父目录ID必须是正整数'),
  
  body('new_sort_order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('新排序顺序必须是非负整数')
];

/**
 * 目录查询验证规则
 */
export const directoryQueryValidation = [
  query('parent_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('父目录ID必须是正整数'),
  
  query('include_children')
    .optional()
    .isBoolean()
    .withMessage('include_children必须是布尔值'),
  
  query('include_documents')
    .optional()
    .isBoolean()
    .withMessage('include_documents必须是布尔值'),
  
  query('max_depth')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('max_depth必须是1-10之间的整数'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit必须是1-100之间的整数'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('offset必须是非负整数'),
  
  query('sort_by')
    .optional()
    .isIn(['name', 'sort_order', 'created_at', 'updated_at'])
    .withMessage('sort_by必须是name、sort_order、created_at或updated_at之一'),
  
  query('sort_order')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('sort_order必须是ASC或DESC')
];

/**
 * 重新排序验证规则
 */
export const reorderDirectoriesValidation = [
  body('parent_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('父目录ID必须是正整数'),
  
  body('ordered_ids')
    .isArray({ min: 1 })
    .withMessage('ordered_ids必须是非空数组')
    .custom((value) => {
      if (!Array.isArray(value)) {
        throw new Error('ordered_ids必须是数组');
      }
      
      for (const id of value) {
        if (!Number.isInteger(id) || id < 1) {
          throw new Error('ordered_ids中的每个元素都必须是正整数');
        }
      }
      
      // 检查是否有重复的ID
      const uniqueIds = new Set(value);
      if (uniqueIds.size !== value.length) {
        throw new Error('ordered_ids中不能有重复的ID');
      }
      
      return true;
    })
];