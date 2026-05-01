import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/data/export
 * 导出所有数据为 JSON
 */
export async function GET(request: Request) {
  const auth = await requireAuth(request, 'admin');
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const scope = searchParams.get('scope') || 'all'; // all, workspaces, providers, settings

  const data: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
  };

  if (scope === 'all' || scope === 'workspaces') {
    data.workspaces = await prisma.workspace.findMany({
      select: { id: true, name: true, description: true, createdAt: true, updatedAt: true },
    });
  }

  if (scope === 'all' || scope === 'providers') {
    data.providers = await prisma.provider.findMany({
      select: { id: true, name: true, baseUrl: true, enabled: true, providerType: true, sdkType: true },
    });
  }

  if (scope === 'all' || scope === 'settings') {
    data.envVars = await prisma.environmentVariable.findMany({
      select: { id: true, key: true, description: true, enabled: true },
    });
    data.mcpServers = await prisma.mcpServer.findMany({
      select: { id: true, name: true, url: true, enabled: true },
    });
    data.agentTasks = await prisma.agentTask.findMany();
  }

  return NextResponse.json({ success: true, data });
}