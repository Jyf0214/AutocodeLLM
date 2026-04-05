import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma
const mockFindMany = vi.fn();
const mockFindUnique = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    agentTask: {
      findMany: mockFindMany,
      findUnique: mockFindUnique,
      create: mockCreate,
      update: mockUpdate,
      delete: mockDelete,
    },
  },
}));

describe('任务代理 API (/api/agents)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/agents', () => {
    it('应该返回所有任务代理列表', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          name: '代码重构代理',
          description: '自动重构代码',
          mode: 'read_only',
          status: 'ready',
          maxAgents: 5,
          progress: 0,
          logs: null,
          result: null,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: 'task-2',
          name: '文档生成代理',
          description: '自动生成文档',
          mode: 'yolo',
          status: 'running',
          maxAgents: 3,
          progress: 50,
          logs: JSON.stringify([{ timestamp: '2024-01-01', message: '开始执行' }]),
          result: null,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
        },
      ];

      mockFindMany.mockResolvedValue(mockTasks);

      const { GET } = await import('@/app/api/agents/route');
      const response = await GET();

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(2);
      expect(body.data[0].name).toBe('代码重构代理');
      expect(body.data[0].status).toBe('ready');
      expect(body.data[1].name).toBe('文档生成代理');
      expect(body.data[1].logs).toEqual([{ timestamp: '2024-01-01', message: '开始执行' }]);
    });

    it('应该返回空数组当没有任务时', async () => {
      mockFindMany.mockResolvedValue([]);

      const { GET } = await import('@/app/api/agents/route');
      const response = await GET();

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual([]);
    });

    it('数据库错误时应该返回 500', async () => {
      mockFindMany.mockRejectedValue(new Error('Database error'));

      const { GET } = await import('@/app/api/agents/route');
      const response = await GET();

      expect(response.status).toBe(500);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('FETCH_FAILED');
    });
  });

  describe('POST /api/agents', () => {
    it('应该创建新的任务代理', async () => {
      const newTask = {
        id: 'task-1',
        name: '代码重构代理',
        description: '自动重构代码',
        mode: 'read_only',
        status: 'ready',
        maxAgents: 5,
        progress: 0,
        logs: null,
        result: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockCreate.mockResolvedValue(newTask);

      const { POST } = await import('@/app/api/agents/route');

      const request = new Request('http://localhost/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '代码重构代理',
          description: '自动重构代码',
          mode: 'read_only',
          maxAgents: 5,
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('代码重构代理');
      expect(body.data.mode).toBe('read_only');
      expect(body.data.status).toBe('ready');
    });

    it('应该拒绝缺少必填字段的请求', async () => {
      const { POST } = await import('@/app/api/agents/route');

      const request = new Request('http://localhost/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: '测试描述',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('MISSING_FIELDS');
    });

    it('应该拒绝缺少 mode 字段的请求', async () => {
      const { POST } = await import('@/app/api/agents/route');

      const request = new Request('http://localhost/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '测试代理',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('MISSING_FIELDS');
    });

    it('应该拒绝无效的执行模式', async () => {
      const { POST } = await import('@/app/api/agents/route');

      const request = new Request('http://localhost/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '测试代理',
          mode: 'invalid-mode',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_MODE');
    });

    it('应该使用默认 maxAgents: 5', async () => {
      const newTask = {
        id: 'task-1',
        name: '测试代理',
        description: '',
        mode: 'yolo',
        status: 'ready',
        maxAgents: 5,
        progress: 0,
        logs: null,
        result: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockCreate.mockResolvedValue(newTask);

      const { POST } = await import('@/app/api/agents/route');

      const request = new Request('http://localhost/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '测试代理',
          mode: 'yolo',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const body = await response.json();
      expect(body.data.maxAgents).toBe(5);
    });

    it('应该使用默认 status: ready', async () => {
      const newTask = {
        id: 'task-1',
        name: '测试代理',
        description: '',
        mode: 'read_only',
        status: 'ready',
        maxAgents: 5,
        progress: 0,
        logs: null,
        result: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockCreate.mockResolvedValue(newTask);

      const { POST } = await import('@/app/api/agents/route');

      const request = new Request('http://localhost/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '测试代理',
          mode: 'read_only',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const body = await response.json();
      expect(body.data.status).toBe('ready');
    });

    it('应该使用默认 progress: 0', async () => {
      const newTask = {
        id: 'task-1',
        name: '测试代理',
        description: '',
        mode: 'read_only',
        status: 'ready',
        maxAgents: 5,
        progress: 0,
        logs: null,
        result: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockCreate.mockResolvedValue(newTask);

      const { POST } = await import('@/app/api/agents/route');

      const request = new Request('http://localhost/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '测试代理',
          mode: 'read_only',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const body = await response.json();
      expect(body.data.progress).toBe(0);
    });
  });

  describe('PUT /api/agents', () => {
    it('应该更新任务代理配置', async () => {
      const existingTask = {
        id: 'task-1',
        name: '代码重构代理',
        description: '自动重构代码',
        mode: 'read_only',
        status: 'ready',
        maxAgents: 5,
        progress: 0,
        logs: null,
        result: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const updatedTask = {
        id: 'task-1',
        name: '代码重构代理 V2',
        description: '自动重构代码（增强版）',
        mode: 'yolo',
        status: 'running',
        maxAgents: 10,
        progress: 25,
        logs: JSON.stringify([{ timestamp: '2024-01-02', message: '任务开始' }]),
        result: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      mockFindUnique.mockResolvedValue(existingTask);
      mockUpdate.mockResolvedValue(updatedTask);

      const { PUT } = await import('@/app/api/agents/route');

      const request = new Request('http://localhost/api/agents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'task-1',
          name: '代码重构代理 V2',
          description: '自动重构代码（增强版）',
          mode: 'yolo',
          status: 'running',
          maxAgents: 10,
          progress: 25,
        }),
      });

      const response = await PUT(request);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('代码重构代理 V2');
      expect(body.data.mode).toBe('yolo');
      expect(body.data.status).toBe('running');
      expect(body.data.maxAgents).toBe(10);
      expect(body.data.progress).toBe(25);
    });

    it('应该拒绝缺少 ID 的请求', async () => {
      const { PUT } = await import('@/app/api/agents/route');

      const request = new Request('http://localhost/api/agents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '代码重构代理',
        }),
      });

      const response = await PUT(request);
      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('MISSING_ID');
    });

    it('应该拒绝无效的执行模式', async () => {
      const existingTask = {
        id: 'task-1',
        name: '代码重构代理',
        description: '自动重构代码',
        mode: 'read_only',
        status: 'ready',
        maxAgents: 5,
        progress: 0,
        logs: null,
        result: null,
      };

      mockFindUnique.mockResolvedValue(existingTask);

      const { PUT } = await import('@/app/api/agents/route');

      const request = new Request('http://localhost/api/agents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'task-1',
          mode: 'invalid-mode',
        }),
      });

      const response = await PUT(request);
      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_MODE');
    });

    it('应该拒绝无效的状态', async () => {
      const existingTask = {
        id: 'task-1',
        name: '代码重构代理',
        description: '自动重构代码',
        mode: 'read_only',
        status: 'ready',
        maxAgents: 5,
        progress: 0,
        logs: null,
        result: null,
      };

      mockFindUnique.mockResolvedValue(existingTask);

      const { PUT } = await import('@/app/api/agents/route');

      const request = new Request('http://localhost/api/agents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'task-1',
          status: 'invalid-status',
        }),
      });

      const response = await PUT(request);
      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_STATUS');
    });

    it('应该拒绝不存在的任务', async () => {
      mockFindUnique.mockResolvedValue(null);

      const { PUT } = await import('@/app/api/agents/route');

      const request = new Request('http://localhost/api/agents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'non-existent-id',
          name: '代码重构代理',
        }),
      });

      const response = await PUT(request);
      expect(response.status).toBe(404);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('DELETE /api/agents', () => {
    it('应该删除任务代理', async () => {
      const existingTask = {
        id: 'task-1',
        name: '代码重构代理',
        description: '自动重构代码',
        mode: 'read_only',
        status: 'ready',
        maxAgents: 5,
        progress: 0,
        logs: null,
        result: null,
      };

      mockFindUnique.mockResolvedValue(existingTask);
      mockDelete.mockResolvedValue(existingTask);

      const { DELETE } = await import('@/app/api/agents/route');

      const request = new Request('http://localhost/api/agents?id=task-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('task-1');
    });

    it('应该拒绝缺少 ID 的请求', async () => {
      const { DELETE } = await import('@/app/api/agents/route');

      const request = new Request('http://localhost/api/agents', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('MISSING_ID');
    });

    it('应该拒绝删除不存在的任务', async () => {
      mockFindUnique.mockResolvedValue(null);

      const { DELETE } = await import('@/app/api/agents/route');

      const request = new Request('http://localhost/api/agents?id=non-existent', {
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
