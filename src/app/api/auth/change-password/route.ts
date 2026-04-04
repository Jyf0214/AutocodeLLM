import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { userId: string; newPassword: string };
    const { userId, newPassword } = body;

    if (!userId || !newPassword) {
      return NextResponse.json(
        { success: false, error: { message: '用户 ID 和新密码不能为空', code: 'MISSING_FIELDS' } },
        { status: 400 },
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: { message: '密码长度至少为 8 位', code: 'PASSWORD_TOO_SHORT' } },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: '用户不存在', code: 'USER_NOT_FOUND' } },
        { status: 404 },
      );
    }

    const newPasswordHash = createHash('sha256').update(newPassword).digest('hex');

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        forceChangePassword: false,
        isInitialPassword: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: { message: '密码修改成功' },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: '密码修改失败', code: 'CHANGE_PASSWORD_ERROR' } },
      { status: 500 },
    );
  }
}
