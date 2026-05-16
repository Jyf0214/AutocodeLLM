import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { queryLogsV2, getLogStats, clearLogs, withApiLogging, type LogLevel, type LogEntry } from '@/lib/log';

/**
 * GET /api/logs
 * 查询系统日志
 *
 * 查询参数：
 * - level: debug | info | warn | error
 * - source: backend | request | function
 * - search: 消息文本模糊搜索
 * - path: 路径过滤（模糊匹配）
 * - statusCode: HTTP 状态码
 * - limit: 返回条数（默认 200）
 * - offset: 偏移量
 */
export const GET = withApiLogging('GET /api/logs', async function GET(request: Request) {
  const auth = await requireAuth(request, 'admin');
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);

  const levelParam = searchParams.get('level');
  const sourceParam = searchParams.get('source');

  const entries = queryLogsV2({
    level: levelParam as LogLevel,
    source: sourceParam as LogEntry['source'],
    search: searchParams.get('search') ?? undefined,
    path: searchParams.get('path') ?? undefined,
    statusCode: searchParams.get('statusCode')
      ? parseInt(searchParams.get('statusCode') ?? '')
      : undefined,
    limit: searchParams.get('limit') ? parseInt(searchParams.get('limit') ?? '') : 200,
    offset: searchParams.get('offset') ? parseInt(searchParams.get('offset') ?? '') : 0,
  });

  return NextResponse.json({
    success: true,
    data: {
      entries: entries.entries,
      total: entries.total,
      stats: getLogStats(),
    },
  });
});

/**
 * DELETE /api/logs
 * 清空所有日志
 */
export const DELETE = withApiLogging('DELETE /api/logs', async function DELETE(request: Request) {
  const auth = await requireAuth(request, 'admin');
  if (auth.error) return auth.error;

  clearLogs();

  return NextResponse.json({ success: true });
});