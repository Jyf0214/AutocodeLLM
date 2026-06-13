/**
 * 全局中间件 (Next.js 16 proxy)
 * - CSRF 保护: 对非 GET/HEAD/OPTIONS 请求验证 Origin 头
 * - 跳过公开路由: /api/auth/** 和 /api/state
 */
import { NextResponse, type NextRequest } from 'next/server';

// 跳过 CSRF 检查的路由前缀
const PUBLIC_ROUTES = ['/api/auth/', '/api/state'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 跳过公开路由
  for (const prefix of PUBLIC_ROUTES) {
    if (pathname.startsWith(prefix)) {
      return NextResponse.next();
    }
  }

  // 仅对可能修改数据的请求方法检查 CSRF
  const unsafeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!unsafeMethods.includes(request.method)) {
    return NextResponse.next();
  }

  // 验证 Origin 头, 防止跨站请求伪造 (CSRF)
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');

  if (origin && host) {
    try {
      const originUrl = new URL(origin);
      // 允许同源请求 (origin 与 host 匹配) 或 localhost 开发环境
      if (originUrl.host !== host && !originUrl.host.startsWith('localhost')) {
        console.warn(`[CSRF] 跨源请求被拒绝: origin=${origin}, host=${host}, path=${pathname}`);
        return new NextResponse(JSON.stringify({ error: 'CSRF 验证失败' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch {
      // Origin 格式无效, 拒绝请求
      console.warn(`[CSRF] 无效的 Origin 头: ${origin}, path=${pathname}`);
      return new NextResponse(JSON.stringify({ error: 'CSRF 验证失败' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } else if (origin === null && host) {
    // Origin 为 null 表示非浏览器发起的请求 (如 curl, fetch 无 mode)
    // 允许通过, 由下游路由自行验证认证信息
    // 注意: 生产环境中如仅允许浏览器请求, 可在此处拒绝
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
