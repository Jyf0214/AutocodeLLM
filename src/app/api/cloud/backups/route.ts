import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

interface ProjectBackup {
  projectId: string;
  projectName: string;
  lastBackup: string | null;
  nextBackup: string | null;
  status: 'ok' | 'failed' | 'no_backup';
  backupCount: number;
}

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const backups: ProjectBackup[] = await Promise.all(
      projects.map(async (ws) => {
        const backupRecords = await prisma.backup.findMany({
          where: { projectId: ws.id },
          orderBy: { createdAt: 'desc' },
        });

        const latestBackup = backupRecords[0];
        const hasFailure = backupRecords.some((b) => b.status === 'failed');

        return {
          projectId: ws.id,
          projectName: ws.name,
          lastBackup: latestBackup?.createdAt.toISOString() ?? null,
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