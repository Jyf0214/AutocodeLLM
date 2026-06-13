import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/log';
import { compareSync, hashSync } from 'bcryptjs';
import { createHash } from 'node:crypto';
import { bindingCodes } from '@/lib/auth/verification-store';
import { getPrisma } from '@/lib/db/get-prisma';


/**
 * POST /api/auth/bind
 * 绑定第三方账号到已有用户
 * 
 * Body: {
 *   username: string;
 *   password: string;
 *   code: string; // 12位验证码
 *   targetType: 'github';
 *   targetId: string;
 * }
 */
export const POST = withApiLogging('POST auth/bind', async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, code, targetType, targetId } = body;

    // 验证必需参数
    if (!username || !password || !code || !targetType || !targetId) {
      return NextResponse.json(
        { success: false, error: { message: '缺少必需参数', code: 'MISSING_FIELDS' } },
        { status: 400 },
      );
    }

    // 验证目标类型
    if (!['github'].includes(targetType)) {
      return NextResponse.json(
        { success: false, error: { message: '无效的绑定类型', code: 'INVALID_TARGET_TYPE' } },
        { status: 400 },
      );
    }

    // 验证验证码格式（12位）
    if (!/^\d{12}$/.test(code)) {
      return NextResponse.json(
        { success: false, error: { message: '验证码必须是12位数字', code: 'INVALID_CODE_FORMAT' } },
        { status: 400 },
      );
    }

    // 验证验证码
    const stored = bindingCodes.get(username);
    
    if (!stored) {
      return NextResponse.json(
        { success: false, error: { message: '请先获取验证码', code: 'NO_CODE_REQUEST' } },
        { status: 401 },
      );
    }

    if (Date.now() > stored.expiresAt) {
      bindingCodes.delete(username);
      return NextResponse.json(
        { success: false, error: { message: '验证码已过期', code: 'CODE_EXPIRED' } },
        { status: 401 },
      );
    }

    if (stored.code !== code) {
      return NextResponse.json(
        { success: false, error: { message: '验证码错误', code: 'INVALID_CODE' } },
        { status: 401 },
      );
    }

    // 验证目标ID匹配
    if (stored.targetType !== targetType || stored.targetId !== targetId) {
      return NextResponse.json(
        { success: false, error: { message: '绑定信息不匹配', code: 'TARGET_MISMATCH' } },
        { status: 401 },
      );
    }

    // 查找用户并验证密码
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

    // 使用 bcrypt 验证密码（替代原来的 SHA-256 无盐哈希）
    if (!compareSync(password, user.passwordHash)) {
      // 向后兼容：检查是否为旧版 SHA-256 无盐哈希
      const sha256Hash = createHash('sha256').update(password).digest('hex');
      if (sha256Hash === user.passwordHash) {
        // 旧版哈希匹配，升级为 bcrypt 哈希
        const newHash = hashSync(password, 10);
        await db.user.update({
          where: { id: user.id },
          data: { passwordHash: newHash },
        });
        // 继续绑定流程（不报错）
      } else {
        return NextResponse.json(
          { success: false, error: { message: '密码错误', code: 'INVALID_CREDENTIALS' } },
          { status: 401 },
        );
      }
    }

    // 执行绑定
    const updateData: Record<string, unknown> = {};

    if (targetType === 'github') {
      // 检查该 GitHub ID 是否已被其他用户绑定
      const existingGithubUser = await db.user.findFirst({
        where: { githubId: targetId },
      });

      if (existingGithubUser && existingGithubUser.id !== user.id) {
        return NextResponse.json(
          { success: false, error: { message: '该 GitHub 账号已被其他用户绑定', code: 'GITHUB_ALREADY_BOUND' } },
          { status: 409 },
        );
      }

      updateData.githubId = targetId;
    }

    // 更新用户
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: updateData,
    });

    // 删除验证码
    bindingCodes.delete(username);

    // 返回新用户信息
    const response = NextResponse.json({
      success: true,
      data: {
        userId: updatedUser.id,
        username: updatedUser.username,
        role: updatedUser.role,
        githubId: updatedUser.githubId,
      },
    });

    // 设置认证 cookie（httpOnly 防止 XSS 窃取、sameSite strict 防止 CSRF）
    response.cookies.set('userId', updatedUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('绑定失败:', error);
    return NextResponse.json(
      { success: false, error: { message: '绑定失败', code: 'BIND_ERROR' } },
      { status: 500 },
    );
  }
});
