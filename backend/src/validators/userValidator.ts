import Joi from 'joi';
import { UserRole, UserStatus } from '@/types/user';

/**
 * 用户名验证规则
 */
const usernameSchema = Joi.string()
  .alphanum()
  .min(3)
  .max(30)
  .required()
  .messages({
    'string.alphanum': '用户名只能包含字母和数字',
    'string.min': '用户名长度至少3个字符',
    'string.max': '用户名长度不能超过30个字符',
    'any.required': '用户名是必填项'
  });

/**
 * 邮箱验证规则
 */
const emailSchema = Joi.string()
  .email()
  .required()
  .messages({
    'string.email': '请输入有效的邮箱地址',
    'any.required': '邮箱是必填项'
  });

/**
 * 密码验证规则
 */
const passwordSchema = Joi.string()
  .min(6)
  .max(128)
  .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
  .required()
  .messages({
    'string.min': '密码长度至少6个字符',
    'string.max': '密码长度不能超过128个字符',
    'string.pattern.base': '密码必须包含至少一个小写字母、一个大写字母和一个数字',
    'any.required': '密码是必填项'
  });

/**
 * 角色验证规则
 */
const roleSchema = Joi.string()
  .valid(...Object.values(UserRole))
  .messages({
    'any.only': '无效的用户角色'
  });

/**
 * 激活状态验证规则
 */
const isActiveSchema = Joi.boolean()
  .messages({
    'boolean.base': '激活状态必须是布尔值'
  });

/**
 * 头像URL验证规则
 */
const avatarUrlSchema = Joi.string()
  .uri()
  .allow('')
  .messages({
    'string.uri': '请输入有效的头像URL'
  });

/**
 * 创建用户验证规则
 */
export const createUserSchema = Joi.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: roleSchema.optional().default(UserRole.VIEWER),
  avatar_url: avatarUrlSchema.optional()
});

/**
 * 更新用户验证规则
 */
export const updateUserSchema = Joi.object({
  username: usernameSchema.optional(),
  email: emailSchema.optional(),
  password: passwordSchema.optional(),
  role: roleSchema.optional(),
  status: Joi.string().valid(...Object.values(UserStatus)).optional(),
  avatar_url: avatarUrlSchema.optional()
}).min(1).messages({
  'object.min': '至少需要提供一个要更新的字段'
});

/**
 * 登录验证规则
 */
export const loginSchema = Joi.object({
  username: Joi.string().required().messages({
    'any.required': '用户名是必填项'
  }),
  password: Joi.string().required().messages({
    'any.required': '密码是必填项'
  })
});

/**
 * 用户ID验证规则
 */
export const userIdSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': '用户ID必须是数字',
    'number.integer': '用户ID必须是整数',
    'number.positive': '用户ID必须是正数',
    'any.required': '用户ID是必填项'
  })
});

/**
 * 查询参数验证规则
 */
export const queryUserSchema = Joi.object({
  id: Joi.number().integer().positive(),
  username: Joi.string().alphanum().min(3).max(30),
  email: Joi.string().email(),
  role: roleSchema,
  is_active: isActiveSchema,
  limit: Joi.number().integer().min(1).max(100).default(10),
  offset: Joi.number().integer().min(0).default(0)
});

/**
 * 验证数据的通用函数
 */
export const validateData = <T>(schema: Joi.ObjectSchema, data: any): T => {
  const { error, value } = schema.validate(data, { 
    abortEarly: false,
    stripUnknown: true 
  });
  
  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join('; ');
    throw new Error(`数据验证失败: ${errorMessage}`);
  }
  
  return value as T;
};