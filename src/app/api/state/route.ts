import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/log';

// 惰性获取 Prisma（动态 import 避免模块加载时实例化，构建阶段不会因 DATABASE_URL 未设置而崩溃）
async function getPrisma() {
  const { prisma } = await import('@/lib/db/prisma');
  return prisma;
}

interface SystemComponent {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  latency?: number;
  details?: Record<string, unknown>;
}

export const GET = withApiLogging('GET state', async function GET() {
  const components: Record<string, SystemComponent> = {};
  
  try {
    const start = Date.now();
    const db = await getPrisma();
    await db.$queryRaw`SELECT 1`;
    components.database = {
      name: '数据库',
      status: 'healthy',
      message: `连接正常 (${String(Date.now() - start)}ms)`,
      latency: Date.now() - start,
    };
  } catch (error) {
    components.database = {
      name: '数据库',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : '连接失败',
    };
  }

    try {
     const db = await getPrisma();
     const providers = await db.provider.findMany({ take: 100 });
    const enabled = providers.filter(p => p.enabled).length;
    components.providers = {
      name: 'AI 提供商',
      status: providers.length === 0 ? 'degraded' : 'healthy',
      message: providers.length === 0 ? '暂无 AI 提供商' : `${String(enabled)} 个已启用`,
      details: { total: providers.length, enabled },
    };
  } catch (error) {
    components.providers = {
      name: 'AI 提供商',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : '检查失败',
    };
  }

  components.api = {
    name: 'API',
    status: 'healthy',
    message: '运行正常',
  };

  return NextResponse.json({
    success: true,
    data: components,
  });
});