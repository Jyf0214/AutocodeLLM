import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/log';
import { requireAuth } from '@/lib/auth';

// 惰性获取 Prisma（动态 import 避免模块加载时实例化，构建阶段不会因 DATABASE_URL 未设置而崩溃）
async function getPrisma() {
  const { prisma } = await import('@/lib/db/prisma');
  return prisma;
}

/**
 * POST /api/system/call
 * 系统调用 API — 使用 API Key 认证，调用内部功能
 *
 * 请求体：
 * {
 *   "action": "listProjects" | "createProject" | "listProviders" | "getStatus",
 *   "params": { ... }
 * }
 */
export const POST = withApiLogging('POST system/call', async function POST(request: Request) {
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
      case 'listProjects': {
    const db = await getPrisma();
        const projects = await db.project.findMany({
          select: { id: true, name: true, description: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json({ success: true, data: projects });
      }

      case 'createProject': {
        const { name, description } = (body.params ?? {}) as {
          name?: string;
          description?: string;
        };
        if (!name) {
          return NextResponse.json(
            { success: false, error: { message: '缺少项目名称', code: 'MISSING_NAME' } },
            { status: 400 },
          );
        }
        const project = await db.project.create({
          data: { name, description: description ?? '' },
        });
        return NextResponse.json({ success: true, data: project });
      }

      case 'listProviders': {
        const providers = await db.provider.findMany({
          select: { id: true, name: true, enabled: true, providerType: true },
          orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json({ success: true, data: providers });
      }

      case 'getStatus': {
        const [userCount, projectCount, providerCount] = await Promise.all([
          db.user.count(),
          db.project.count(),
          db.provider.count(),
        ]);
        return NextResponse.json({
          success: true,
          data: {
            status: 'healthy',
            uptime: process.uptime(),
            users: userCount,
            projects: projectCount,
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
});