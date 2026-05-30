/**
 * Better Auth 集成
 * 提供现代化认证框架支持，与现有认证系统并存
 *
 * 安全修复：移除 randomBytes 回退密钥，强制要求设置 BETTER_AUTH_SECRET 环境变量
 *
 * 配置方式：
 * - BETTER_AUTH_SECRET: 签名密钥（必填）
 * - BETTER_AUTH_URL: 服务地址（默认 http://localhost:3000）
 */
import { createHash } from 'node:crypto';

// 强制检查 BETTER_AUTH_SECRET 环境变量
const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET;
if (!BETTER_AUTH_SECRET) {
  throw new Error('BETTER_AUTH_SECRET 环境变量未设置，Better Auth 无法启动');
}

/**
 * Better Auth 配置
 */
export const betterAuthConfig = {
  secret: BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
};

/**
 * 生成 Better Auth 兼容的 session token
 */
export function generateBetterAuthToken(userId: string): string {
  const payload = JSON.stringify({
    userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
  });
  const signature = createHash('sha256')
    .update(`${payload}.${betterAuthConfig.secret}`)
    .digest('hex');
  return Buffer.from(`${payload}.${signature}`).toString('base64url');
}

/**
 * 验证 Better Auth token
 */
export function verifyBetterAuthToken(token: string): { userId: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const [payload, signature] = decoded.split('.');
    const expectedSig = createHash('sha256')
      .update(`${payload}.${betterAuthConfig.secret}`)
      .digest('hex');

    if (signature !== expectedSig) return null;

    const payloadData = payload as string | undefined;
    if (!payloadData) return null;

    const data = JSON.parse(payloadData) as { userId: string; exp: number };
    if (data.exp < Math.floor(Date.now() / 1000)) return null;

    return { userId: data.userId };
  } catch {
    return null;
  }
}

// ============================================================
// Clerk Webhook 集成
// ============================================================

/**
 * Clerk Webhook 载荷
 */
export interface ClerkWebhookPayload {
  type: 'user.created' | 'user.updated' | 'user.deleted';
  data: {
    id: string;
    email_addresses: Array<{ email_address: string }>;
    username?: string;
    first_name?: string;
    last_name?: string;
  };
}

/**
 * Clerk Webhook 处理
 * 当 Clerk 用户创建/更新/删除时同步到本地数据库
 * 如果 Clerk 未启用，直接返回不做处理
 */
export async function handleClerkWebhook(payload: ClerkWebhookPayload): Promise<void> {
  // 如果 Clerk 未启用，直接返回
  const { isClerkEnabled } = await import('./clerk-config');
  if (!isClerkEnabled()) {
    console.log('[Clerk] Clerk 未启用，跳过 Webhook 处理');
    return;
  }

  const { prisma } = await import('@/lib/db/prisma');
  const { randomBytes, createHash } = await import('node:crypto');

  const { type, data } = payload;
  const email = data.email_addresses?.[0]?.email_address || '';
  const username = data.username || email.split('@')[0] || data.id;

  try {
    switch (type) {
      case 'user.created': {
        // 检查是否已存在相同 clerkId 的用户
        const existingByClerkId = await prisma.user.findFirst({
          where: { clerkId: data.id },
        });

        if (existingByClerkId) {
          console.log('[Clerk] 用户已存在 (clerkId):', username, data.id);
          return;
        }

        // 为新用户生成随机密码（Clerk 用户不通过本地密码登录）
        const salt = randomBytes(16).toString('hex');
        const placeholderHash = createHash('sha256')
          .update(`${data.id}:${salt}`)
          .digest('hex');

        await prisma.user.create({
          data: {
            id: data.id,
            username,
            passwordHash: `${salt}:${placeholderHash}`,
            role: 'user',
            forceChangePassword: false,
            isInitialPassword: false,
            clerkId: data.id,
          },
        });
        console.log('[Clerk] 用户已创建:', username, data.id);
        break;
      }

      case 'user.updated': {
        // 首先通过 clerkId 查找
        const existing = await prisma.user.findFirst({
          where: { clerkId: data.id },
        });

        if (existing) {
          await prisma.user.update({
            where: { id: existing.id },
            data: { username },
          });
          console.log('[Clerk] 用户已更新:', username, data.id);
        } else {
          console.warn('[Clerk] 用户不存在 (clerkId):', data.id);
        }
        break;
      }

      case 'user.deleted': {
        // 通过 clerkId 查找并删除
        const existing = await prisma.user.findFirst({
          where: { clerkId: data.id },
        });

        if (existing) {
          await prisma.user.delete({ where: { id: existing.id } });
          console.log('[Clerk] 用户已删除:', data.id);
        } else {
          console.warn('[Clerk] 用户不存在，跳过删除:', data.id);
        }
        break;
      }
    }
  } catch (err) {
    console.error('[Clerk] Webhook 处理失败:', err);
    throw err;
  }
}

// ============================================================
// Supabase Auth 集成
// ============================================================

/**
 * Supabase Auth 配置
 * 使用 Supabase JWT 进行认证
 */
export interface SupabaseAuthConfig {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
}

/**
 * 获取 Supabase 配置
 */
export function getSupabaseConfig(): SupabaseAuthConfig | null {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey) return null;

  return { url, anonKey, serviceRoleKey: serviceRoleKey || '' };
}

/**
 * 验证 Supabase JWT Token
 */
export async function verifySupabaseToken(token: string): Promise<{ sub: string; email?: string } | null> {
  const config = getSupabaseConfig();
  if (!config) return null;

  try {
    const res = await fetch(`${config.url}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: config.anonKey,
      },
    });

    if (!res.ok) return null;

    const user = (await res.json()) as { id: string; email?: string };
    return { sub: user.id, email: user.email };
  } catch {
    return null;
  }
}