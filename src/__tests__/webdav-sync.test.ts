import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma
const mockWebdavConfigFindFirst = vi.fn();
const mockWebdavConfigUpdate = vi.fn();
const mockWebdavConfigCreate = vi.fn();
const mockWebdavConfigDelete = vi.fn();

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    webdavConfig: {
      findFirst: mockWebdavConfigFindFirst,
      update: mockWebdavConfigUpdate,
      create: mockWebdavConfigCreate,
      delete: mockWebdavConfigDelete,
    },
  },
}));

// Mock watcher
const mockStartWatching = vi.fn();
const mockStopWatching = vi.fn();
const mockIsWatchActive = vi.fn();

vi.mock('@/lib/sync/watcher', () => ({
  startWatching: mockStartWatching,
  stopWatching: mockStopWatching,
  isWatchActive: mockIsWatchActive,
}));

// Mock auth — avoid calling cookies() from next/headers outside request scope
vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn().mockResolvedValue({
    session: { userId: 'test-user-id', username: 'admin', role: 'admin' as const },
  }),
}));

// Mock webdav
const mockTestConnection = vi.fn();
const mockCreateWebdavClient = vi.fn();
const mockPullFromRemote = vi.fn();
const mockPushToRemote = vi.fn();

vi.mock('@/lib/sync/webdav', () => ({
  testConnection: mockTestConnection,
  createWebdavClient: mockCreateWebdavClient,
  pullFromRemote: mockPullFromRemote,
  pushToRemote: mockPushToRemote,
}));

describe('WebDAV 同步 API (/api/sync)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET 同步状态', () => {
    it('未配置时返回默认值', async () => {
      mockWebdavConfigFindFirst.mockResolvedValue(null);
      mockIsWatchActive.mockReturnValue(false);

      const { GET } = await import('@/app/api/sync/route');
      const request = new Request('http://localhost/api/sync');
      const response = await GET(request);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data.enabled).toBe(false);
      expect(body.data.watching).toBe(false);
      expect(body.data.url).toBe('');
      expect(body.data.remotePath).toBe('');
    });

    it('已配置时返回配置信息', async () => {
      mockWebdavConfigFindFirst.mockResolvedValue({
        id: '1',
        url: 'https://dav.example.com',
        remotePath: '/backup',
        enabled: true,
      });
      mockIsWatchActive.mockReturnValue(true);

      const { GET } = await import('@/app/api/sync/route');
      const request = new Request('http://localhost/api/sync');
      const response = await GET(request);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data.enabled).toBe(true);
      expect(body.data.watching).toBe(true);
      expect(body.data.url).toBe('https://dav.example.com');
      expect(body.data.remotePath).toBe('/backup');
    });
  });

  describe('POST 保存配置', () => {
    it('enabled 支持字符串 "true" 和 boolean true', async () => {
      mockWebdavConfigFindFirst.mockResolvedValue({ id: '1' });
      mockStartWatching.mockResolvedValue(true);

      const { POST } = await import('@/app/api/sync/route');

      // 测试字符串 "true"
      const request1 = new Request('http://localhost/api/sync', {
        method: 'POST',
        body: JSON.stringify({
          action: 'save',
          url: 'https://dav.example.com',
          username: 'user',
          password: 'pass',
          remotePath: '/backup',
          enabled: 'true',
        }),
      });

      const response1 = await POST(request1);
      const body1 = await response1.json();
      expect(body1.success).toBe(true);
      expect(mockWebdavConfigUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ enabled: true }),
        }),
      );

      vi.clearAllMocks();
      mockWebdavConfigFindFirst.mockResolvedValue(null);
      mockWebdavConfigCreate.mockResolvedValue({ id: '2' });

      // 测试 boolean true
      const request2 = new Request('http://localhost/api/sync', {
        method: 'POST',
        body: JSON.stringify({
          action: 'save',
          url: 'https://dav.example.com',
          username: 'user',
          password: 'pass',
          remotePath: '/backup',
          enabled: true,
        }),
      });

      const response2 = await POST(request2);
      const body2 = await response2.json();
      expect(body2.success).toBe(true);
      expect(mockWebdavConfigCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ enabled: true }),
        }),
      );
    });

    it('enabled 为 false 时不启动监听', async () => {
      mockWebdavConfigFindFirst.mockResolvedValue({ id: '1' });
      mockStopWatching.mockResolvedValue(undefined);

      const { POST } = await import('@/app/api/sync/route');
      const request = new Request('http://localhost/api/sync', {
        method: 'POST',
        body: JSON.stringify({
          action: 'save',
          url: 'https://dav.example.com',
          username: 'user',
          password: 'pass',
          remotePath: '/backup',
          enabled: false,
        }),
      });

      const response = await POST(request);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(mockStopWatching).toHaveBeenCalled();
      expect(mockStartWatching).not.toHaveBeenCalled();
    });
  });

  describe('POST 测试连接', () => {
    it('连接成功时返回成功', async () => {
      mockTestConnection.mockResolvedValue(true);

      const { POST } = await import('@/app/api/sync/route');
      const request = new Request('http://localhost/api/sync', {
        method: 'POST',
        body: JSON.stringify({
          action: 'test',
          url: 'https://dav.example.com',
          username: 'user',
          password: 'pass',
          remotePath: '/backup',
        }),
      });

      const response = await POST(request);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(mockTestConnection).toHaveBeenCalledWith(
        'https://dav.example.com',
        'user',
        'pass',
        '/backup',
      );
    });

    it('连接失败时返回失败', async () => {
      mockTestConnection.mockResolvedValue(false);

      const { POST } = await import('@/app/api/sync/route');
      const request = new Request('http://localhost/api/sync', {
        method: 'POST',
        body: JSON.stringify({
          action: 'test',
          url: 'https://dav.example.com',
          username: 'user',
          password: 'wrong',
          remotePath: '/backup',
        }),
      });

      const response = await POST(request);
      const body = await response.json();
      expect(body.success).toBe(false);
    });
  });

  describe('POST 推送文件', () => {
    it('未配置 WebDAV 时返回错误', async () => {
      mockCreateWebdavClient.mockResolvedValue(null);

      const { POST } = await import('@/app/api/sync/route');
      const request = new Request('http://localhost/api/sync', {
        method: 'POST',
        body: JSON.stringify({ action: 'push' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('NOT_CONFIGURED');
    });
  });

  describe('DELETE 删除配置', () => {
    it('删除配置时先停止监听', async () => {
      mockStopWatching.mockResolvedValue(undefined);
      mockWebdavConfigFindFirst.mockResolvedValue({ id: '1' });
      mockWebdavConfigDelete.mockResolvedValue({ id: '1' });

      const { DELETE } = await import('@/app/api/sync/route');
      const request = new Request('http://localhost/api/sync', { method: 'DELETE' });
      const response = await DELETE(request);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(mockStopWatching).toHaveBeenCalled();
      expect(mockWebdavConfigDelete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });
});
