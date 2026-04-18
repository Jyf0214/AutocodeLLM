import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

interface WorkspaceBackup {
  workspaceId: string;
  workspaceName: string;
  lastBackup: string | null;
  nextBackup: string | null;
  status: 'ok' | 'failed' | 'no_backup';
  backupCount: number;
}

export async function GET() {
  try {
    const workspaces = await prisma.workspace.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const backups: WorkspaceBackup[] = await Promise.all(
      workspaces.map(async (ws) => {
        const backupRecords = await prisma.backup.findMany({
          where: { workspaceId: ws.id },
          orderBy: { createdAt: 'desc' },
        });

        const latestBackup = backupRecords[0];
        const hasFailure = backupRecords.some((b) => b.status === 'failed');

        return {
          workspaceId: ws.id,
          workspaceName: ws.name,
          lastBackup: latestBackup?.createdAt.toISOString() ?? undefined,
          nextBackup: null,
          status: latestBackup ? (hasFailure ? 'failed' : 'ok') : 'no_backup',
          backupCount: backupRecords.length,
        };
      })
    );

    return NextResponse.json({ success: true, data: backups });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: '获取备份列表失败', code: 'GET_BACKUPS_FAILED' } },
      { status: 500 }
    );
  }
}