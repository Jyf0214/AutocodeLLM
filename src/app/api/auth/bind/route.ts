import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { prisma } from '@/lib/db/prisma';

// 内存存储绑定验证码（12位）
// 与 verification-code route 共享
const bindingCodes = new Map<string, { code: string; expiresAt: number; targetType: string; targetId: string }>();

/**
 * POST /api/auth/bind
 * 绑定第三方账号到已有用户
 * 
 * Body: {
 *   username: string;
 *   password: string;
 *   code: string; // 12位验证码
 *   targetType: 'github' | 'clerk';
 *   targetId: string;
 * }
 */
export async function POST(request: Request) {
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
    if (!['github', 'clerk'].includes(targetType)) {
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
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: '用户不存在', code: 'USER_NOT_FOUND' } },
        { status: 401 },
      );
    }

    const passwordHash = createHash('sha256').update(password).digest('hex');
    
    if (user.passwordHash !== passwordHash) {
      return NextResponse.json(
        { success: false, error: { message: '密码错误', code: 'INVALID_CREDENTIALS' } },
        { status: 401 },
      );
    }

    // 执行绑定
    const updateData: Record<string, unknown> = {};
    
    if (targetType === 'github') {
      // 检查该 GitHub ID 是否已被其他用户绑定
      const existingGithubUser = await prisma.user.findFirst({
        where: { githubId: targetId },
      });
      
      if (existingGithubUser && existingGithubUser.id !== user.id) {
        return NextResponse.json(
          { success: false, error: { message: '该 GitHub 账号已被其他用户绑定', code: 'GITHUB_ALREADY_BOUND' } },
          { status: 409 },
        );
      }
      
      updateData.githubId = targetId;
    } else if (targetType === 'clerk') {
      // 检查该 Clerk ID 是否已被其他用户绑定
      const existingClerkUser = await prisma.user.findFirst({
        where: { clerkId: targetId },
      });
      
      if (existingClerkUser && existingClerkUser.id !== user.id) {
        return NextResponse.json(
          { success: false, error: { message: '该 Clerk 账号已被其他用户绑定', code: 'CLERK_ALREADY_BOUND' } },
          { status: 409 },
        );
      }
      
      updateData.clerkId = targetId;
    }

    // 更新用户
    const updatedUser = await prisma.user.update({
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
        role: updatedUser.role || 'user',
        githubId: updatedUser.githubId,
        clerkId: updatedUser.clerkId,
      },
    });

    // 设置认证 cookie
    response.cookies.set('userId', updatedUser.id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
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
}

// 导出供其他路由使用
export { bindingCodes };
