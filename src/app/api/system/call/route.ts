import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

/**
 * POST /api/system/call
 * 系统调用 API — 使用 API Key 认证，调用内部功能
 *
 * 请求体：
 * {
 *   "action": "listWorkspaces" | "createWorkspace" | "listProviders" | "getStatus",
 *   "params": { ... }
 * }
 */
export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const body = (await request.json()) as {
    action: string;
    params?: Record<string, unknown>;
  };

  if (!body.action) {
    return NextResponse.json(
      { success: false, error: { message: '缺少 action 参数', code: 'MISSING_ACTION' } },
      { status: 400 },
    );
  }

  try {
    switch (body.action) {
      case 'listWorkspaces': {
        const workspaces = await prisma.workspace.findMany({
          select: { id: true, name: true, description: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json({ success: true, data: workspaces });
      }

      case 'createWorkspace': {
        const { name, description } = (body.params || {}) as {
          name?: string;
          description?: string;
        };
        if (!name) {
          return NextResponse.json(
            { success: false, error: { message: '缺少工作区名称', code: 'MISSING_NAME' } },
            { status: 400 },
          );
        }
        const workspace = await prisma.workspace.create({
          data: { name, description: description || '' },
        });
        return NextResponse.json({ success: true, data: workspace });
      }

      case 'listProviders': {
        const providers = await prisma.provider.findMany({
          select: { id: true, name: true, enabled: true, providerType: true },
          orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json({ success: true, data: providers });
      }

      case 'getStatus': {
        const [userCount, workspaceCount, providerCount] = await Promise.all([
          prisma.user.count(),
          prisma.workspace.count(),
          prisma.provider.count(),
        ]);
        return NextResponse.json({
          success: true,
          data: {
            status: 'healthy',
            uptime: process.uptime(),
            users: userCount,
            workspaces: workspaceCount,
            providers: providerCount,
            nodeVersion: process.version,
          },
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: { message: `未知操作: ${body.action}`, code: 'UNKNOWN_ACTION' } },
          { status: 400 },
        );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: { message, code: 'SYSTEM_ERROR' } },
      { status: 500 },
    );
  }
}