import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { prisma } from '@/lib/db/prisma';

// 内存存储验证码（与 verification-code route 共享）
const verificationCodes = new Map<string, { code: string; expiresAt: number }>();

export async function POST(request: Request) {
  try {
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

    const user = await prisma.user.findUnique({
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

      const passwordHash = createHash('sha256').update(password).digest('hex');

      if (user.passwordHash !== passwordHash) {
        // 记录登录失败 - 密码错误（可选）
        try {
          
          await prisma.passwordAudit.create({
          data: {
            userId: user.id,
            action: 'LOGIN_FAILED',
            submittedHash: passwordHash,
            storedHash: user.passwordHash,
            success: false,
            message: '密码错误',
          },
        });
        } catch {
          // 审计表不存在，忽略
        }

        return NextResponse.json(
          { success: false, error: { message: '密码错误', code: 'INVALID_CREDENTIALS' } },
          { status: 401 },
        );
      }

      // 记录登录成功（可选）
      try {
        
        await prisma.passwordAudit.create({
        data: {
          userId: user.id,
          action: 'LOGIN_SUCCESS',
          submittedHash: passwordHash,
          storedHash: user.passwordHash,
          success: true,
          message: '登录成功',
        },
      });
      } catch {
        // 审计表不存在，忽略
      }
    }

    const response = NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        username: user.username,
        forceChangePassword: user.forceChangePassword,
      },
    });

    // 设置认证 cookie（httponly 增强安全性）
    response.cookies.set('userId', user.id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: { message: '登录失败', code: 'LOGIN_ERROR' } },
      { status: 500 },
    );
  }
}

// 导出验证码存储供 verification-code route 使用
export { verificationCodes };
