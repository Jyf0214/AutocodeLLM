import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/log';
import { compareSync, hashSync } from 'bcryptjs';
import { createHash } from 'node:crypto';
import { requireAuth } from '@/lib/auth';
import { getPrisma } from '@/lib/db/get-prisma';


/**
 * GET /api/account
 * 返回当前用户信息（包含 forceChangePassword 和 isInitialPassword 标志）
 */
export const GET = withApiLogging('GET account', async function GET(request: Request) {
  try {
    // 使用 requireAuth 获取当前登录用户身份（替代 x-user-id 自声明模式）
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    const userId = auth.session.userId;

    const db = await getPrisma();
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        forceChangePassword: true,
        isInitialPassword: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: '用户不存在', code: 'USER_NOT_FOUND' } },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (err) {
    console.error('[Account] fetch user error:', err);
    return NextResponse.json(
      { success: false, error: { message: '获取用户信息失败', code: 'FETCH_USER_ERROR' } },
      { status: 500 },
    );
  }
});

/**
 * PUT /api/account
 * 更新密码和标志（标志只能设为 false）
 */
export const PUT = withApiLogging('PUT account', async function PUT(request: Request) {
  try {
    // 使用 requireAuth 获取当前登录用户身份（替代 x-user-id 自声明模式）
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    const userId = auth.session.userId;

    const body = (await request.json()) as {
      oldPassword?: string;
      newPassword?: string;
      forceChangePassword?: boolean;
      isInitialPassword?: boolean;
    };

    const db = await getPrisma();
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: '用户不存在', code: 'USER_NOT_FOUND' } },
        { status: 404 },
      );
    }

    const updateData: {
      passwordHash?: string;
      forceChangePassword?: boolean;
      isInitialPassword?: boolean;
    } = {};

    // 处理密码修改（使用 bcrypt 验证旧密码）
    if (body.newPassword) {
      if (!body.oldPassword) {
        return NextResponse.json(
          { success: false, error: { message: '修改密码需要提供旧密码', code: 'MISSING_OLD_PASSWORD' } },
          { status: 400 },
        );
      }

      if (!compareSync(body.oldPassword, user.passwordHash)) {
        // 向后兼容：检查是否为旧版 SHA-256 无盐哈希
        const sha256Hash = createHash('sha256').update(body.oldPassword).digest('hex');
        if (sha256Hash === user.passwordHash) {
          // 旧版哈希匹配，升级为 bcrypt 哈希
          const newHash = hashSync(body.oldPassword, 10);
          await db.user.update({
            where: { id: userId },
            data: { passwordHash: newHash },
          });
          // 继续密码修改流程（不报错）
        } else {
          return NextResponse.json(
            { success: false, error: { message: '旧密码不正确', code: 'INCORRECT_OLD_PASSWORD' } },
            { status: 400 },
          );
        }
      }

      if (body.newPassword.length < 8) {
        return NextResponse.json(
          { success: false, error: { message: '密码长度至少为 8 位', code: 'PASSWORD_TOO_SHORT' } },
          { status: 400 },
        );
      }

      updateData.passwordHash = hashSync(body.newPassword, 10);
    }

    // 处理标志更新（只能设为 false）
    if (body.forceChangePassword !== undefined) {
      if (body.forceChangePassword) {
        return NextResponse.json(
          { success: false, error: { message: '不允许将 forceChangePassword 设为 true', code: 'INVALID_FLAG_VALUE' } },
          { status: 400 },
        );
      }
      updateData.forceChangePassword = false;
    }

    if (body.isInitialPassword !== undefined) {
      if (body.isInitialPassword) {
        return NextResponse.json(
          { success: false, error: { message: '不允许将 isInitialPassword 设为 true', code: 'INVALID_FLAG_VALUE' } },
          { status: 400 },
        );
      }
      updateData.isInitialPassword = false;
    }

    // 如果没有需要更新的数据
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: { message: '没有需要更新的数据', code: 'NO_UPDATE_DATA' } },
        { status: 400 },
      );
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        forceChangePassword: true,
        isInitialPassword: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (err) {
    console.error('[Account] update user error:', err);
    return NextResponse.json(
      { success: false, error: { message: '更新用户信息失败', code: 'UPDATE_USER_ERROR' } },
      { status: 500 },
    );
  }
});
