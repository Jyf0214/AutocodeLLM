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
  path?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  userId?: string;
  ip?: string;
  queryParams?: string;
  requestBody?: string;
  responseBody?: string;
  cookies?: string;
  headers?: string;
  errorDetails?: string;
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
  queryParams?: string;
  requestBody?: string;
  responseBody?: string;
  cookies?: string;
  headers?: string;
  errorDetails?: string;
}) {
  const level: LogLevel =
    entry.statusCode >= 500 ? 'error' :
    entry.statusCode >= 400 ? 'warn' :
    'info';

  createEntry(level, 'request', `${entry.method} ${entry.path} → ${entry.statusCode} (${entry.duration}ms)`, entry);
}

const SENSITIVE_HEADERS = new Set(['authorization', 'cookie', 'set-cookie', 'x-api-key', 'x-auth-token']);
const SENSITIVE_QUERY = new Set(['token', 'api_key', 'key', 'secret', 'password', 'access_token']);

function maskSensitiveValue(_key: string, value: string): string {
  if (!value || value.length < 4) return '***';
  return value.slice(0, 2) + '***' + value.slice(-2);
}

function filterHeaders(headers: Headers): string {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (SENSITIVE_HEADERS.has(lower)) {
      result[key] = '***';
    } else if (lower === 'user-agent' || lower === 'content-type' || lower === 'referer' || lower === 'origin') {
      result[key] = value;
    }
  });
  return JSON.stringify(result);
}

function filterCookies(cookieHeader: string | null): string | undefined {
  if (!cookieHeader) return undefined;
  const parts = cookieHeader.split(';').map(c => c.trim()).filter(Boolean);
  const result: Record<string, string> = {};
  for (const part of parts) {
    const eqIdx = part.indexOf('=');
    if (eqIdx === -1) continue;
    const key = part.slice(0, eqIdx).trim();
    const value = part.slice(eqIdx + 1).trim();
    if (SENSITIVE_QUERY.has(key.toLowerCase())) {
      result[key] = '***';
    } else {
      result[key] = value.length > 50 ? value.slice(0, 50) + '...' : value;
    }
  }
  return Object.keys(result).length > 0 ? JSON.stringify(result) : undefined;
}

function filterQueryParams(url: URL): string | undefined {
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    if (SENSITIVE_QUERY.has(key.toLowerCase())) {
      params[key] = maskSensitiveValue(key, value);
    } else {
      params[key] = value;
    }
  });
  return Object.keys(params).length > 0 ? JSON.stringify(params) : undefined;
}

const MAX_BODY_LENGTH = 2000;

async function tryReadBody(request: Request): Promise<string | undefined> {
  if (request.method === 'GET' || request.method === 'DELETE') return undefined;
  try {
    const cloned = request.clone();
    const text = await cloned.text();
    if (!text) return undefined;
    return text.length > MAX_BODY_LENGTH ? text.slice(0, MAX_BODY_LENGTH) + '...' : text;
  } catch {
    return undefined;
  }
}

async function tryReadResponseBody(response: Response): Promise<string | undefined> {
  if (response.status === 204 || response.status === 304) return undefined;
  try {
    const cloned = response.clone();
    const text = await cloned.text();
    if (!text) return undefined;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text') || contentType.includes('json')) {
      return text.length > MAX_BODY_LENGTH ? text.slice(0, MAX_BODY_LENGTH) + '...' : text;
    }
    return `[${contentType || 'binary'} ${text.length}bytes]`;
  } catch {
    return undefined;
  }
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

export function clearLogs() {
  logs.length = 0;
}

export function getLog(id: string): LogEntry | undefined {
  return logs.find((l) => l.id === id);
}

export interface LogQueryWithSearch extends LogQuery {
  search?: string;
}

const SKIP_LOG_PATHS = new Set(['/api/logs', '/api/logs/', '/api/system/status', '/api/system/status/']);

export function withApiLogging<T extends (...args: any[]) => any>(
  methodName: string,
  handler: T,
): T {
  return (async (...args: any[]) => {
    const start = Date.now();
    const request = args[0] as Request;
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    const skip = SKIP_LOG_PATHS.has(path);
    const queryParams = skip ? undefined : filterQueryParams(url);
    const cookies = skip ? undefined : filterCookies(request.headers.get('cookie'));
    const headers = skip ? undefined : filterHeaders(request.headers);
    const requestBody = skip ? undefined : await tryReadBody(request);
    let errorDetails: string | undefined;

    try {
      const response = await handler(...args);
      const responseBody = skip ? undefined : response instanceof Response ? await tryReadResponseBody(response) : undefined;
      if (!skip) {
        logRequest({
          method,
          path,
          statusCode: response instanceof Response ? response.status : 200,
          duration: Date.now() - start,
          queryParams,
          requestBody,
          responseBody,
          cookies,
          headers,
        });
      }
      return response;
    } catch (error) {
      errorDetails = skip ? undefined : error instanceof Error ? `${error.name}: ${error.message}\n${error.stack?.slice(0, 500)}` : String(error);
      if (!skip) {
        logRequest({
          method,
          path,
          statusCode: 500,
          duration: Date.now() - start,
          queryParams,
          requestBody,
          cookies,
          headers,
          errorDetails,
        });
      }
      throw error;
    }
  }) as T;
}

export function queryLogsV2(query: LogQueryWithSearch = {}): { total: number; entries: LogEntry[] } {
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
  if (query.search) {
    const q = query.search.toLowerCase();
    filtered = filtered.filter((l) => l.message.toLowerCase().includes(q));
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