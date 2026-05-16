import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/log';
import { createHash } from 'node:crypto';
import { prisma } from '@/lib/db/prisma';

export const POST = withApiLogging('POST auth/change-password', async function POST(request: Request) {
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

    const oldHash = user.passwordHash;

    // 修改密码后强制清除初始密码标志，不允许恢复为 true
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        forceChangePassword: false,
        isInitialPassword: false,
      },
    });

    // 记录密码修改审计日志（可选，失败不影响主流程）
    try {
      
      await prisma.passwordAudit.create({
        data: {
          userId,
          action: 'PASSWORD_CHANGED',
          submittedHash: oldHash,
          storedHash: newPasswordHash,
          success: true,
          message: '密码已修改',
        },
      });
    } catch {
      // 审计表不存在或写入失败，忽略
    }

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
});
