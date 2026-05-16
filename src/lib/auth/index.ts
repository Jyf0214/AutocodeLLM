/**
 * 权限管理模块
 * - 角色：admin, user, viewer
 * - API Key 认证
 * - 路由权限守卫
 */
import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/prisma';

// ============================================================
// 角色定义
// ============================================================

export type Role = 'admin' | 'user' | 'viewer';

export const ROLE_HIERARCHY: Record<Role, number> = {
  viewer: 0,
  user: 1,
  admin: 2,
};

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  admin: ['read', 'write', 'delete', 'admin', 'api_key', 'settings', 'users'],
  user: ['read', 'write', 'delete'],
  viewer: ['read'],
};

export function hasPermission(role: Role, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasMinRole(role: Role, required: Role): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[required];
}

// ============================================================
// Session（基于 cookie）
// ============================================================

export interface Session {
  userId: string;
  username: string;
  role: Role;
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, role: true },
  });

  if (!user) return null;

  return {
    userId: user.id,
    username: user.username,
    role: (user.role as Role) || 'viewer',
  };
}

// ============================================================
// API Key 认证
// ============================================================

export interface ApiKeyAuthResult {
  valid: boolean;
  userId?: string;
  permissions?: string[];
  error?: string;
}

export async function validateApiKey(key: string): Promise<ApiKeyAuthResult> {
  const keyHash = createHash('sha256').update(key).digest('hex');

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    select: {
      id: true,
      userId: true,
      enabled: true,
      permissions: true,
      expiresAt: true,
    },
  });

  if (!apiKey) return { valid: false, error: '无效的 API Key' };
  if (!apiKey.enabled) return { valid: false, error: 'API Key 已禁用' };
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return { valid: false, error: 'API Key 已过期' };
  }

  // 更新最后使用时间
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  }).catch((error) => {
    console.error('Failed to update lastUsedAt:', error);
  });

  return {
    valid: true,
    userId: apiKey.userId,
    permissions: JSON.parse(apiKey.permissions || '[]'),
  };
}

// ============================================================
// API Key 生成
// ============================================================

export function generateApiKey(): { key: string; keyHash: string; prefix: string } {
  const raw = randomBytes(32).toString('hex');
  const key = `ak_${raw}`;
  const keyHash = createHash('sha256').update(key).digest('hex');
  const prefix = key.slice(0, 8);
  return { key, keyHash, prefix };
}

// ============================================================
// 请求认证（统一入口）
// ============================================================

export interface AuthResult {
  authenticated: boolean;
  userId?: string;
  role?: Role;
  permissions?: string[];
  error?: string;
}

export async function authenticateRequest(request: Request): Promise<AuthResult> {
  // 1. 优先检查 API Key（Authorization: Bearer ak_xxx）
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const key = authHeader.slice(7);
    if (key.startsWith('ak_')) {
      const result = await validateApiKey(key);
      if (!result.valid) {
        return { authenticated: false, error: result.error };
      }
      return {
        authenticated: true,
        userId: result.userId,
        role: 'user',
        permissions: result.permissions,
      };
    }
  }

  // 2. 检查 x-api-key 头
  const apiKeyHeader = request.headers.get('x-api-key');
  if (apiKeyHeader) {
    const result = await validateApiKey(apiKeyHeader);
    if (!result.valid) {
      return { authenticated: false, error: result.error };
    }
    return {
      authenticated: true,
      userId: result.userId,
      role: 'user',
      permissions: result.permissions,
    };
  }

  // 3. Cookie session
  const session = await getSession();
  if (session) {
    return {
      authenticated: true,
      userId: session.userId,
      role: session.role,
      permissions: ROLE_PERMISSIONS[session.role],
    };
  }

  return { authenticated: false, error: '未认证' };
}

// ============================================================
// 权限守卫（用于 API 路由）
// ============================================================

export async function requireAuth(
  request: Request,
  requiredPermission?: string,
): Promise<{ session: Session; error?: never } | { session?: never; error: Response }> {
  const auth = await authenticateRequest(request);

  if (!auth.authenticated) {
    return {
      error: new Response(
        JSON.stringify({ success: false, error: { message: auth.error || '未认证', code: 'UNAUTHORIZED' } }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      ),
    };
  }

  const role = auth.role || 'viewer';
  if (requiredPermission && !hasPermission(role, requiredPermission)) {
    return {
      error: new Response(
        JSON.stringify({ success: false, error: { message: '权限不足', code: 'FORBIDDEN' } }),
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      ),
    };
  }

  return {
    session: {
      userId: auth.userId!,
      username: '', // 简化，API Key 场景不需要
      role,
    },
  };
}