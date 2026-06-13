import { successResponse, errorResponse } from '@/lib/api/response';
import { withApiLogging } from '@/lib/log';
import { getAuthConfig } from '@/lib/auth/config';
import { getSession } from '@/lib/auth';
import { getPrisma } from '@/lib/db/get-prisma';


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

    return successResponse({
      availableMethods: config.availableMethods,
      user,
    });
  } catch (err) {
    console.error('[Auth/Status] 获取认证状态失败:', err);
    return errorResponse('获取认证状态失败', 'AUTH_STATUS_ERROR', 500);
  }
});
