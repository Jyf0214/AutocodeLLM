import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/log';
import { isWatchActive } from '@/lib/sync/watcher';

// 惰性获取 Prisma（动态 import 避免模块加载时实例化，构建阶段不会因 DATABASE_URL 未设置而崩溃）
async function getPrisma() {
  const { prisma } = await import('@/lib/db/prisma');
  return prisma;
}

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

    const projectBackups: ProjectBackupStatus[] = await Promise.all(
      projects.map(async (ws) => {
        const latestBackup = await db.backup.findFirst({
          where: { projectId: ws.id },
          orderBy: { createdAt: 'desc' },
        });

        return {
          projectId: ws.id,
          projectName: ws.name,
          lastBackup: latestBackup?.createdAt.toISOString() ?? null,
          status: latestBackup ? 'ok' : 'no_backup',
        };
      })
    );

    const overview: CloudOverview = {
      sync: syncStatus,
      projectBackups,
    };

    return NextResponse.json({ success: true, data: overview });
  } catch (err) {
    console.error('[Cloud/Overview] 获取云服务概览失败:', err);
    return NextResponse.json(
      { success: false, error: { message: '获取云服务概览失败', code: 'GET_OVERVIEW_FAILED' } },
      { status: 500 }
    );
  }
});