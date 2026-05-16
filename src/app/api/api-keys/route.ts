import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth, generateApiKey } from '@/lib/auth';

/**
 * GET /api/api-keys
 * 列出当前用户的所有 API Key
 */
export async function GET(request: Request) {
  const auth = await requireAuth(request, 'api_key');
  if (auth.error) return auth.error;

  const keys = await prisma.apiKey.findMany({
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
}

/**
 * POST /api/api-keys
 * 创建新的 API Key
 */
export async function POST(request: Request) {
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

  const apiKey = await prisma.apiKey.create({
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
}