import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/log';

export const POST = withApiLogging('POST auth/logout', function POST() {
  try {
    const response = NextResponse.json({ success: true });

    // 清除 userId cookie（与登录时同名、同 path，maxAge=0 立即失效）
    response.cookies.set('userId', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('[Logout] logout error:', err);
    return NextResponse.json(
      { success: false, error: { message: '登出失败', code: 'LOGOUT_ERROR' } },
      { status: 500 },
    );
  }
});
