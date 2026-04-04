import { describe, it, expect } from 'vitest';
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  handlePrismaError,
} from '@/lib/api/db-response';

describe('db-response 工具函数', () => {
  describe('successResponse', () => {
    it('应该返回默认状态码 200 的成功响应', () => {
      const data = { id: 1, name: 'test' };
      const response = successResponse(data);

      expect(response.status).toBe(200);
    });

    it('应该包含 success: true 和 data 字段', async () => {
      const data = { key: 'value' };
      const response = successResponse(data);
      const body = await response.json();

      expect(body).toEqual({
        success: true,
        data: { key: 'value' },
      });
    });

    it('应该支持自定义状态码', () => {
      const response = successResponse({ created: true }, 201);
      expect(response.status).toBe(201);
    });
  });

  describe('errorResponse', () => {
    it('应该返回默认状态码 400 的错误响应', () => {
      const response = errorResponse('测试错误');
      expect(response.status).toBe(400);
    });

    it('应该包含 success: false 和 error 字段', async () => {
      const response = errorResponse('字段不能为空', 422, 'MISSING_FIELD');
      const body = await response.json();

      expect(body).toEqual({
        success: false,
        error: {
          message: '字段不能为空',
          code: 'MISSING_FIELD',
        },
      });
    });

    it('未提供 code 时应该使用 UNKNOWN_ERROR', async () => {
      const response = errorResponse('未知错误');
      const body = await response.json();

      expect(body.error.code).toBe('UNKNOWN_ERROR');
    });
  });

  describe('paginatedResponse', () => {
    it('应该正确计算总页数', async () => {
      const response = paginatedResponse([1, 2, 3], 10, 1, 3);
      const body = await response.json();

      expect(body.pagination).toEqual({
        total: 10,
        page: 1,
        limit: 3,
        totalPages: 4,
      });
    });

    it('应该处理向上取整的总页数', async () => {
      const response = paginatedResponse([], 10, 2, 4);
      const body = await response.json();

      expect(body.pagination.totalPages).toBe(3);
    });

    it('应该处理空数据集', async () => {
      const response = paginatedResponse([], 0, 1, 10);
      const body = await response.json();

      expect(body.pagination.totalPages).toBe(0);
      expect(body.data).toEqual([]);
    });
  });

  describe('handlePrismaError', () => {
    const testCases = [
      { code: 'P2002', expectedStatus: 409, expectedCode: 'UNIQUE_CONSTRAINT' },
      { code: 'P2025', expectedStatus: 404, expectedCode: 'NOT_FOUND' },
      { code: 'P1001', expectedStatus: 503, expectedCode: 'DB_CONNECTION' },
      { code: 'P1002', expectedStatus: 503, expectedCode: 'DB_CONNECTION' },
      { code: 'P2014', expectedStatus: 400, expectedCode: 'RELATION_ERROR' },
    ];

    it.each(testCases)(
      '应该处理 Prisma 错误码 $code',
      async ({ code, expectedStatus, expectedCode }) => {
        const error = new Error(`Error code: ${code}`);
        const response = handlePrismaError(error);

        expect(response.status).toBe(expectedStatus);
        const body = await response.json();
        expect(body.error.code).toBe(expectedCode);
        expect(body.success).toBe(false);
      },
    );

    it('应该处理未知错误并返回 500', async () => {
      const error = new Error('Some unknown error');
      const response = handlePrismaError(error);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error.code).toBe('DB_ERROR');
    });

    it('应该处理非 Error 对象', async () => {
      const response = handlePrismaError('string error');
      expect(response.status).toBe(500);
    });
  });
});
