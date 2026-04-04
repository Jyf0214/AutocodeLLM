import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { username: string; password: string };
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: { message: '用户名和密码不能为空', code: 'MISSING_FIELDS' } },
        { status: 400 },
      );
    }

    const passwordHash = createHash('sha256').update(password).digest('hex');

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: '用户名或密码错误', code: 'INVALID_CREDENTIALS' } },
        { status: 401 },
      );
    }

    if (user.passwordHash !== passwordHash) {
      return NextResponse.json(
        { success: false, error: { message: '用户名或密码错误', code: 'INVALID_CREDENTIALS' } },
        { status: 401 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        username: user.username,
        forceChangePassword: user.forceChangePassword,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: '登录失败', code: 'LOGIN_ERROR' } },
      { status: 500 },
    );
  }
}
