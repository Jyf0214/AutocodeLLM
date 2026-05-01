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
 * 全局请求日志中间件
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const start = Date.now();

  // 跳过静态资源和内部请求
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/api/logs') ||
    pathname.match(/\.(js|css|png|jpg|svg|ico|woff2?|map)$/)
  ) {
    return NextResponse.next();
  }

  try {
    const response = NextResponse.next();

    // 记录请求
    logRequest({
      method: request.method,
      path: pathname,
      statusCode: response.status,
      duration: Date.now() - start,
      ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined,
    });

    return response;
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};