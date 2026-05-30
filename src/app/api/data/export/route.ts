import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/log';
import { requireAuth } from '@/lib/auth';

// 惰性获取 Prisma（动态 import 避免模块加载时实例化，构建阶段不会因 DATABASE_URL 未设置而崩溃）
async function getPrisma() {
  const { prisma } = await import('@/lib/db/prisma');
  return prisma;
}

/**
 * GET /api/data/export
 * 导出所有数据为 JSON
 */
export const GET = withApiLogging('GET data/export', async function GET(request: Request) {
  const auth = await requireAuth(request, 'admin');
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const scope = searchParams.get('scope') ?? 'all'; // all, projects

  const data: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
  };

  if (scope === 'all' || scope === 'projects') {
    const db = await getPrisma();
    data.projects = await db.project.findMany({
      select: { id: true, name: true, description: true, createdAt: true, updatedAt: true },
    });
  }

  return NextResponse.json({ success: true, data });
});