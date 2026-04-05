import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 公开路径，不需要登录认证
const publicPaths = ['/', '/login', '/demo'];

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // 检查登录状态：优先检查 cookie，其次检查 sessionStorage（通过客户端传递的 header）
  const userIdFromCookie = request.cookies.get('userId')?.value;
  const userIdFromHeader = request.headers.get('x-user-id');
  const isLoggedIn = !!userIdFromCookie || !!userIdFromHeader;

  // 公开路径直接放行
  if (publicPaths.some((path) => pathname === path || pathname.startsWith('/api/'))) {
    // 已登录用户访问登录页，重定向到工作台
    if (isLoggedIn && pathname === '/login') {
      const workplaceUrl = new URL('/workplace', request.url);
      return NextResponse.redirect(workplaceUrl);
    }
    return NextResponse.next();
  }

  // 受保护路径：未登录用户重定向到登录页
  if (!isLoggedIn) {
    const loginUrl = new URL('/login', request.url);
    // 保留原始路径，登录后可重定向回来
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// 配置中间件匹配的路径
export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - api 路由（已在逻辑中处理）
     * - 静态文件（_next/static, _next/image, favicon.ico 等）
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
};
