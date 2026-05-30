import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/log';

// 惰性获取 Prisma（动态 import 避免模块加载时实例化，构建阶段不会因 DATABASE_URL 未设置而崩溃）
async function getPrisma() {
  const { prisma } = await import('@/lib/db/prisma');
  return prisma;
}

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

    const backups: ProjectBackup[] = await Promise.all(
      projects.map(async (ws) => {
        const backupRecords = await db.backup.findMany({
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
  } catch (err) {
    console.error('[Cloud/Backups] 获取备份列表失败:', err);
    return NextResponse.json(
      { success: false, error: { message: '获取备份列表失败', code: 'GET_BACKUPS_FAILED' } },
      { status: 500 }
    );
  }
});