import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/log';
import { getGitHubAccessToken, getGitHubUser, loginWithGitHub } from '@/lib/auth/github';

/**
 * GET /api/auth/github/callback
 * GitHub OAuth 回调处理
 */
export const GET = withApiLogging('GET auth/github/callback', async function GET(request: Request) {
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
    const token = await getGitHubAccessToken(code);
    const githubUser = await getGitHubUser(token);
    const result = await loginWithGitHub(githubUser);

    // 如果需要绑定已有账户
    if (result.needsBinding) {
      return NextResponse.redirect(
        new URL(`/login?binding=github&githubId=${result.githubId ?? ''}`, request.url),
      );
    }

    const response = NextResponse.redirect(new URL('/project', request.url));

    response.cookies.set('userId', result.userId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'GitHub 登录失败';
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, request.url),
    );
  }
});