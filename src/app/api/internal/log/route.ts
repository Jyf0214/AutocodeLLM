import { NextResponse } from 'next/server';
import { logRequest } from '@/lib/log';

/**
 * POST /api/internal/log
 * 内部端点，用于 middleware 记录请求日志
 * 此端点不需要认证，仅由 middleware 调用
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { method: reqMethod, path, statusCode, duration, ip } = body;

    if (!reqMethod || !path || statusCode == null || duration == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await logRequest({
      method: reqMethod,
      path,
      statusCode,
      duration,
      ip: ip ?? undefined,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to log request' }, { status: 500 });
  }
}
