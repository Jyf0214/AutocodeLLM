import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/log';
import { compareSync } from 'bcryptjs';
import { verificationCodes } from '@/lib/auth/verification-store';

// 惰性获取 Prisma（动态 import 避免模块加载时实例化，构建阶段不会因 DATABASE_URL 未设置而崩溃）
async function getPrisma() {
  const { prisma } = await import('@/lib/db/prisma');
  return prisma;
}

// 登录频率限制：Map<IP, { count: number; lastAttempt: number }>
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 10;          // 最大失败次数
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 分钟窗口（毫秒）
const CODE_CLEANUP_INTERVAL = 5 * 60 * 1000; // 验证码清理间隔（毫秒）

// 惰性启动定时器清理过期验证码（避免模块加载时创建定时器）
let cleanupTimerInitialized = false;
function lazyInitCleanupTimer() {
  if (cleanupTimerInitialized) return;
  cleanupTimerInitialized = true;
  setInterval(() => {
    const now = Date.now();
    for (const [key, stored] of verificationCodes) {
      if (now > stored.expiresAt) {
        verificationCodes.delete(key);
      }
    }
  }, CODE_CLEANUP_INTERVAL);
}

export const POST = withApiLogging('POST auth/login', async function POST(request: Request) {
  try {
    // 惰性启动清理定时器（避免模块加载时创建）
    lazyInitCleanupTimer();

    const body = (await request.json()) as {
      username: string;
      password?: string;
      verificationCode?: string;
      useVerificationCode?: boolean;
    };
    const { username, password, verificationCode, useVerificationCode } = body;

    if (!username) {
      return NextResponse.json(
        { success: false, error: { message: '用户名不能为空', code: 'MISSING_FIELDS' } },
        { status: 400 },
      );
    }

    // --- 登录频率限制（基于 IP） ---
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const now = Date.now();
    const record = loginAttempts.get(ip);

    if (record && now - record.lastAttempt < RATE_LIMIT_WINDOW) {
      if (record.count >= MAX_ATTEMPTS) {
        return NextResponse.json(
          { success: false, error: { message: '登录尝试过于频繁，请 5 分钟后再试', code: 'RATE_LIMITED' } },
          { status: 429 },
        );
      }
    } else if (record) {
      // 超出窗口期，重置计数
      loginAttempts.set(ip, { count: 0, lastAttempt: now });
    }

    // 验证码登录模式
    if (useVerificationCode) {
      if (!verificationCode) {
        return NextResponse.json(
          { success: false, error: { message: '请输入验证码', code: 'MISSING_CODE' } },
          { status: 400 },
        );
      }

      const stored = verificationCodes.get(username);

      if (!stored) {
        return NextResponse.json(
          { success: false, error: { message: '请先获取验证码', code: 'NO_CODE_REQUEST' } },
          { status: 401 },
        );
      }

      if (Date.now() > stored.expiresAt) {
        verificationCodes.delete(username);
        return NextResponse.json(
          { success: false, error: { message: '验证码已过期', code: 'CODE_EXPIRED' } },
          { status: 401 },
        );
      }

      if (stored.code !== verificationCode) {
        return NextResponse.json(
          { success: false, error: { message: '验证码错误', code: 'INVALID_CODE' } },
          { status: 401 },
        );
      }

      // 验证码验证通过，删除验证码
      verificationCodes.delete(username);
    }

    const db = await getPrisma();
    const user = await db.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: '用户不存在', code: 'USER_NOT_FOUND' } },
        { status: 401 },
      );
    }

    // 密码登录模式需要验证密码
    if (!useVerificationCode) {
      if (!password) {
        return NextResponse.json(
          { success: false, error: { message: '密码不能为空', code: 'MISSING_PASSWORD' } },
          { status: 400 },
        );
      }

      // 使用 bcrypt 验证密码（替代原来的 SHA-256 无盐哈希）
      if (!compareSync(password, user.passwordHash)) {
        // 记录失败次数
        const currentRecord = loginAttempts.get(ip);
        if (currentRecord) {
          currentRecord.count += 1;
        } else {
          loginAttempts.set(ip, { count: 1, lastAttempt: now });
        }

        // 记录审计日志（仅记录 userId/action/success/message，不记录哈希值）
        try {
          await db.passwordAudit.create({
            data: {
              userId: user.id,
              action: 'LOGIN_FAILED',
              success: false,
              message: '密码错误',
            },
          });
        } catch (err) {
          console.error('[Audit] password audit failed:', err);
        }

        return NextResponse.json(
          { success: false, error: { message: '密码错误', code: 'INVALID_CREDENTIALS' } },
          { status: 401 },
        );
      }

      // 记录登录成功（仅记录 userId/action/success/message，不记录哈希值）
      try {
        await db.passwordAudit.create({
          data: {
            userId: user.id,
            action: 'LOGIN_SUCCESS',
            success: true,
            message: '登录成功',
          },
        });
      } catch (err) {
        console.error('[Audit] password audit failed:', err);
      }
    }

    // 登录成功后重置该 IP 的失败计数
    loginAttempts.delete(ip);

    const response = NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        username: user.username,
        role: user.role || 'admin',
        forceChangePassword: user.forceChangePassword,
      },
    });

    // 设置认证 cookie（httpOnly 防止 XSS 窃取、sameSite strict 防止 CSRF）
    response.cookies.set('userId', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('[Login] login error:', err);
    return NextResponse.json(
      { success: false, error: { message: '登录失败', code: 'LOGIN_ERROR' } },
      { status: 500 },
    );
  }
});
