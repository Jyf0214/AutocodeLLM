import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/log';
import { isWatchActive } from '@/lib/sync/watcher';
import { getPrisma } from '@/lib/db/get-prisma';


interface SyncStatus {
  enabled: boolean;
  watching: boolean;
  url: string;
  remotePath: string;
}

interface ProjectBackupStatus {
  projectId: string;
  projectName: string;
  lastBackup: string | null;
  status: 'ok' | 'failed' | 'no_backup';
}

interface CloudOverview {
  sync: SyncStatus | null;
  projectBackups: ProjectBackupStatus[];
}

export const GET = withApiLogging('GET cloud/overview', async function GET() {
  try {
    const db = await getPrisma();
    const config = await db.webdavConfig.findFirst();
    const syncStatus: SyncStatus = {
      enabled: config?.enabled ?? false,
      watching: isWatchActive(),
      url: config?.url ?? '',
      remotePath: config?.remotePath ?? '',
    };

    const projects = await db.project.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const latestRecords = await db.backup.groupBy({
      by: ['projectId'],
      _max: { createdAt: true },
    });
    const latestBackupMap = new Map(
      latestRecords.map((r) => [r.projectId, r._max.createdAt])
    );
    const projectBackups: ProjectBackupStatus[] = projects.map((ws) => {
      const latestCreatedAt = latestBackupMap.get(ws.id);
      return {
        projectId: ws.id,
        projectName: ws.name,
        lastBackup: latestCreatedAt?.toISOString() ?? null,
        status: latestCreatedAt ? 'ok' : 'no_backup',
      };
    });

    const overview: CloudOverview = {
      sync: syncStatus,
      projectBackups,
    };

    return NextResponse.json(
      { success: true, data: overview },
      { headers: { 'Cache-Control': 'private, max-age=30' } },
    );
  } catch (err) {
    console.error('[Cloud/Overview] 获取云服务概览失败:', err);
    return NextResponse.json(
      { success: false, error: { message: '获取云服务概览失败', code: 'GET_OVERVIEW_FAILED' } },
      { status: 500 }
    );
  }
});