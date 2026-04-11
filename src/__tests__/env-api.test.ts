import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCipheriv, randomBytes, createHash } from 'crypto';

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

/**
 * 从环境变量派生 32 字节 AES-256 密钥（使用 SHA-256）
 * 与 route.ts 保持一致
 */
function deriveKey(): Buffer {
  const keyStr = process.env.KEY_VAULTS_SECRET ?? 'your-key-vaults-secret-change-in-production';
  return createHash('sha256').update(keyStr).digest();
}

/**
 * AES-256-CBC 加密（与 route.ts 保持一致，使用 SHA-256 派生密钥）
 */
function encryptValue(value: string): string {
  const key = deriveKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(value, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * AES-256-CBC 解密（与 route.ts 保持一致）
 */
function decryptValue(encrypted: string): string {
  const key = deriveKey();
  const parts = encrypted.split(':');
  if (parts.length !== 2) {
    throw new Error('无效的加密数据格式：应为 iv:encrypted');
  }
  const [ivHex, encryptedData] = parts;
  if (!ivHex || !encryptedData) {
    throw new Error('无效的加密数据：iv 或加密数据为空');
  }
  const iv = Buffer.from(ivHex, 'hex');
  const { createDecipheriv } = require('crypto');
  const decipher = createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * 脱敏显示变量值（与 route.ts 保持一致）
 */
function maskValue(value: string): string {
  if (value.length <= 2) return '**';
  return value.substring(0, 2) + '*'.repeat(Math.max(value.length - 2, 4));
}

describe('环境变量 API (/api/env)', () => {
  beforeEach(() => {
    vi.resetModules();
    mockFindMany.mockReset();
    mockFindUnique.mockReset();
    mockCreate.mockReset();
    mockUpdate.mockReset();
    mockDelete.mockReset();
  });

  describe('GET /api/env', () => {
    it('应该返回所有环境变量列表', async () => {
      const mockEnvVars = [
        {
          id: 'env-1',
          key: 'API_KEY',
          value: encryptValue('sk-test123'),
          description: '测试密钥',
          enabled: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: 'env-2',
          key: 'SECRET',
          value: encryptValue('my-secret'),
          description: '另一个密钥',
          enabled: false,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
        },
      ];

      mockFindMany.mockResolvedValue(mockEnvVars);

      const { GET } = await import('@/app/api/env/route');
      const response = await GET();

      expect(response.status).toBe(200);

      const body = await response.json() as { success: boolean; data: Array<{ key: string; value: string }> };
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(2);
      expect(body.data[0]?.key).toBe('API_KEY');
      expect(body.data[1]?.key).toBe('SECRET');
    });

    it('应该返回空数组当没有环境变量时', async () => {
      mockFindMany.mockResolvedValue([]);

      const { GET } = await import('@/app/api/env/route');
      const response = await GET();

      const body = await response.json() as { data: unknown[] };
      expect(body.data).toEqual([]);
    });

    it('数据库错误时应该返回 500', async () => {
      mockFindMany.mockRejectedValue(new Error('DB Error'));

      const { GET } = await import('@/app/api/env/route');
      const response = await GET();

      expect(response.status).toBe(500);

      const body = await response.json() as { error: { code: string } };
      expect(body.error.code).toBe('FETCH_FAILED');
    });

    it('应该脱敏显示变量值', async () => {
      const mockEnvVars = [
        {
          id: 'env-1',
          key: 'SECRET_KEY',
          value: encryptValue('my-secret-value'),
          description: '',
          enabled: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];

      mockFindMany.mockResolvedValue(mockEnvVars);

      const { GET } = await import('@/app/api/env/route');
      const response = await GET();

      const body = await response.json() as { data: Array<{ value: string }> };
      const firstItem = body.data[0];
      if (!firstItem) throw new Error('Expected at least one env var');
      // 脱敏后应该包含星号
      expect(firstItem.value.includes('*')).toBe(true);
      // 长度应该大于原值的前2字符 + 至少4个星号
      expect(firstItem.value.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('POST /api/env', () => {
    it('应该创建新的环境变量', async () => {
      const newEnvVar = {
        id: 'env-1',
        key: 'API_KEY',
        value: encryptValue('sk-test123'),
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
      });

      const { POST } = await import('@/app/api/env/route');

      const request = new Request('http://localhost/api/env', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'API_KEY',
          value: 'sk-test123',
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
        value: encryptValue('sk-test123'),
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
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const body = await response.json() as { data: { enabled: boolean } };
      expect(body.data.enabled).toBe(true);
    });
  });

  describe('PUT /api/env', () => {
    it('应该更新环境变量配置', async () => {
      const existingEnvVar = {
        id: 'env-1',
        key: 'OLD_KEY',
        value: encryptValue('old-value'),
        description: '旧描述',
        enabled: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const updatedEnvVar = {
        id: 'env-1',
        key: 'NEW_KEY',
        value: encryptValue('new-value'),
        description: '新描述',
        enabled: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      mockFindUnique
        .mockResolvedValueOnce(existingEnvVar)
        .mockResolvedValueOnce(null);
      mockUpdate.mockResolvedValue(updatedEnvVar);

      const { PUT } = await import('@/app/api/env/route');

      const request = new Request('http://localhost/api/env', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'env-1',
          key: 'NEW_KEY',
          value: 'new-value',
          description: '新描述',
          enabled: false,
        }),
      });

      const response = await PUT(request);
      expect(response.status).toBe(200);

      const body = await response.json() as { data: { key: string; enabled: boolean } };
      expect(body.data.key).toBe('NEW_KEY');
      expect(body.data.enabled).toBe(false);
    });

    it('应该拒绝缺少 ID 的请求', async () => {
      const { PUT } = await import('@/app/api/env/route');

      const request = new Request('http://localhost/api/env', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'API_KEY',
          value: 'sk-test123',
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
          value: 'sk-test123',
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
        key: 'OLD_KEY',
        value: encryptValue('old-value'),
        description: '',
        enabled: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const duplicateEnvVar = {
        id: 'env-2',
        key: 'NEW_KEY',
        value: encryptValue('other-value'),
        description: '',
        enabled: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockFindUnique
        .mockResolvedValueOnce(existingEnvVar)
        .mockResolvedValueOnce(duplicateEnvVar);

      const { PUT } = await import('@/app/api/env/route');

      const request = new Request('http://localhost/api/env', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'env-1',
          key: 'NEW_KEY',
          value: 'new-value',
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
        value: encryptValue('old-value'),
        description: '',
        enabled: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const updatedEnvVar = {
        id: 'env-1',
        key: 'API_KEY',
        value: encryptValue('new-value'),
        description: '新描述',
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
          key: 'API_KEY',
          value: 'new-value',
          description: '新描述',
        }),
      });

      const response = await PUT(request);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.key).toBe('API_KEY');
    });
  });

  describe('DELETE /api/env', () => {
    it('应该删除环境变量', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'env-1',
        key: 'API_KEY',
      });
      mockDelete.mockResolvedValue({ id: 'env-1' });

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
