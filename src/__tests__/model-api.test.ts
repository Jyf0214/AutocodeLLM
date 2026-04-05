import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma
const mockFindMany = vi.fn();
const mockFindUnique = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    provider: {
      findMany: mockFindMany,
      findUnique: mockFindUnique,
      create: mockCreate,
      update: mockUpdate,
      delete: mockDelete,
    },
  },
}));

describe('模型管理 API (/api/models)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/models', () => {
    it('应该返回所有模型配置列表', async () => {
      const mockProviders = [
        {
          id: 'provider-1',
          name: 'gpt-4',
          baseUrl: 'https://api.openai.com/v1',
          apiKey: 'sk-test123',
          enabled: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: 'provider-2',
          name: 'claude-3',
          baseUrl: 'https://api.anthropic.com',
          apiKey: 'sk-anthropic',
          enabled: false,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
        },
      ];

      mockFindMany.mockResolvedValue(mockProviders);

      const { GET } = await import('@/app/api/models/route');
      const response = await GET();

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(2);
      expect(body.data[0].name).toBe('gpt-4');
      expect(body.data[1].name).toBe('claude-3');
    });

    it('应该返回空数组当没有模型时', async () => {
      mockFindMany.mockResolvedValue([]);

      const { GET } = await import('@/app/api/models/route');
      const response = await GET();

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual([]);
    });

    it('数据库错误时应该返回 500', async () => {
      mockFindMany.mockRejectedValue(new Error('Database error'));

      const { GET } = await import('@/app/api/models/route');
      const response = await GET();

      expect(response.status).toBe(500);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('FETCH_FAILED');
    });
  });

  describe('POST /api/models', () => {
    it('应该创建新的模型配置', async () => {
      const newProvider = {
        id: 'provider-1',
        name: 'gpt-4',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-test123',
        enabled: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockFindUnique.mockResolvedValue(null);
      mockCreate.mockResolvedValue(newProvider);

      const { POST } = await import('@/app/api/models/route');

      const request = new Request('http://localhost/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'gpt-4',
          provider: 'OpenAI',
          apiKey: 'sk-test123',
          baseUrl: 'https://api.openai.com/v1',
          enabled: true,
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('gpt-4');
    });

    it('应该拒绝空字段', async () => {
      const { POST } = await import('@/app/api/models/route');

      const request = new Request('http://localhost/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '',
          provider: '',
          apiKey: '',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('MISSING_FIELDS');
    });

    it('应该拒绝重复的模型名称', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'existing-id',
        name: 'gpt-4',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-existing',
        enabled: true,
      });

      const { POST } = await import('@/app/api/models/route');

      const request = new Request('http://localhost/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'gpt-4',
          provider: 'OpenAI',
          apiKey: 'sk-test123',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(409);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('DUPLICATE_NAME');
    });

    it('应该使用默认 enabled: true', async () => {
      const newProvider = {
        id: 'provider-1',
        name: 'gpt-4',
        baseUrl: '',
        apiKey: 'sk-test123',
        enabled: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockFindUnique.mockResolvedValue(null);
      mockCreate.mockResolvedValue(newProvider);

      const { POST } = await import('@/app/api/models/route');

      const request = new Request('http://localhost/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'gpt-4',
          provider: 'OpenAI',
          apiKey: 'sk-test123',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const body = await response.json();
      expect(body.data.enabled).toBe(true);
    });
  });

  describe('PUT /api/models', () => {
    it('应该更新模型配置', async () => {
      const existingProvider = {
        id: 'provider-1',
        name: 'gpt-4',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-old',
        enabled: true,
      };

      const updatedProvider = {
        id: 'provider-1',
        name: 'gpt-4-turbo',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-new',
        enabled: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      mockFindUnique.mockResolvedValue(existingProvider);
      mockUpdate.mockResolvedValue(updatedProvider);

      const { PUT } = await import('@/app/api/models/route');

      const request = new Request('http://localhost/api/models', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'provider-1',
          name: 'gpt-4-turbo',
          apiKey: 'sk-new',
        }),
      });

      const response = await PUT(request);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('gpt-4-turbo');
      expect(body.data.apiKey).toBe('sk-new');
    });

    it('应该拒绝缺少 ID 的请求', async () => {
      const { PUT } = await import('@/app/api/models/route');

      const request = new Request('http://localhost/api/models', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'gpt-4',
        }),
      });

      const response = await PUT(request);
      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('MISSING_ID');
    });

    it('应该拒绝不存在的模型', async () => {
      mockFindUnique.mockResolvedValue(null);

      const { PUT } = await import('@/app/api/models/route');

      const request = new Request('http://localhost/api/models', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'non-existent-id',
          name: 'gpt-4',
        }),
      });

      const response = await PUT(request);
      expect(response.status).toBe(404);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('应该拒绝重复的模型名称', async () => {
      const existingProvider = {
        id: 'provider-1',
        name: 'gpt-4',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-test',
        enabled: true,
      };

      mockFindUnique
        .mockResolvedValueOnce(existingProvider)
        .mockResolvedValueOnce({
          id: 'provider-2',
          name: 'claude-3',
        });

      const { PUT } = await import('@/app/api/models/route');

      const request = new Request('http://localhost/api/models', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'provider-1',
          name: 'claude-3',
        }),
      });

      const response = await PUT(request);
      expect(response.status).toBe(409);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('DUPLICATE_NAME');
    });

    it('应该允许保持相同名称', async () => {
      const existingProvider = {
        id: 'provider-1',
        name: 'gpt-4',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-old',
        enabled: true,
      };

      const updatedProvider = {
        id: 'provider-1',
        name: 'gpt-4',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-new',
        enabled: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      mockFindUnique.mockResolvedValue(existingProvider);
      mockUpdate.mockResolvedValue(updatedProvider);

      const { PUT } = await import('@/app/api/models/route');

      const request = new Request('http://localhost/api/models', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'provider-1',
          apiKey: 'sk-new',
        }),
      });

      const response = await PUT(request);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
    });
  });

  describe('DELETE /api/models', () => {
    it('应该删除模型配置', async () => {
      const existingProvider = {
        id: 'provider-1',
        name: 'gpt-4',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-test',
        enabled: true,
      };

      mockFindUnique.mockResolvedValue(existingProvider);
      mockDelete.mockResolvedValue(existingProvider);

      const { DELETE } = await import('@/app/api/models/route');

      const request = new Request('http://localhost/api/models?id=provider-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('provider-1');
    });

    it('应该拒绝缺少 ID 的请求', async () => {
      const { DELETE } = await import('@/app/api/models/route');

      const request = new Request('http://localhost/api/models', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('MISSING_ID');
    });

    it('应该拒绝删除不存在的模型', async () => {
      mockFindUnique.mockResolvedValue(null);

      const { DELETE } = await import('@/app/api/models/route');

      const request = new Request('http://localhost/api/models?id=non-existent', {
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
