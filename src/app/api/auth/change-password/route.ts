import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/log';
import { hashSync } from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth';

export const POST = withApiLogging('POST auth/change-password', async function POST(request: Request) {
  try {
    // 使用 requireAuth 获取当前登录用户身份，不从请求体读取 userId
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    const body = (await request.json()) as { newPassword: string };
    const { newPassword } = body;
    const userId = auth.session.userId;

    if (!newPassword) {
      return NextResponse.json(
        { success: false, error: { message: '新密码不能为空', code: 'MISSING_FIELDS' } },
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

    // 使用 bcrypt 哈希新密码（替代原来的 SHA-256 无盐哈希）
    const newPasswordHash = hashSync(newPassword, 10);

    // 修改密码后强制清除初始密码标志，不允许恢复为 true
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        forceChangePassword: false,
        isInitialPassword: false,
      },
    });

    // 记录密码修改审计日志（仅记录 userId/action/success/message，不记录哈希值）
    try {
      await prisma.passwordAudit.create({
        data: {
          userId,
          action: 'PASSWORD_CHANGED',
          success: true,
          message: '密码已修改',
        },
      });
    } catch (err) {
      console.error('[Audit] password audit failed:', err);
    }

    return NextResponse.json({
      success: true,
      data: { message: '密码修改成功' },
    });
  } catch (err) {
    console.error('[ChangePassword] change password error:', err);
    return NextResponse.json(
      { success: false, error: { message: '密码修改失败', code: 'CHANGE_PASSWORD_ERROR' } },
      { status: 500 },
    );
  }
});
