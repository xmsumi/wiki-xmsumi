import request from 'supertest';
import express from 'express';
import { 
  createDirectoryValidation,
  updateDirectoryValidation,
  directoryIdValidation,
  moveDirectoryValidation,
  directoryQueryValidation,
  reorderDirectoriesValidation
} from '@/validators/directoryValidator';
import { validationResult } from 'express-validator';

const app = express();
app.use(express.json());

// 测试中间件
const testValidation = (validations: any[]) => {
  return [
    ...validations,
    (req: express.Request, res: express.Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      res.json({ success: true });
    }
  ];
};

// 设置测试路由
app.post('/test/create', testValidation(createDirectoryValidation));
app.put('/test/update/:id', testValidation(updateDirectoryValidation));
app.get('/test/directory/:id', testValidation(directoryIdValidation));
app.post('/test/move', testValidation(moveDirectoryValidation));
app.get('/test/query', testValidation(directoryQueryValidation));
app.post('/test/reorder', testValidation(reorderDirectoriesValidation));

describe('Directory Validator', () => {
  describe('createDirectoryValidation', () => {
    it('应该验证有效的创建目录请求', async () => {
      const validData = {
        name: '有效目录名',
        description: '目录描述',
        parent_id: 1,
        sort_order: 0
      };

      const response = await request(app)
        .post('/test/create')
        .send(validData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('应该拒绝空的目录名称', async () => {
      const invalidData = {
        name: '',
        description: '目录描述'
      };

      const response = await request(app)
        .post('/test/create')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: '目录名称不能为空'
          })
        ])
      );
    });

    it('应该拒绝过长的目录名称', async () => {
      const invalidData = {
        name: 'a'.repeat(256),
        description: '目录描述'
      };

      const response = await request(app)
        .post('/test/create')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: '目录名称长度必须在1-255个字符之间'
          })
        ])
      );
    });

    it('应该拒绝包含非法字符的目录名称', async () => {
      const invalidData = {
        name: '目录/名称',
        description: '目录描述'
      };

      const response = await request(app)
        .post('/test/create')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: '目录名称包含非法字符或为保留名称'
          })
        ])
      );
    });

    it('应该拒绝过长的目录描述', async () => {
      const invalidData = {
        name: '有效目录名',
        description: 'a'.repeat(1001)
      };

      const response = await request(app)
        .post('/test/create')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: '目录描述长度不能超过1000个字符'
          })
        ])
      );
    });

    it('应该拒绝无效的父目录ID', async () => {
      const invalidData = {
        name: '有效目录名',
        parent_id: 0
      };

      const response = await request(app)
        .post('/test/create')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: '父目录ID必须是正整数'
          })
        ])
      );
    });

    it('应该拒绝负数的排序顺序', async () => {
      const invalidData = {
        name: '有效目录名',
        sort_order: -1
      };

      const response = await request(app)
        .post('/test/create')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: '排序顺序必须是非负整数'
          })
        ])
      );
    });
  });

  describe('updateDirectoryValidation', () => {
    it('应该验证有效的更新目录请求', async () => {
      const validData = {
        name: '更新的目录名',
        description: '更新的描述',
        parent_id: 2,
        sort_order: 1
      };

      const response = await request(app)
        .put('/test/update/1')
        .send(validData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('应该拒绝无效的目录ID', async () => {
      const validData = {
        name: '更新的目录名'
      };

      const response = await request(app)
        .put('/test/update/invalid')
        .send(validData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: '目录ID必须是正整数'
          })
        ])
      );
    });

    it('应该允许部分更新', async () => {
      const validData = {
        name: '只更新名称'
      };

      const response = await request(app)
        .put('/test/update/1')
        .send(validData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('directoryIdValidation', () => {
    it('应该验证有效的目录ID', async () => {
      const response = await request(app)
        .get('/test/directory/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('应该拒绝无效的目录ID', async () => {
      const response = await request(app)
        .get('/test/directory/invalid');

      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: '目录ID必须是正整数'
          })
        ])
      );
    });

    it('应该拒绝零或负数的目录ID', async () => {
      const response = await request(app)
        .get('/test/directory/0');

      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: '目录ID必须是正整数'
          })
        ])
      );
    });
  });

  describe('moveDirectoryValidation', () => {
    it('应该验证有效的移动目录请求', async () => {
      const validData = {
        source_id: 1,
        target_parent_id: 2,
        new_sort_order: 0
      };

      const response = await request(app)
        .post('/test/move')
        .send(validData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('应该拒绝无效的源目录ID', async () => {
      const invalidData = {
        source_id: 0,
        target_parent_id: 2
      };

      const response = await request(app)
        .post('/test/move')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: '源目录ID必须是正整数'
          })
        ])
      );
    });

    it('应该允许移动到根目录', async () => {
      const validData = {
        source_id: 1
      };

      const response = await request(app)
        .post('/test/move')
        .send(validData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('directoryQueryValidation', () => {
    it('应该验证有效的查询参数', async () => {
      const response = await request(app)
        .get('/test/query')
        .query({
          parent_id: '1',
          include_children: 'true',
          include_documents: 'true',
          max_depth: '3',
          limit: '10',
          offset: '0',
          sort_by: 'name',
          sort_order: 'ASC'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('应该拒绝无效的parent_id', async () => {
      const response = await request(app)
        .get('/test/query')
        .query({ parent_id: '0' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: '父目录ID必须是正整数'
          })
        ])
      );
    });

    it('应该拒绝无效的布尔值', async () => {
      const response = await request(app)
        .get('/test/query')
        .query({ include_children: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'include_children必须是布尔值'
          })
        ])
      );
    });

    it('应该拒绝超出范围的max_depth', async () => {
      const response = await request(app)
        .get('/test/query')
        .query({ max_depth: '11' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'max_depth必须是1-10之间的整数'
          })
        ])
      );
    });

    it('应该拒绝无效的sort_by值', async () => {
      const response = await request(app)
        .get('/test/query')
        .query({ sort_by: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'sort_by必须是name、sort_order、created_at或updated_at之一'
          })
        ])
      );
    });
  });

  describe('reorderDirectoriesValidation', () => {
    it('应该验证有效的重排序请求', async () => {
      const validData = {
        parent_id: 1,
        ordered_ids: [3, 1, 2]
      };

      const response = await request(app)
        .post('/test/reorder')
        .send(validData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('应该拒绝空的ordered_ids数组', async () => {
      const invalidData = {
        ordered_ids: []
      };

      const response = await request(app)
        .post('/test/reorder')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'ordered_ids必须是非空数组'
          })
        ])
      );
    });

    it('应该拒绝包含无效ID的数组', async () => {
      const invalidData = {
        ordered_ids: [1, 0, 3]
      };

      const response = await request(app)
        .post('/test/reorder')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'ordered_ids中的每个元素都必须是正整数'
          })
        ])
      );
    });

    it('应该拒绝包含重复ID的数组', async () => {
      const invalidData = {
        ordered_ids: [1, 2, 1]
      };

      const response = await request(app)
        .post('/test/reorder')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'ordered_ids中不能有重复的ID'
          })
        ])
      );
    });

    it('应该允许根目录重排序', async () => {
      const validData = {
        ordered_ids: [2, 1, 3]
      };

      const response = await request(app)
        .post('/test/reorder')
        .send(validData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});