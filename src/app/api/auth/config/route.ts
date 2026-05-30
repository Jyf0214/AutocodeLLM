/**
 * 认证配置 API 路由
 * 返回当前启用的认证方式
 */
import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/log';

/**
 * GET /api/auth/config
 * 获取认证配置
 */
export const GET = withApiLogging('GET auth/config', function GET()  {
  return NextResponse.json({
    providers: {
      password: true,
      verificationCode: true,
    },
  });
});
