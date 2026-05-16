/**
 * 认证配置 API 路由
 * 返回当前启用的认证方式
 */
import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/log';
import { isClerkEnabled } from '@/lib/auth/clerk-config';

/**
 * GET /api/auth/config
 * 获取认证配置
 */
export const GET = withApiLogging('GET auth/config', function GET()  {
  const clerkEnabled = isClerkEnabled();

  return NextResponse.json({
    clerkEnabled,
    providers: {
      password: true,
      verificationCode: true,
      clerk: clerkEnabled,
    },
  });
});
