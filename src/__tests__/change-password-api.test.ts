import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hashSync } from 'bcryptjs';

// Mock Prisma
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
  },
}));

// Mock auth — avoid calling cookies() from next/headers outside request scope
vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn().mockResolvedValue({
    session: { userId: 'test-user-id', username: 'admin', role: 'admin' as const },
  }),
}));

describe('修改密码 API (/api/auth/change-password)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该拒绝空字段', async () => {
    const { POST } = await import('@/app/api/auth/change-password/route');

    const request = new Request('http://localhost/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: '', newPassword: '' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error.code).toBe('MISSING_FIELDS');
  });

  it('应该拒绝少于 8 位的密码', async () => {
    const { POST } = await import('@/app/api/auth/change-password/route');

    const request = new Request('http://localhost/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'user-1', newPassword: 'short' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error.code).toBe('PASSWORD_TOO_SHORT');
  });

  it('应该拒绝不存在的用户', async () => {
    mockFindUnique.mockResolvedValue(null);

    const { POST } = await import('@/app/api/auth/change-password/route');

    const request = new Request('http://localhost/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'nonexistent', newPassword: 'newpassword123' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body.error.code).toBe('USER_NOT_FOUND');
  });

  it('应该成功修改密码', async () => {
    const userId = 'user-123';
    mockFindUnique.mockResolvedValue({
      id: userId,
      username: 'admin',
      passwordHash: 'oldhash',
    });
    mockUpdate.mockResolvedValue({
      id: userId,
      passwordHash: 'newhash',
      forceChangePassword: false,
      isInitialPassword: false,
    });

    const { POST } = await import('@/app/api/auth/change-password/route');

    const request = new Request('http://localhost/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, newPassword: 'newSecurePassword123!' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.message).toBe('密码修改成功');
  });

  it('应该调用 Prisma.update 并清除标志位', async () => {
    const userId = 'user-456';
    mockFindUnique.mockResolvedValue({
      id: userId,
      username: 'admin',
      passwordHash: 'oldhash',
      forceChangePassword: true,
      isInitialPassword: true,
    });
    mockUpdate.mockResolvedValue({});

    const { POST } = await import('@/app/api/auth/change-password/route');

    const request = new Request('http://localhost/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, newPassword: 'anotherSecurePassword!' }),
    });

    await POST(request);

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'test-user-id' },
      data: {
        passwordHash: expect.stringMatching(/^\$2[abxy]\$10\$/),
        forceChangePassword: false,
        isInitialPassword: false,
      },
    });
  });
});
