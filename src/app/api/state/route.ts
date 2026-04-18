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
    const workers = await prisma.worker.findMany({ take: 100 });
    const online = workers.filter(w => w.status === 'online').length;
    components.workers = {
      name: '工作节点',
      status: workers.length === 0 ? 'degraded' : online > 0 ? 'healthy' : 'unhealthy',
      message: workers.length === 0 ? '暂无工作节点' : `${String(online)}/${String(workers.length)} 在线`,
      details: { total: workers.length, online },
    };
  } catch (error) {
    components.workers = {
      name: '工作节点',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : '检查失败',
    };
  }

  try {
    const servers = await prisma.mcpServer.findMany({ take: 100 });
    const enabled = servers.filter(s => s.enabled).length;
    const connected = servers.filter(s => s.status === 'connected').length;
    components.mcp = {
      name: 'MCP',
      status: servers.length === 0 ? 'degraded' : connected > 0 ? 'healthy' : 'degraded',
      message: servers.length === 0 ? '暂无 MCP 服务器' : `${String(connected)}/${String(enabled)} 已连接`,
      details: { total: servers.length, enabled, connected },
    };
  } catch (error) {
    components.mcp = {
      name: 'MCP',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : '检查失败',
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