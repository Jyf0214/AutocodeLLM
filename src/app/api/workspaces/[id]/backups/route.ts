import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const workspace = await prisma.workspace.findUnique({
      where: { id },
    });

    if (!workspace) {
      return NextResponse.json(
        { success: false, error: { message: '工作区不存在' } },
        { status: 404 }
      );
    }

    // WebdavConfig 是全局单例，不属于 Workspace
    const config = await prisma.webdavConfig.findFirst();

    const backupInfo = {
      lastBackup: null,
      nextBackup: null,
      status: 'no_backup' as const,
      backupCount: 0,
      remoteUrl: config?.url ?? null,
      remotePath: config?.remotePath ?? null,
      enabled: config?.enabled ?? false,
    };

    return NextResponse.json({ success: true, data: backupInfo });
  } catch (error) {
    console.error('获取工作区备份信息失败:', error);
    return NextResponse.json(
      { success: false, error: { message: '获取备份信息失败' } },
      { status: 500 }
    );
  }
}
