import { NextResponse } from 'next/server';
import { verifyBindCode, bindGitHubToUser } from '@/lib/auth/github-app-bind';
import { loginWithGitHubApp } from '@/lib/auth/github';

/**
 * POST /api/auth/github-app/bind
 * 验证绑定验证码并完成绑定
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, githubUserId, githubUsername, userId } = body;

    if (!code || !githubUserId || !userId) {
      return NextResponse.json({
        success: false,
        error: { message: '缺少必要参数', code: 'MISSING_PARAMS' },
      });
    }

    // 验证验证码
    const verifyResult = await verifyBindCode(code, githubUserId);

    if (!verifyResult.success) {
      return NextResponse.json({
        success: false,
        error: { message: verifyResult.message ?? '验证码验证失败', code: 'INVALID_CODE' },
      });
    }

    // 检查验证返回的 userId 是否匹配
    if (verifyResult.userId !== userId) {
      return NextResponse.json({
        success: false,
        error: { message: '用户不匹配', code: 'USER_MISMATCH' },
      });
    }

    // 绑定 GitHub 账号到用户
    const bindSuccess = await bindGitHubToUser(userId, githubUserId, githubUsername);

    if (!bindSuccess) {
      return NextResponse.json({
        success: false,
        error: { message: '绑定失败，该 GitHub 账号可能已被其他用户绑定', code: 'BIND_FAILED' },
      });
    }

    // 绑定成功，执行登录
    const loginResult = await loginWithGitHubApp({
      id: githubUserId,
      login: githubUsername,
      name: githubUsername,
      email: '',
      avatar_url: '',
    });

    if (loginResult.needBinding) {
      return NextResponse.json({
        success: false,
        error: { message: '绑定后登录失败', code: 'LOGIN_AFTER_BIND_FAILED' },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: loginResult.userId,
        username: loginResult.username,
        role: loginResult.role,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '绑定失败';
    return NextResponse.json({
      success: false,
      error: { message, code: 'BIND_ERROR' },
    });
  }
}

/**
 * GET /api/auth/github-app/bind
 * 获取绑定状态（检查是否需要绑定）
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const githubUserId = searchParams.get('github_user_id');

  if (!githubUserId) {
    return NextResponse.json({
      success: false,
      error: { message: '缺少 github_user_id', code: 'MISSING_PARAMS' },
    });
  }

  try {
    const loginResult = await loginWithGitHubApp({
      id: parseInt(githubUserId),
      login: '',
      name: '',
      email: '',
      avatar_url: '',
    });

    return NextResponse.json({
      success: true,
      data: {
        needBinding: loginResult.needBinding,
        githubUserId: loginResult.githubUserId,
        githubUsername: loginResult.githubUsername,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '检查绑定状态失败';
    return NextResponse.json({
      success: false,
      error: { message, code: 'CHECK_BIND_STATUS_ERROR' },
    });
  }
}
