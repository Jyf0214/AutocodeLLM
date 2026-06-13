import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/log';
import { requireAuth } from '@/lib/auth';
import { getPrisma } from '@/lib/db/get-prisma';


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