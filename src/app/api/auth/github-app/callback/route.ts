import { NextResponse } from 'next/server';
import {
  getGitHubAppAccessToken,
  getGitHubUser,
  loginWithGitHubApp,
} from '@/lib/auth/github';
import { createBindVerification, bindGitHubToUser } from '@/lib/auth/github-app-bind';

/**
 * GET /api/auth/github-app/callback
 * GitHub App OAuth 回调处理
 * 重要：必须绑定已有账户，不自动创建新账户
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error)}`, request.url),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/login?error=missing_code', request.url),
    );
  }

  try {
    const token = await getGitHubAppAccessToken(code);
    const githubUser = await getGitHubUser(token);
    const result = await loginWithGitHubApp(githubUser);

    if (result.needBinding) {
      // 需要绑定已有账户，生成验证码
      // 这里需要先让用户登录已有账户，然后绑定
      // 将 GitHub 信息存储在 session/cookie 中，重定向到绑定页面
      const bindToken = Buffer.from(
        JSON.stringify({
          githubUserId: result.githubUserId,
          githubUsername: result.githubUsername,
          timestamp: Date.now(),
        })
      ).toString('base64');

      return NextResponse.redirect(
        new URL(`/login?bind_github=true&bind_token=${bindToken}`, request.url),
      );
    }

    // 已绑定，直接登录
    const response = NextResponse.redirect(new URL('/project', request.url));

    response.cookies.set('userId', result.userId!, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'GitHub App 登录失败';
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, request.url),
    );
  }
}
