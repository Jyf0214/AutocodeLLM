/**
 * 系统日志模块
 * 内存环形缓冲区，支持后端日志和请求日志
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  source: 'backend' | 'request' | 'function';
  message: string;
  path?: string;       // 请求路径
  method?: string;     // HTTP 方法
  statusCode?: number; // HTTP 状态码
  duration?: number;   // 请求耗时(ms)
  userId?: string;
  ip?: string;
}

const MAX_LOGS = 10000;
const logs: LogEntry[] = [];
let logCounter = 0;

function createEntry(
  level: LogLevel,
  source: LogEntry['source'],
  message: string,
  extra?: Partial<LogEntry>,
): LogEntry {
  const entry: LogEntry = {
    id: `${Date.now()}-${++logCounter}`,
    timestamp: Date.now(),
    level,
    source,
    message,
    ...extra,
  };

  logs.push(entry);
  if (logs.length > MAX_LOGS) {
    logs.splice(0, logs.length - MAX_LOGS);
  }

  return entry;
}

// ============================================================
// 后端日志
// ============================================================

export const logger = {
  debug(msg: string, extra?: Partial<LogEntry>) {
    createEntry('debug', 'backend', msg, extra);
  },
  info(msg: string, extra?: Partial<LogEntry>) {
    createEntry('info', 'backend', msg, extra);
  },
  warn(msg: string, extra?: Partial<LogEntry>) {
    createEntry('warn', 'backend', msg, extra);
  },
  error(msg: string, extra?: Partial<LogEntry>) {
    createEntry('error', 'backend', msg, extra);
  },
};

// ============================================================
// 请求日志（用于中间件）
// ============================================================

export function logRequest(entry: {
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

  createEntry(level, 'request', `${entry.method} ${entry.path} → ${entry.statusCode} (${entry.duration}ms)`, entry);
}

// ============================================================
// 函数调用日志
// ============================================================

export function logFunction(name: string, result: { success: boolean; message?: string; duration?: number }) {
  const level = result.success ? 'info' : 'error';
  createEntry(level, 'function', `[${name}] ${result.message || (result.success ? '成功' : '失败')}`, {
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

export function queryLogs(query: LogQuery = {}): { total: number; entries: LogEntry[] } {
  let filtered = [...logs];

  if (query.level) {
    filtered = filtered.filter((l) => l.level === query.level);
  }
  if (query.source) {
    filtered = filtered.filter((l) => l.source === query.source);
  }
  if (query.path) {
    filtered = filtered.filter((l) => l.path?.includes(query.path!));
  }
  if (query.statusCode !== undefined) {
    filtered = filtered.filter((l) => l.statusCode === query.statusCode);
  }

  filtered.sort((a, b) => b.timestamp - a.timestamp);

  const total = filtered.length;
  const offset = query.offset || 0;
  const limit = query.limit || 200;

  return {
    total,
    entries: filtered.slice(offset, offset + limit),
  };
}

export function getLogStats() {
  const now = Date.now();
  const last5min = logs.filter((l) => l.timestamp > now - 5 * 60 * 1000);
  const last1hour = logs.filter((l) => l.timestamp > now - 60 * 60 * 1000);

  return {
    total: logs.length,
    last5min: last5min.length,
    last1hour: last1hour.length,
    errors: logs.filter((l) => l.level === 'error').length,
    warnings: logs.filter((l) => l.level === 'warn').length,
  };
}