import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/log';
import { requireAuth, generateApiKey } from '@/lib/auth';

// 惰性获取 Prisma（动态 import 避免模块加载时实例化，构建阶段不会因 DATABASE_URL 未设置而崩溃）
async function getPrisma() {
  const { prisma } = await import('@/lib/db/prisma');
  return prisma;
}

/**
 * GET /api/api-keys
 * 列出当前用户的所有 API Key
 */
export const GET = withApiLogging('GET api-keys', async function GET(request: Request) {
  const auth = await requireAuth(request, 'api_key');
  if (auth.error) return auth.error;

    const db = await getPrisma();
  const keys = await db.apiKey.findMany({
    where: { userId: auth.session.userId },
    select: {
      id: true,
      name: true,
      prefix: true,
      permissions: true,
      lastUsedAt: true,
      expiresAt: true,
      enabled: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    success: true,
    data: keys.map((k) => ({
      ...k,
      permissions: JSON.parse(k.permissions || '[]'),
    })),
  });
});

/**
 * POST /api/api-keys
 * 创建新的 API Key
 */
export const POST = withApiLogging('POST api-keys', async function POST(request: Request) {
  const auth = await requireAuth(request, 'api_key');
  if (auth.error) return auth.error;

  const body = (await request.json()) as {
    name: string;
    permissions?: string[];
    expiresAt?: string;
  };

  if (!body.name) {
    return NextResponse.json(
      { success: false, error: { message: '请输入密钥名称', code: 'MISSING_NAME' } },
      { status: 400 },
    );
  }

  const { key, keyHash, prefix } = generateApiKey();

    const db = await getPrisma();
  const apiKey = await db.apiKey.create({
    data: {
      userId: auth.session.userId,
      name: body.name,
      keyHash,
      prefix,
      permissions: JSON.stringify(body.permissions ?? ['read']),
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    },
  });

  // 仅在创建时返回完整密钥
  return NextResponse.json({
    success: true,
    data: {
      id: apiKey.id,
      name: apiKey.name,
      key, // 完整密钥仅返回一次
      prefix: apiKey.prefix,
      permissions: JSON.parse(apiKey.permissions),
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    },
  });
});