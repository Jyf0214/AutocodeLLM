import { successResponse, errorResponse } from '@/lib/api/response';
import { withApiLogging } from '@/lib/log';
import { requireAuth } from '@/lib/auth';
import { getPrisma } from '@/lib/db/get-prisma';


interface ProjectBackup {
  projectId: string;
  projectName: string;
  lastBackup: string | null;
  nextBackup: string | null;
  status: 'ok' | 'failed' | 'no_backup';
  backupCount: number;
}

export const GET = withApiLogging('GET cloud/backups', async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

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

    return successResponse(backups);
  } catch (err) {
    console.error('[Cloud/Backups] 获取备份列表失败:', err);
    return errorResponse('获取备份列表失败', 'GET_BACKUPS_FAILED', 500);
  }
});