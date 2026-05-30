import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/log';

// 惰性获取 Prisma（动态 import 避免模块加载时实例化，构建阶段不会因 DATABASE_URL 未设置而崩溃）
async function getPrisma() {
  const { prisma } = await import('@/lib/db/prisma');
  return prisma;
}

/**
 * GET /api/system/status
 * 系统健康检查（无需认证）
 */
export const GET = withApiLogging('GET system/status', async function GET() {
  let dbStatus = 'healthy';
  try {
    const db = await getPrisma();
    await db.$queryRaw`SELECT 1`;
  } catch (err) {
    console.error('[System] 数据库健康检查失败:', err);
    dbStatus = 'unhealthy';
  }

  return NextResponse.json({
    success: true,
    data: {
      status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      database: dbStatus,
    },
  });
});