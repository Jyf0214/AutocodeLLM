import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/log';
import { getPrisma } from '@/lib/db/get-prisma';


interface ProjectBackup {
  projectId: string;
  projectName: string;
  lastBackup: string | null;
  nextBackup: string | null;
  status: 'ok' | 'failed' | 'no_backup';
  backupCount: number;
}

export const GET = withApiLogging('GET cloud/backups', async function GET() {
  try {
    const db = await getPrisma();
    const projects = await db.project.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const backupStats = await db.backup.groupBy({
      by: ['projectId'],
      _max: { createdAt: true },
      _count: true,
    });
    const failedProjects = await db.backup.groupBy({
      by: ['projectId'],
      where: { status: 'FAILED' },
      _count: true,
    });
    const failedSet = new Set(failedProjects.map((b) => b.projectId));
    const statsMap = new Map(
      backupStats.map((b) => [b.projectId, { maxCreatedAt: b._max.createdAt, count: b._count }])
    );
    const backups: ProjectBackup[] = projects.map((ws) => {
      const stats = statsMap.get(ws.id);
      const hasFailure = failedSet.has(ws.id);
      return {
        projectId: ws.id,
        projectName: ws.name,
        lastBackup: stats?.maxCreatedAt?.toISOString() ?? null,
        nextBackup: null,
        status: stats ? (hasFailure ? 'failed' : 'ok') : 'no_backup',
        backupCount: stats?.count ?? 0,
      };
    });

    return NextResponse.json({ success: true, data: backups });
  } catch (err) {
    console.error('[Cloud/Backups] 获取备份列表失败:', err);
    return NextResponse.json(
      { success: false, error: { message: '获取备份列表失败', code: 'GET_BACKUPS_FAILED' } },
      { status: 500 }
    );
  }
});