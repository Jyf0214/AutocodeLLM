/**
 * Better Auth 集成
 * 提供现代化认证框架支持，与现有认证系统并存
 *
 * 配置方式：
 * - BETTER_AUTH_SECRET: 签名密钥
 * - BETTER_AUTH_URL: 服务地址（默认 http://localhost:3000）
 */
import { createHash, randomBytes } from 'node:crypto';

/**
 * Better Auth 配置
 */
export const betterAuthConfig = {
  secret: process.env.BETTER_AUTH_SECRET || randomBytes(32).toString('hex'),
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

    const data = JSON.parse(payload) as { userId: string; exp: number };
    if (data.exp < Math.floor(Date.now() / 1000)) return null;

    return { userId: data.userId };
  } catch {
    return null;
  }
}

// ============================================================
// Clerk 集成点（占位）
// ============================================================

/**
 * Clerk Webhook 处理
 * 当 Clerk 用户创建/更新/删除时同步到本地数据库
 */
export interface ClerkWebhookPayload {
  type: 'user.created' | 'user.updated' | 'user.deleted';
  data: {
    id: string;
    email_addresses: Array<{ email_address: string }>;
    username?: string;
  };
}

export async function handleClerkWebhook(payload: ClerkWebhookPayload): Promise<void> {
  // Clerk 集成占位 — 未来实现用户同步
  console.log('[Clerk] webhook received:', payload.type, payload.data.id);
}

// ============================================================
// Supabase 集成点（占位）
// ============================================================

/**
 * Supabase Auth 集成
 * 使用 Supabase JWT 进行认证
 */
export interface SupabaseAuthConfig {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
}

export function getSupabaseConfig(): SupabaseAuthConfig | null {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey) return null;

  return { url, anonKey, serviceRoleKey: serviceRoleKey || '' };
}