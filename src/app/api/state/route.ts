import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

interface SystemComponent {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  latency?: number;
  details?: Record<string, unknown>;
}

export async function GET() {
  const components: Record<string, SystemComponent> = {};
  
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
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
     const providers = await prisma.provider.findMany({ take: 100 });
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
}