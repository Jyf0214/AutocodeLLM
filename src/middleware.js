/* eslint-disable no-undef */
import { NextResponse } from 'next/server';

export async function middleware(request) {
  const start = Date.now();
  const { method, nextUrl } = request;

  const pathname = nextUrl.pathname;
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/api/logs') ||
    pathname.startsWith('/api/internal/log') ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js)$/)
  ) {
    return NextResponse.next();
  }

  const response = await NextResponse.next();

  const duration = Date.now() - start;
  const statusCode = response.status;

  // 异步发送日志到内部端点（不阻塞响应）
  const logUrl = new URL('/api/internal/log', request.url);
  fetch(logUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method,
      path: pathname,
      statusCode,
      duration,
      ip: request.ip ?? request.headers.get('x-forwarded-for') ?? null,
    }),
  }).catch(() => {});

  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
