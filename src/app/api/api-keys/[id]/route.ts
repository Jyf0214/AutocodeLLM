import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth';

/**
 * DELETE /api/api-keys/[id]
 * 删除 API Key
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(request, 'api_key');
  if (auth.error) return auth.error;

  const { id } = await params;

  const key = await prisma.apiKey.findUnique({ where: { id } });
  if (key?.userId !== auth.session.userId) {
    return NextResponse.json(
      { success: false, error: { message: 'API Key 不存在', code: 'NOT_FOUND' } },
      { status: 404 },
    );
  }

  await prisma.apiKey.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

/**
 * PATCH /api/api-keys/[id]
 * 更新 API Key（启用/禁用、权限）
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(request, 'api_key');
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = (await request.json()) as {
    enabled?: boolean;
    permissions?: string[];
    name?: string;
  };

  const key = await prisma.apiKey.findUnique({ where: { id } });
  if (key?.userId !== auth.session.userId) {
    return NextResponse.json(
      { success: false, error: { message: 'API Key 不存在', code: 'NOT_FOUND' } },
      { status: 404 },
    );
  }

  const updated = await prisma.apiKey.update({
    where: { id },
    data: {
      ...(body.enabled !== undefined && { enabled: body.enabled }),
      ...(body.permissions && { permissions: JSON.stringify(body.permissions) }),
      ...(body.name && { name: body.name }),
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      id: updated.id,
      name: updated.name,
      prefix: updated.prefix,
      permissions: JSON.parse(updated.permissions),
      enabled: updated.enabled,
    },
  });
}