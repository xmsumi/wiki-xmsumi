import request from 'supertest';
import express from 'express';
import { validationResult } from 'express-validator';
import { 
  createDocumentValidation,
  updateDocumentValidation,
  getDocumentValidation,
  deleteDocumentValidation,
  getDocumentsValidation,
  getDocumentVersionsValidation,
  getDocumentVersionValidation
} from '@/validators/documentValidator';
import { DocumentStatus, DocumentContentType } from '@/types/document';

const app = express();
app.use(express.json());

// 验证错误处理中间件
const handleValidationErrors = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

// 测试路由
app.post('/test/create', createDocumentValidation, handleValidationErrors, (req: any, res: any) => {
  res.json({ success: true });
});

app.put('/test/update/:id', updateDocumentValidation, handleValidationErrors, (req: any, res: any) => {
  res.json({ success: true });
});

app.get('/test/get/:id', getDocumentValidation, handleValidationErrors, (req: any, res: any) => {
  res.json({ success: true });
});

app.delete('/test/delete/:id', deleteDocumentValidation, handleValidationErrors, (req: any, res: any) => {
  res.json({ success: true });
});

app.get('/test/list', getDocumentsValidation, handleValidationErrors, (req: any, res: any) => {
  res.json({ success: true });
});

app.get('/test/versions/:id', getDocumentVersionsValidation, handleValidationErrors, (req: any, res: any) => {
  res.json({ success: true });
});

app.get('/test/version/:id/:version', getDocumentVersionValidation, handleValidationErrors, (req: any, res: any) => {
  res.json({ success: true });
});

describe('Document Validator', () => {
  describe('createDocumentValidation', () => {
    it('应该接受有效的创建文档请求', async () => {
      const validData = {
        title: '测试文档',
        content: '这是测试内容',
        content_type: DocumentContentType.MARKDOWN,
        directory_id: 1,
        status: DocumentStatus.DRAFT,
        tags: ['测试', '文档'],
        meta_data: { description: '测试描述' }
      };

      const response = await request(app)
        .post('/test/create')
        .send(validData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('应该拒绝空标题', async () => {
      const invalidData = {
        title: '',
        content: '测试内容'
      };

      await request(app)
        .post('/test/create')
        .send(invalidData)
        .expect(400);
    });

    it('应该拒绝空内容', async () => {
      const invalidData = {
        title: '测试标题',
        content: ''
      };

      await request(app)
        .post('/test/create')
        .send(invalidData)
        .expect(400);
    });

    it('应该拒绝过长的标题', async () => {
      const invalidData = {
        title: 'a'.repeat(256),
        content: '测试内容'
      };

      await request(app)
        .post('/test/create')
        .send(invalidData)
        .expect(400);
    });

    it('应该拒绝无效的内容类型', async () => {
      const invalidData = {
        title: '测试标题',
        content: '测试内容',
        content_type: 'invalid_type'
      };

      await request(app)
        .post('/test/create')
        .send(invalidData)
        .expect(400);
    });

    it('应该拒绝无效的状态', async () => {
      const invalidData = {
        title: '测试标题',
        content: '测试内容',
        status: 'invalid_status'
      };

      await request(app)
        .post('/test/create')
        .send(invalidData)
        .expect(400);
    });

    it('应该拒绝非数组的标签', async () => {
      const invalidData = {
        title: '测试标题',
        content: '测试内容',
        tags: 'not_array'
      };

      await request(app)
        .post('/test/create')
        .send(invalidData)
        .expect(400);
    });

    it('应该拒绝包含空字符串的标签数组', async () => {
      const invalidData = {
        title: '测试标题',
        content: '测试内容',
        tags: ['valid_tag', '']
      };

      await request(app)
        .post('/test/create')
        .send(invalidData)
        .expect(400);
    });
  });

  describe('updateDocumentValidation', () => {
    it('应该接受有效的更新文档请求', async () => {
      const validData = {
        title: '更新后的标题',
        content: '更新后的内容',
        status: DocumentStatus.PUBLISHED,
        change_summary: '更新了标题和内容'
      };

      const response = await request(app)
        .put('/test/update/1')
        .send(validData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('应该拒绝无效的文档ID', async () => {
      await request(app)
        .put('/test/update/invalid')
        .send({ title: '测试' })
        .expect(400);
    });

    it('应该拒绝过长的变更摘要', async () => {
      const invalidData = {
        title: '测试标题',
        change_summary: 'a'.repeat(501)
      };

      await request(app)
        .put('/test/update/1')
        .send(invalidData)
        .expect(400);
    });

    it('应该接受部分字段更新', async () => {
      const partialData = {
        title: '仅更新标题'
      };

      const response = await request(app)
        .put('/test/update/1')
        .send(partialData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('getDocumentValidation', () => {
    it('应该接受有效的文档ID', async () => {
      const response = await request(app)
        .get('/test/get/1')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('应该拒绝无效的文档ID', async () => {
      await request(app)
        .get('/test/get/invalid')
        .expect(400);
    });

    it('应该拒绝负数ID', async () => {
      await request(app)
        .get('/test/get/-1')
        .expect(400);
    });
  });

  describe('getDocumentsValidation', () => {
    it('应该接受有效的查询参数', async () => {
      const response = await request(app)
        .get('/test/list')
        .query({
          page: '1',
          limit: '10',
          title: '测试',
          status: DocumentStatus.PUBLISHED,
          sort_by: 'created_at',
          sort_order: 'DESC'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('应该拒绝无效的页码', async () => {
      await request(app)
        .get('/test/list')
        .query({ page: '0' })
        .expect(400);
    });

    it('应该拒绝超出范围的limit', async () => {
      await request(app)
        .get('/test/list')
        .query({ limit: '101' })
        .expect(400);
    });

    it('应该拒绝无效的排序字段', async () => {
      await request(app)
        .get('/test/list')
        .query({ sort_by: 'invalid_field' })
        .expect(400);
    });

    it('应该拒绝无效的排序方向', async () => {
      await request(app)
        .get('/test/list')
        .query({ sort_order: 'INVALID' })
        .expect(400);
    });
  });

  describe('getDocumentVersionsValidation', () => {
    it('应该接受有效的版本查询参数', async () => {
      const response = await request(app)
        .get('/test/versions/1')
        .query({
          page: '1',
          limit: '10'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('应该拒绝无效的文档ID', async () => {
      await request(app)
        .get('/test/versions/invalid')
        .expect(400);
    });

    it('应该拒绝超出范围的版本limit', async () => {
      await request(app)
        .get('/test/versions/1')
        .query({ limit: '51' })
        .expect(400);
    });
  });

  describe('getDocumentVersionValidation', () => {
    it('应该接受有效的文档ID和版本号', async () => {
      const response = await request(app)
        .get('/test/version/1/2')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('应该拒绝无效的文档ID', async () => {
      await request(app)
        .get('/test/version/invalid/1')
        .expect(400);
    });

    it('应该拒绝无效的版本号', async () => {
      await request(app)
        .get('/test/version/1/invalid')
        .expect(400);
    });

    it('应该拒绝负数版本号', async () => {
      await request(app)
        .get('/test/version/1/-1')
        .expect(400);
    });
  });
});