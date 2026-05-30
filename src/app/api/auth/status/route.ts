import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/log';
import { getAuthConfig } from '@/lib/auth/config';
import { getSession } from '@/lib/auth';

// 惰性获取 Prisma（动态 import 避免模块加载时实例化，构建阶段不会因 DATABASE_URL 未设置而崩溃）
async function getPrisma() {
  const { prisma } = await import('@/lib/db/prisma');
  return prisma;
}

/**
 * GET /api/auth/status
 * 获取认证状态，包括可用的认证方式和当前登录用户
 */
export const GET = withApiLogging('GET auth/status', async function GET() {
  try {
    const config = getAuthConfig();
    
    // 获取当前会话
    const session = await getSession();
    
    let user: {
      id: string;
      username: string;
      role: string;
      githubId: string | null;
    } | null = null;
    if (session?.userId) {
    const db = await getPrisma();
      const dbUser = await db.user.findUnique({
        where: { id: session.userId },
        select: {
          id: true,
          username: true,
          role: true,
          githubId: true,
        },
      });

      if (dbUser) {
        user = dbUser;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        availableMethods: config.availableMethods,
        user,
      },
    });
  } catch (err) {
    console.error('[Auth/Status] 获取认证状态失败:', err);
    return NextResponse.json(
      { success: false, error: { message: '获取认证状态失败' } },
      { status: 500 },
    );
  }
});
