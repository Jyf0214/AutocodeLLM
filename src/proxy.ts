import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logger, logRequest } from '@/lib/log';

// 启动种子日志（仅执行一次）
let seeded = false;
function seedLogs() {
  if (seeded) return;
  seeded = true;
  logger.info('AutocodeLLM 服务已启动');
  logger.info(`Node.js ${process.version}，环境: ${process.env.NODE_ENV || 'development'}`);
}

seedLogs();

/**
 * 公开路径配置
 * 这些路径不需要登录认证即可访问
 */
const PUBLIC_PATHS = ['/', '/login'] as const;

/**
 * API 路径前缀
 * API 端点统一通过逻辑处理，不在此拦截
 */
const API_PREFIX = '/api/';

/**
 * 代理函数（原 middleware，Next.js 16 重命名为 proxy）
 * 负责认证检查和路由守卫
 *
 * @param request - 请求对象
 * @returns 重定向或放行
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const start = Date.now();

  // 跳过静态资源和内部请求的日志记录
  const shouldLog =
    !pathname.startsWith('/_next') &&
    !pathname.startsWith('/favicon') &&
    !pathname.startsWith('/api/logs') &&
    !pathname.match(/\.(js|css|png|jpg|svg|ico|woff2?|map)$/);

  // API 请求直接放行，由具体 API 路由处理认证
  if (pathname.startsWith(API_PREFIX)) {
    return NextResponse.next();
  }

  // 公开路径直接放行
  if (PUBLIC_PATHS.some((path) => pathname === path)) {
    return NextResponse.next();
  }

  // 检查登录状态：优先检查 cookie，其次检查 header
  const userIdFromCookie = request.cookies.get('userId')?.value;
  const userIdFromHeader = request.headers.get('x-user-id');
  const isLoggedIn = !!userIdFromCookie || !!userIdFromHeader;

  // 已登录用户访问登录页，重定向到项目
  if (isLoggedIn && pathname === '/login') {
    const projectUrl = new URL('/project', request.url);
    return NextResponse.redirect(projectUrl);
  }

  // 受保护路径：未登录用户重定向到登录页
  if (!isLoggedIn) {
    const loginUrl = new URL('/login', request.url);
    // 保留原始路径，登录后可重定向回来
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 记录请求日志
  if (shouldLog) {
    try {
      logRequest({
        method: request.method,
        path: pathname,
        statusCode: 200,
        duration: Date.now() - start,
        ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined,
      });
    } catch {
      // 日志记录失败不影响主流程
    }
  }

  return NextResponse.next();
}

/**
 * 中间件配置
 * 匹配所有路径，排除静态资源和特殊文件
 */
export const config = {
  matcher: [
    /*
     * 匹配规则：
     * - 所有动态路由和页面
     * - 排除：_next/static, _next/image, favicon.ico, 文件扩展名
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
};