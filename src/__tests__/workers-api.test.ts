import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma
const mockFindMany = vi.fn();
const mockFindUnique = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    worker: {
      findMany: mockFindMany,
      findUnique: mockFindUnique,
      create: mockCreate,
      update: mockUpdate,
      delete: mockDelete,
    },
  },
}));

describe('工作节点 API (/api/workers)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/workers', () => {
    it('应该返回所有工作节点列表', async () => {
      const mockWorkers = [
        {
          id: 'worker-1',
          name: 'compute-node-1',
          type: 'compute',
          status: 'online',
          url: 'http://192.168.1.100:8080',
          lastHeartbeat: new Date('2024-01-01'),
          metadata: { gpu: 'A100' },
          enabled: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: 'worker-2',
          name: 'storage-node-1',
          type: 'storage',
          status: 'offline',
          url: 'http://192.168.1.101:8080',
          lastHeartbeat: null,
          metadata: null,
          enabled: false,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
        },
      ];

      mockFindMany.mockResolvedValue(mockWorkers);

      const { GET } = await import('@/app/api/workers/route');
      const response = await GET();

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(2);
      expect(body.data[0].name).toBe('compute-node-1');
      expect(body.data[0].status).toBe('online');
      expect(body.data[1].name).toBe('storage-node-1');
    });

    it('应该返回空数组当没有节点时', async () => {
      mockFindMany.mockResolvedValue([]);

      const { GET } = await import('@/app/api/workers/route');
      const response = await GET();

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual([]);
    });

    it('数据库错误时应该返回 500', async () => {
      mockFindMany.mockRejectedValue(new Error('Database error'));

      const { GET } = await import('@/app/api/workers/route');
      const response = await GET();

      expect(response.status).toBe(500);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('FETCH_FAILED');
    });
  });

  describe('POST /api/workers', () => {
    it('应该创建新的工作节点', async () => {
      const newWorker = {
        id: 'worker-1',
        name: 'compute-node-1',
        type: 'compute',
        status: 'offline',
        url: 'http://192.168.1.100:8080',
        metadata: { gpu: 'A100' },
        enabled: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockFindUnique.mockResolvedValue(null);
      mockCreate.mockResolvedValue(newWorker);

      const { POST } = await import('@/app/api/workers/route');

      const request = new Request('http://localhost/api/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'compute-node-1',
          type: 'compute',
          url: 'http://192.168.1.100:8080',
          metadata: { gpu: 'A100' },
          enabled: true,
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('compute-node-1');
      expect(body.data.type).toBe('compute');
      expect(body.data.status).toBe('offline');
    });

    it('应该拒绝缺少必填字段的请求', async () => {
      const { POST } = await import('@/app/api/workers/route');

      const request = new Request('http://localhost/api/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'test-worker',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('MISSING_FIELDS');
    });

    it('应该拒绝无效的节点类型', async () => {
      const { POST } = await import('@/app/api/workers/route');

      const request = new Request('http://localhost/api/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'test-worker',
          type: 'invalid-type',
          url: 'http://192.168.1.100:8080',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_TYPE');
    });

    it('应该拒绝重复的节点名称', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'existing-worker',
        name: 'compute-node-1',
        type: 'compute',
        status: 'online',
        url: 'http://192.168.1.100:8080',
        enabled: true,
      });

      const { POST } = await import('@/app/api/workers/route');

      const request = new Request('http://localhost/api/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'compute-node-1',
          type: 'compute',
          url: 'http://192.168.1.101:8080',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(409);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('DUPLICATE_NAME');
    });

    it('应该使用默认 enabled: true', async () => {
      const newWorker = {
        id: 'worker-1',
        name: 'compute-node-1',
        type: 'compute',
        status: 'offline',
        url: 'http://192.168.1.100:8080',
        metadata: null,
        enabled: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockFindUnique.mockResolvedValue(null);
      mockCreate.mockResolvedValue(newWorker);

      const { POST } = await import('@/app/api/workers/route');

      const request = new Request('http://localhost/api/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'compute-node-1',
          type: 'compute',
          url: 'http://192.168.1.100:8080',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const body = await response.json();
      expect(body.data.enabled).toBe(true);
    });

    it('应该使用默认 status: offline', async () => {
      const newWorker = {
        id: 'worker-1',
        name: 'compute-node-1',
        type: 'compute',
        status: 'offline',
        url: 'http://192.168.1.100:8080',
        metadata: null,
        enabled: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockFindUnique.mockResolvedValue(null);
      mockCreate.mockResolvedValue(newWorker);

      const { POST } = await import('@/app/api/workers/route');

      const request = new Request('http://localhost/api/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'compute-node-1',
          type: 'compute',
          url: 'http://192.168.1.100:8080',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const body = await response.json();
      expect(body.data.status).toBe('offline');
    });
  });

  describe('PUT /api/workers', () => {
    it('应该更新工作节点配置', async () => {
      const existingWorker = {
        id: 'worker-1',
        name: 'compute-node-1',
        type: 'compute',
        status: 'offline',
        url: 'http://192.168.1.100:8080',
        metadata: null,
        enabled: true,
      };

      const updatedWorker = {
        id: 'worker-1',
        name: 'compute-node-1',
        type: 'compute',
        status: 'online',
        url: 'http://192.168.1.100:8080',
        metadata: { gpu: 'A100' },
        enabled: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      mockFindUnique.mockResolvedValue(existingWorker);
      mockUpdate.mockResolvedValue(updatedWorker);

      const { PUT } = await import('@/app/api/workers/route');

      const request = new Request('http://localhost/api/workers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'worker-1',
          status: 'online',
          metadata: { gpu: 'A100' },
        }),
      });

      const response = await PUT(request);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.status).toBe('online');
      expect(body.data.metadata).toEqual({ gpu: 'A100' });
    });

    it('应该拒绝缺少 ID 的请求', async () => {
      const { PUT } = await import('@/app/api/workers/route');

      const request = new Request('http://localhost/api/workers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'compute-node-1',
        }),
      });

      const response = await PUT(request);
      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('MISSING_ID');
    });

    it('应该拒绝无效的节点类型', async () => {
      const existingWorker = {
        id: 'worker-1',
        name: 'compute-node-1',
        type: 'compute',
        status: 'offline',
        url: 'http://192.168.1.100:8080',
        enabled: true,
      };

      mockFindUnique.mockResolvedValue(existingWorker);

      const { PUT } = await import('@/app/api/workers/route');

      const request = new Request('http://localhost/api/workers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'worker-1',
          type: 'invalid-type',
        }),
      });

      const response = await PUT(request);
      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_TYPE');
    });

    it('应该拒绝无效的状态', async () => {
      const existingWorker = {
        id: 'worker-1',
        name: 'compute-node-1',
        type: 'compute',
        status: 'offline',
        url: 'http://192.168.1.100:8080',
        enabled: true,
      };

      mockFindUnique.mockResolvedValue(existingWorker);

      const { PUT } = await import('@/app/api/workers/route');

      const request = new Request('http://localhost/api/workers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'worker-1',
          status: 'invalid-status',
        }),
      });

      const response = await PUT(request);
      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_STATUS');
    });

    it('应该拒绝不存在的节点', async () => {
      mockFindUnique.mockResolvedValue(null);

      const { PUT } = await import('@/app/api/workers/route');

      const request = new Request('http://localhost/api/workers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'non-existent-id',
          name: 'compute-node-1',
        }),
      });

      const response = await PUT(request);
      expect(response.status).toBe(404);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('应该拒绝重复的节点名称', async () => {
      const existingWorker = {
        id: 'worker-1',
        name: 'compute-node-1',
        type: 'compute',
        status: 'offline',
        url: 'http://192.168.1.100:8080',
        enabled: true,
      };

      mockFindUnique
        .mockResolvedValueOnce(existingWorker)
        .mockResolvedValueOnce({
          id: 'worker-2',
          name: 'compute-node-2',
        });

      const { PUT } = await import('@/app/api/workers/route');

      const request = new Request('http://localhost/api/workers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'worker-1',
          name: 'compute-node-2',
        }),
      });

      const response = await PUT(request);
      expect(response.status).toBe(409);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('DUPLICATE_NAME');
    });

    it('应该允许保持相同名称', async () => {
      const existingWorker = {
        id: 'worker-1',
        name: 'compute-node-1',
        type: 'compute',
        status: 'offline',
        url: 'http://192.168.1.100:8080',
        enabled: true,
      };

      const updatedWorker = {
        id: 'worker-1',
        name: 'compute-node-1',
        type: 'compute',
        status: 'online',
        url: 'http://192.168.1.100:8080',
        metadata: null,
        enabled: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      mockFindUnique.mockResolvedValue(existingWorker);
      mockUpdate.mockResolvedValue(updatedWorker);

      const { PUT } = await import('@/app/api/workers/route');

      const request = new Request('http://localhost/api/workers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'worker-1',
          status: 'online',
        }),
      });

      const response = await PUT(request);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
    });
  });

  describe('DELETE /api/workers', () => {
    it('应该删除工作节点', async () => {
      const existingWorker = {
        id: 'worker-1',
        name: 'compute-node-1',
        type: 'compute',
        status: 'offline',
        url: 'http://192.168.1.100:8080',
        enabled: true,
      };

      mockFindUnique.mockResolvedValue(existingWorker);
      mockDelete.mockResolvedValue(existingWorker);

      const { DELETE } = await import('@/app/api/workers/route');

      const request = new Request('http://localhost/api/workers?id=worker-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('worker-1');
    });

    it('应该拒绝缺少 ID 的请求', async () => {
      const { DELETE } = await import('@/app/api/workers/route');

      const request = new Request('http://localhost/api/workers', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('MISSING_ID');
    });

    it('应该拒绝删除不存在的节点', async () => {
      mockFindUnique.mockResolvedValue(null);

      const { DELETE } = await import('@/app/api/workers/route');

      const request = new Request('http://localhost/api/workers?id=non-existent', {
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
