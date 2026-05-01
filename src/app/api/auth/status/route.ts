import { NextResponse } from 'next/server';
import { getAuthConfig } from '@/lib/auth/config';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/auth/status
 * 获取认证状态，包括可用的认证方式和当前登录用户
 */
export async function GET() {
  try {
    const config = getAuthConfig();
    
    // 获取当前会话
    const session = await getSession();
    
    let user = null;
    if (session?.userId) {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.userId },
        select: {
          id: true,
          username: true,
          role: true,
          githubId: true,
          clerkId: true,
        },
      });
      
      if (dbUser) {
        user = {
          id: dbUser.id,
          username: dbUser.username,
          role: dbUser.role || 'user',
          githubId: dbUser.githubId,
          clerkId: dbUser.clerkId,
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        availableMethods: config.availableMethods,
        user,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { message: '获取认证状态失败' } },
      { status: 500 },
    );
  }
}
