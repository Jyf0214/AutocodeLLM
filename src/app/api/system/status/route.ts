import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/log';
import { getPrisma } from '@/lib/db/get-prisma';


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