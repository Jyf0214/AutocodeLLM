import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { isWatchActive } from '@/lib/sync/watcher';

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

export async function GET() {
  try {
    const config = await prisma.webdavConfig.findFirst();
    const syncStatus: SyncStatus = {
      enabled: config?.enabled ?? false,
      watching: isWatchActive(),
      url: config?.url ?? '',
      remotePath: config?.remotePath ?? '',
    };

    const projects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const projectBackups: ProjectBackupStatus[] = await Promise.all(
      projects.map(async (ws) => {
        const latestBackup = await prisma.backup.findFirst({
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
  } catch {
    return NextResponse.json(
      { success: false, error: { message: '获取云服务概览失败', code: 'GET_OVERVIEW_FAILED' } },
      { status: 500 }
    );
  }
}