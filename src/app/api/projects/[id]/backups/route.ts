import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/log';
import { prisma } from '@/lib/db/prisma';

export const GET = withApiLogging('GET projects/:id/backups', async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json(
         { success: false, error: { message: '项目不存在' } },
        { status: 404 }
      );
    }

    // WebdavConfig 是全局单例，不属于 Project
    const config = await prisma.webdavConfig.findFirst();

    const backupRecords = await prisma.backup.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
    });

    const latestBackup = backupRecords[0];
    const hasFailure = backupRecords.some((b) => b.status === 'failed');

    const backupInfo = {
      lastBackup: latestBackup?.createdAt.toISOString() ?? null,
      nextBackup: null,
      status: (latestBackup ? (hasFailure ? 'failed' : 'ok') : 'no_backup') as 'ok' | 'failed' | 'no_backup',
      backupCount: backupRecords.length,
      remoteUrl: config?.url ?? null,
      remotePath: config?.remotePath ?? null,
      enabled: config?.enabled ?? false,
    };

    return NextResponse.json({ success: true, data: backupInfo });
  } catch (error) {
    console.error('获取项目备份信息失败:', error);
    return NextResponse.json(
      { success: false, error: { message: '获取备份信息失败' } },
      { status: 500 }
    );
  }
});
