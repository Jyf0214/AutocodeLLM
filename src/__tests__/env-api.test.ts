import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma
const mockFindMany = vi.fn();
const mockFindUnique = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    environmentVariable: {
      findMany: mockFindMany,
      findUnique: mockFindUnique,
      create: mockCreate,
      update: mockUpdate,
      delete: mockDelete,
    },
  },
}));

describe('环境变量 API (/api/env)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/env', () => {
    it('应该返回所有环境变量列表', async () => {
      const mockEnvVars = [
        {
          id: 'env-1',
          key: 'API_KEY',
          value: Buffer.from('test123').map((b) => b ^ 0x5a).toString('base64'),
          description: 'API 密钥',
          enabled: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: 'env-2',
          key: 'DATABASE_URL',
          value: Buffer.from('postgres://localhost').map((b) => b ^ 0x5a).toString('base64'),
          description: '数据库连接',
          enabled: false,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
        },
      ];

      mockFindMany.mockResolvedValue(mockEnvVars);

      const { GET } = await import('@/app/api/env/route');
      const response = await GET();

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(2);
      expect(body.data[0].key).toBe('API_KEY');
      expect(body.data[1].key).toBe('DATABASE_URL');
    });

    it('应该返回空数组当没有环境变量时', async () => {
      mockFindMany.mockResolvedValue([]);

      const { GET } = await import('@/app/api/env/route');
      const response = await GET();

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual([]);
    });

    it('数据库错误时应该返回 500', async () => {
      mockFindMany.mockRejectedValue(new Error('Database error'));

      const { GET } = await import('@/app/api/env/route');
      const response = await GET();

      expect(response.status).toBe(500);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('FETCH_FAILED');
    });

    it('应该脱敏显示变量值', async () => {
      const mockEnvVars = [
        {
          id: 'env-1',
          key: 'SECRET_KEY',
          value: Buffer.from('my-secret-value').map((b) => b ^ 0x5a).toString('base64'),
          description: '',
          enabled: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];

      mockFindMany.mockResolvedValue(mockEnvVars);

      const { GET } = await import('@/app/api/env/route');
      const response = await GET();

      const body = await response.json();
      // 脱敏后应该包含星号
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      expect(body.data[0].value.includes('*')).toBe(true);
      // 长度应该大于原值的前2字符 + 至少4个星号
      expect(body.data[0].value.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('POST /api/env', () => {
    it('应该创建新的环境变量', async () => {
      const newEnvVar = {
        id: 'env-1',
        key: 'API_KEY',
        value: Buffer.from('sk-test123').map((b) => b ^ 0x5a).toString('base64'),
        description: '测试 API 密钥',
        enabled: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockFindUnique.mockResolvedValue(null);
      mockCreate.mockResolvedValue(newEnvVar);

      const { POST } = await import('@/app/api/env/route');

      const request = new Request('http://localhost/api/env', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'API_KEY',
          value: 'sk-test123',
          description: '测试 API 密钥',
          enabled: true,
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.key).toBe('API_KEY');
    });

    it('应该拒绝空 key 字段', async () => {
      const { POST } = await import('@/app/api/env/route');

      const request = new Request('http://localhost/api/env', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: '',
          value: 'some-value',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('MISSING_FIELDS');
    });

    it('应该拒绝空 value 字段', async () => {
      const { POST } = await import('@/app/api/env/route');

      const request = new Request('http://localhost/api/env', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'API_KEY',
          value: '',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('MISSING_FIELDS');
    });

    it('应该拒绝重复的变量名', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'existing-id',
        key: 'API_KEY',
        value: 'encrypted-value',
        description: '',
        enabled: true,
      });

      const { POST } = await import('@/app/api/env/route');

      const request = new Request('http://localhost/api/env', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'API_KEY',
          value: 'new-value',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(409);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('DUPLICATE_KEY');
    });

    it('应该使用默认 enabled: true', async () => {
      const newEnvVar = {
        id: 'env-1',
        key: 'API_KEY',
        value: Buffer.from('sk-test').map((b) => b ^ 0x5a).toString('base64'),
        description: '',
        enabled: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockFindUnique.mockResolvedValue(null);
      mockCreate.mockResolvedValue(newEnvVar);

      const { POST } = await import('@/app/api/env/route');

      const request = new Request('http://localhost/api/env', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'API_KEY',
          value: 'sk-test',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const body = await response.json();
      expect(body.data.enabled).toBe(true);
    });
  });

  describe('PUT /api/env', () => {
    it('应该更新环境变量配置', async () => {
      const existingEnvVar = {
        id: 'env-1',
        key: 'API_KEY',
        value: Buffer.from('sk-old').map((b) => b ^ 0x5a).toString('base64'),
        description: '旧描述',
        enabled: true,
      };

      const updatedEnvVar = {
        id: 'env-1',
        key: 'API_KEY',
        value: Buffer.from('sk-new').map((b) => b ^ 0x5a).toString('base64'),
        description: '新描述',
        enabled: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      mockFindUnique.mockResolvedValue(existingEnvVar);
      mockUpdate.mockResolvedValue(updatedEnvVar);

      const { PUT } = await import('@/app/api/env/route');

      const request = new Request('http://localhost/api/env', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'env-1',
          value: 'sk-new',
          description: '新描述',
          enabled: false,
        }),
      });

      const response = await PUT(request);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.enabled).toBe(false);
    });

    it('应该拒绝缺少 ID 的请求', async () => {
      const { PUT } = await import('@/app/api/env/route');

      const request = new Request('http://localhost/api/env', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'API_KEY',
          value: 'some-value',
        }),
      });

      const response = await PUT(request);
      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('MISSING_ID');
    });

    it('应该拒绝更新不存在的变量', async () => {
      mockFindUnique.mockResolvedValue(null);

      const { PUT } = await import('@/app/api/env/route');

      const request = new Request('http://localhost/api/env', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'non-existent-id',
          key: 'API_KEY',
        }),
      });

      const response = await PUT(request);
      expect(response.status).toBe(404);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('应该拒绝重复的变量名', async () => {
      const existingEnvVar = {
        id: 'env-1',
        key: 'API_KEY',
        value: 'encrypted-old',
        description: '',
        enabled: true,
      };

      mockFindUnique
        .mockResolvedValueOnce(existingEnvVar)
        .mockResolvedValueOnce({
          id: 'env-2',
          key: 'DATABASE_URL',
        });

      const { PUT } = await import('@/app/api/env/route');

      const request = new Request('http://localhost/api/env', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'env-1',
          key: 'DATABASE_URL',
        }),
      });

      const response = await PUT(request);
      expect(response.status).toBe(409);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('DUPLICATE_KEY');
    });

    it('应该允许保持相同名称', async () => {
      const existingEnvVar = {
        id: 'env-1',
        key: 'API_KEY',
        value: Buffer.from('sk-old').map((b) => b ^ 0x5a).toString('base64'),
        description: '',
        enabled: true,
      };

      const updatedEnvVar = {
        id: 'env-1',
        key: 'API_KEY',
        value: Buffer.from('sk-new').map((b) => b ^ 0x5a).toString('base64'),
        description: '',
        enabled: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      mockFindUnique.mockResolvedValue(existingEnvVar);
      mockUpdate.mockResolvedValue(updatedEnvVar);

      const { PUT } = await import('@/app/api/env/route');

      const request = new Request('http://localhost/api/env', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'env-1',
          value: 'sk-new',
        }),
      });

      const response = await PUT(request);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
    });
  });

  describe('DELETE /api/env', () => {
    it('应该删除环境变量', async () => {
      const existingEnvVar = {
        id: 'env-1',
        key: 'API_KEY',
        value: 'encrypted-value',
        description: '',
        enabled: true,
      };

      mockFindUnique.mockResolvedValue(existingEnvVar);
      mockDelete.mockResolvedValue(existingEnvVar);

      const { DELETE } = await import('@/app/api/env/route');

      const request = new Request('http://localhost/api/env?id=env-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('env-1');
    });

    it('应该拒绝缺少 ID 的请求', async () => {
      const { DELETE } = await import('@/app/api/env/route');

      const request = new Request('http://localhost/api/env', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('MISSING_ID');
    });

    it('应该拒绝删除不存在的变量', async () => {
      mockFindUnique.mockResolvedValue(null);

      const { DELETE } = await import('@/app/api/env/route');

      const request = new Request('http://localhost/api/env?id=non-existent', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      expect(response.status).toBe(404);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('NOT_FOUND');
    });
  });
});
