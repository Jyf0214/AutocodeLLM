import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { isWatchActive } from '@/lib/sync/watcher';

interface SyncStatus {
  enabled: boolean;
  watching: boolean;
  url: string;
  remotePath: string;
}

interface WorkspaceBackupStatus {
  workspaceId: string;
  workspaceName: string;
  lastBackup: string | null;
  status: 'ok' | 'failed' | 'no_backup';
}

interface CloudOverview {
  sync: SyncStatus | null;
  workspaceBackups: WorkspaceBackupStatus[];
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

    const workspaces = await prisma.workspace.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const workspaceBackups: WorkspaceBackupStatus[] = await Promise.all(
      workspaces.map(async (ws) => {
        const latestBackup = await prisma.backup.findFirst({
          where: { workspaceId: ws.id },
          orderBy: { createdAt: 'desc' },
        });

        return {
          workspaceId: ws.id,
          workspaceName: ws.name,
          lastBackup: latestBackup?.createdAt.toISOString() ?? null,
          status: latestBackup ? 'ok' : 'no_backup',
        };
      })
    );

    const overview: CloudOverview = {
      sync: syncStatus,
      workspaceBackups,
    };

    return NextResponse.json({ success: true, data: overview });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: '获取云服务概览失败', code: 'GET_OVERVIEW_FAILED' } },
      { status: 500 }
    );
  }
}