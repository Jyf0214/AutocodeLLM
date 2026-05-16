/**
 * 认证配置 API 路由
 * 返回当前启用的认证方式
 */
import { NextResponse } from 'next/server';
import { isClerkEnabled } from '@/lib/auth/clerk-config';

/**
 * GET /api/auth/config
 * 获取认证配置
 */
export function GET() {
  const clerkEnabled = isClerkEnabled();

  return NextResponse.json({
    clerkEnabled,
    providers: {
      password: true,
      verificationCode: true,
      clerk: clerkEnabled,
    },
  });
}
