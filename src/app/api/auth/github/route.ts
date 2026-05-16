import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/log';
import { getGitHubAuthUrl } from '@/lib/auth/github';

/**
 * GET /api/auth/github
 * 获取 GitHub OAuth 授权 URL（未配置时返回不可用状态）
 */
export const GET = withApiLogging('GET auth/github', function GET()  {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({
      success: false,
      error: { message: 'GitHub OAuth 未配置', code: 'GITHUB_NOT_CONFIGURED' },
    });
  }

  const url = getGitHubAuthUrl();
  return NextResponse.json({ success: true, data: { url } });
});