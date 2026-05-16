import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHash } from 'node:crypto';

// Mock Prisma
const mockUser = vi.fn();
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: mockUser,
    },
  },
}));

describe('登录 API (/api/auth/login)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const hashPassword = (password: string) =>
    createHash('sha256').update(password).digest('hex');

  it('应该拒绝空用户名和密码', async () => {
    const { POST } = await import('@/app/api/auth/login/route');

    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: '', password: '' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('MISSING_FIELDS');
  });

  it('应该拒绝不存在的用户', async () => {
    mockUser.mockResolvedValue(null);

    const { POST } = await import('@/app/api/auth/login/route');

    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'nonexistent', password: 'test123' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error.code).toBe('USER_NOT_FOUND');
  });

  it('应该拒绝错误密码', async () => {
    mockUser.mockResolvedValue({
      id: 'user-1',
      username: 'admin',
      passwordHash: hashPassword('correctpassword'),
      forceChangePassword: true,
    });

    const { POST } = await import('@/app/api/auth/login/route');

    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'wrongpassword' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('应该成功登录并返回用户信息', async () => {
    const userId = 'user-123';
    mockUser.mockResolvedValue({
      id: userId,
      username: 'admin',
      passwordHash: hashPassword('testpassword'),
      forceChangePassword: true,
    });

    const { POST } = await import('@/app/api/auth/login/route');

    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'testpassword' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.userId).toBe(userId);
    expect(body.data.username).toBe('admin');
    expect(body.data.forceChangePassword).toBe(true);
  });

  it('应该返回 forceChangePassword: false 当用户已修改密码时', async () => {
    mockUser.mockResolvedValue({
      id: 'user-456',
      username: 'admin',
      passwordHash: hashPassword('newpassword'),
      forceChangePassword: false,
    });

    const { POST } = await import('@/app/api/auth/login/route');

    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'newpassword' }),
    });

    const response = await POST(request);
    const body = await response.json();
    expect(body.data.forceChangePassword).toBe(false);
  });
});
