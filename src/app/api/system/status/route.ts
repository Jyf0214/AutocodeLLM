import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/log';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/system/status
 * 系统健康检查（无需认证）
 */
export const GET = withApiLogging('GET system/status', async function GET() {
  let dbStatus = 'healthy';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
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