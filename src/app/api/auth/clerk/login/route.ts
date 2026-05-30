/**
 * Clerk 登录 API 路由
 * 验证 Clerk session token 并设置本地认证 cookie
 */
import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/log';
import { clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { isClerkEnabled } from '@/lib/auth/clerk-config';
import { createHash, randomBytes } from 'node:crypto';

/**
 * POST /api/auth/clerk/login
 * 验证 Clerk session 并登录用户
 */
export const POST = withApiLogging('POST auth/clerk/login', async function POST(req: NextRequest) {
  // 检查 Clerk 是否启用
  if (!isClerkEnabled()) {
    return NextResponse.json(
      { 
        success: false, 
        error: { message: 'Clerk authentication is not enabled', code: 'CLERK_DISABLED' } 
      },
      { status: 403 }
    );
  }

  try {
    // 从请求头获取 session token
    const authHeader = req.headers.get('Authorization');
    let sessionToken: string | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      sessionToken = authHeader.substring(7);
    }

    // 也可以从 cookie 中获取
    if (!sessionToken) {
      const sessionCookie = req.cookies.get('__session');
      if (sessionCookie) {
        sessionToken = sessionCookie.value;
      }
    }

    if (!sessionToken) {
      return NextResponse.json(
        { 
          success: false, 
          error: { message: 'No session token provided', code: 'NO_SESSION' } 
        },
        { status: 401 }
      );
    }

    // 验证 Clerk session
    const client = await clerkClient();
    let session;
    
    try {
      // 使用 Clerk SDK 验证 session
      const sessions = await client.sessions.getSession(sessionToken);
      session = sessions;
    } catch (err) {
      console.error('[Clerk/Login] Session 验证失败:', err);
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Invalid session token', code: 'INVALID_SESSION' }
        },
        { status: 401 }
      );
    }

    if (session?.status !== 'active') {
      return NextResponse.json(
        { 
          success: false, 
          error: { message: 'Session is not active', code: 'SESSION_INACTIVE' } 
        },
        { status: 401 }
      );
    }

    // 获取用户信息
    const userId = session.userId;
    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: { message: 'User ID not found in session', code: 'NO_USER_ID' } 
        },
        { status: 401 }
      );
    }

    const clerkUser = await client.users.getUser(userId);

    const email = clerkUser.emailAddresses[0]?.emailAddress ?? '';
    const username = clerkUser.username ?? email.split('@')[0] ?? clerkUser.id;

    // 查找或创建本地用户
    let user = await prisma.user.findUnique({
      where: { id: clerkUser.id },
    });

    if (!user) {
      // 用户不存在，创建新用户
      const salt = randomBytes(16).toString('hex');
      const placeholderHash = createHash('sha256')
        .update(`${clerkUser.id}:${salt}`)
        .digest('hex');

      user = await prisma.user.create({
        data: {
          id: clerkUser.id,
          username,
          passwordHash: `${salt}:${placeholderHash}`,
          role: 'user',
          forceChangePassword: false,
          isInitialPassword: false,
        },
      });
      
      console.log('[Clerk Login] 新用户已创建:', username, clerkUser.id);
    }

    // 返回成功响应并设置 cookie
    const response = NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        username: user.username,
        role: user.role || 'user',
        forceChangePassword: user.forceChangePassword,
      },
    });

    // 设置认证 cookie（与现有登录 API 保持一致）
    response.cookies.set('userId', user.id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[Clerk Login] 登录失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { message: 'Login failed', code: 'LOGIN_ERROR' } 
      },
      { status: 500 }
    );
  }
});
