/**
 * 系统日志模块
 * 使用 Prisma 持久化存储，支持后端日志和请求日志
 */

import { prisma } from '@/lib/db/prisma';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  source: 'backend' | 'request' | 'function';
  message: string;
  path?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  userId?: string;
  ip?: string;
}

async function createEntry(
  level: LogLevel,
  source: LogEntry['source'],
  message: string,
  extra?: Partial<LogEntry>,
): Promise<LogEntry> {
  try {
    const record = await prisma.systemLog.create({
      data: {
        level,
        message,
        source,
        path: extra?.path ?? null,
        method: extra?.method ?? null,
        statusCode: extra?.statusCode ?? null,
        duration: extra?.duration ?? null,
        userId: extra?.userId ?? null,
        ip: extra?.ip ?? null,
        metadata: extra ? JSON.stringify(Object.fromEntries(
          Object.entries(extra).filter(([k]) =>
            !['path', 'method', 'statusCode', 'duration', 'userId', 'ip'].includes(k)
          )
        )) : null,
      },
    });

    return {
      id: record.id,
      timestamp: record.createdAt.getTime(),
      level: record.level as LogLevel,
      source: record.source as LogEntry['source'],
      message: record.message,
      path: record.path ?? undefined,
      method: record.method ?? undefined,
      statusCode: record.statusCode ?? undefined,
      duration: record.duration ?? undefined,
      userId: record.userId ?? undefined,
      ip: record.ip ?? undefined,
    };
  } catch {
    // 数据库不可用时降级到控制台
    console[level](`[${source.toUpperCase()}] ${message}`, extra);
    return {
      id: `fallback-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      level,
      source,
      message,
      ...extra,
    };
  }
}

// ============================================================
// 后端日志
// ============================================================

export const logger = {
  async debug(msg: string, extra?: Partial<LogEntry>) {
    return createEntry('debug', 'backend', msg, extra);
  },
  async info(msg: string, extra?: Partial<LogEntry>) {
    return createEntry('info', 'backend', msg, extra);
  },
  async warn(msg: string, extra?: Partial<LogEntry>) {
    return createEntry('warn', 'backend', msg, extra);
  },
  async error(msg: string, extra?: Partial<LogEntry>) {
    return createEntry('error', 'backend', msg, extra);
  },
};

// ============================================================
// 请求日志（用于中间件）
// ============================================================

export async function logRequest(entry: {
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  userId?: string;
  ip?: string;
}) {
  const level: LogLevel =
    entry.statusCode >= 500 ? 'error' :
    entry.statusCode >= 400 ? 'warn' :
    'info';

  return createEntry(level, 'request', `${entry.method} ${entry.path} → ${entry.statusCode} (${entry.duration}ms)`, entry);
}

// ============================================================
// 函数调用日志
// ============================================================

export async function logFunction(name: string, result: { success: boolean; message?: string; duration?: number }) {
  const level = result.success ? 'info' : 'error';
  return createEntry(level, 'function', `[${name}] ${result.message || (result.success ? '成功' : '失败')}`, {
    duration: result.duration,
  });
}

// ============================================================
// 查询接口
// ============================================================

export interface LogQuery {
  level?: LogLevel;
  source?: LogEntry['source'];
  path?: string;
  statusCode?: number;
  limit?: number;
  offset?: number;
}

export async function queryLogs(query: LogQuery = {}): Promise<{ total: number; entries: LogEntry[] }> {
  const where: Record<string, unknown> = {};

  if (query.level) {
    where.level = query.level;
  }
  if (query.source) {
    where.source = query.source;
  }
  if (query.path) {
    where.path = { contains: query.path };
  }
  if (query.statusCode !== undefined) {
    where.statusCode = query.statusCode;
  }

  const limit = query.limit || 200;
  const offset = query.offset || 0;

  const [total, records] = await Promise.all([
    prisma.systemLog.count({ where }),
    prisma.systemLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    }),
  ]);

  const entries: LogEntry[] = records.map((r) => ({
    id: r.id,
    timestamp: r.createdAt.getTime(),
    level: r.level as LogLevel,
    source: r.source as LogEntry['source'],
    message: r.message,
    path: r.path ?? undefined,
    method: r.method ?? undefined,
    statusCode: r.statusCode ?? undefined,
    duration: r.duration ?? undefined,
    userId: r.userId ?? undefined,
    ip: r.ip ?? undefined,
  }));

  return { total, entries };
}

export async function getLogStats() {
  const now = new Date();
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const [total, last5min, last1hour, errors, warnings] = await Promise.all([
    prisma.systemLog.count(),
    prisma.systemLog.count({ where: { createdAt: { gte: fiveMinAgo } } }),
    prisma.systemLog.count({ where: { createdAt: { gte: oneHourAgo } } }),
    prisma.systemLog.count({ where: { level: 'error' } }),
    prisma.systemLog.count({ where: { level: 'warn' } }),
  ]);

  return {
    total,
    last5min,
    last1hour,
    errors,
    warnings,
  };
}
