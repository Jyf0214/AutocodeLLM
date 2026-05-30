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

/**
 * 获取 Better Auth 配置（惰性初始化，运行时检查 env 是否已设置）
 * 模块加载时不做检查，避免构建阶段（如 next build 收集页面数据时）因 env 未设置而崩溃
 */
function getBetterAuthConfig(): { secret: string; baseURL: string } {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error('BETTER_AUTH_SECRET 环境变量未设置，Better Auth 无法启动');
  }
  return {
    secret,
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  };
}

/**
 * 生成 Better Auth 兼容的 session token
 */
export function generateBetterAuthToken(userId: string): string {
  const cfg = getBetterAuthConfig();
  const payload = JSON.stringify({
    userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
  });
  const signature = createHash('sha256')
    .update(`${payload}.${cfg.secret}`)
    .digest('hex');
  return Buffer.from(`${payload}.${signature}`).toString('base64url');
}

/**
 * 验证 Better Auth token
 */
export function verifyBetterAuthToken(token: string): { userId: string } | null {
  try {
    const cfg = getBetterAuthConfig();
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const [payload, signature] = decoded.split('.');
    const expectedSig = createHash('sha256')
      .update(`${payload}.${cfg.secret}`)
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