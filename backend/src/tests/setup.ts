import dotenv from 'dotenv';

// 加载测试环境变量
dotenv.config({ path: '.env.test' });

// 设置测试环境
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // 测试时只显示错误日志

// 全局测试设置
beforeAll(async () => {
  // 测试前的全局设置
});

afterAll(async () => {
  // 测试后的清理工作
});

// 每个测试前的设置
beforeEach(() => {
  // 重置模拟对象等
});

afterEach(() => {
  // 清理测试数据
});