import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/log';
import { isGitHubAppEnabled, getGitHubAppConfig } from '@/lib/auth/github-app-config';
import { getGitHubAppAuthUrl } from '@/lib/auth/github';

/**
 * GET /api/auth/github-app/authorize
 * 发起 GitHub App 授权
 */
export const GET = withApiLogging('GET auth/github-app/authorize', function GET()  {
  if (!isGitHubAppEnabled()) {
    return NextResponse.json({
      success: false,
      error: { message: 'GitHub App 未启用', code: 'GITHUB_APP_NOT_ENABLED' },
    });
  }

  const config = getGitHubAppConfig();
  if (!config) {
    return NextResponse.json({
      success: false,
      error: { message: 'GitHub App 配置不完整', code: 'GITHUB_APP_NOT_CONFIGURED' },
    });
  }

  try {
    const url = getGitHubAppAuthUrl();
    return NextResponse.json({ success: true, data: { url } });
  } catch (err) {
    const message = err instanceof Error ? err.message : '生成授权 URL 失败';
    return NextResponse.json({
      success: false,
      error: { message, code: 'GITHUB_APP_AUTH_URL_ERROR' },
    });
  }
});
