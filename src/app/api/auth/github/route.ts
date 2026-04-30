import { NextResponse } from 'next/server';
import { getGitHubAuthUrl } from '@/lib/auth/github';

/**
 * GET /api/auth/github
 * 获取 GitHub OAuth 授权 URL
 */
export async function GET() {
  const url = getGitHubAuthUrl();
  return NextResponse.json({ success: true, data: { url } });
}