/**
 * 系统日志模块
 * 内存环形缓冲区 + 数据库持久化，支持后端日志、请求日志和函数调用日志
 * 数据库中的日志每2小时自动清理
 * 支持 traceId 关联请求与函数调用链
 */

import { AsyncLocalStorage } from 'async_hooks';

// 惰性获取 Prisma（动态 import 避免模块加载时实例化，构建阶段不会因 DATABASE_URL 未设置而崩溃）
async function getPrisma() {
  const { prisma } = await import('@/lib/db/prisma');
  return prisma;
}

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
  traceId?: string;
  functionName?: string;
  functionArgs?: string;
  functionResult?: string;
}

export const logContext = new AsyncLocalStorage<{ traceId: string }>();

const MAX_LOGS = 10000;
const logs: LogEntry[] = [];
let logCounter = 0;

const LOG_TTL_MS = 2 * 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

async function writeEntryToDB(entry: LogEntry): Promise<void> {
  try {
    const db = await getPrisma();
    await db.systemLog.create({
      data: {
        level: entry.level,
        message: entry.message,
        source: entry.source,
        path: entry.path ?? null,
        method: entry.method ?? null,
        statusCode: entry.statusCode ?? null,
        duration: entry.duration ?? null,
        userId: entry.userId ?? null,
        ip: entry.ip ?? null,
        queryParams: entry.queryParams ?? null,
        requestBody: entry.requestBody ?? null,
        responseBody: entry.responseBody ?? null,
        cookies: entry.cookies ?? null,
        headers: entry.headers ?? null,
        errorDetails: entry.errorDetails ?? null,
        traceId: entry.traceId ?? null,
        functionName: entry.functionName ?? null,
        functionArgs: entry.functionArgs ?? null,
        functionResult: entry.functionResult ?? null,
      },
    });
  } catch {
    // DB 写入失败不影响内存日志
  }
}

export async function cleanupOldLogs(): Promise<number> {
  const cutoff = new Date(Date.now() - LOG_TTL_MS);
  try {
    const db = await getPrisma();
    const result = await db.systemLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    return result.count;
  } catch {
    return 0;
  }
}

function startCleanupTimer() {
  if (typeof window !== 'undefined') return;
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    cleanupOldLogs().catch(() => {});
  }, CLEANUP_INTERVAL_MS);
  cleanupOldLogs().catch(() => {});
}

// 惰性启动清理定时器：仅在首次创建日志条目时执行
// 避免模块加载时（如构建阶段）因 DATABASE_URL 未设置而崩溃
let cleanupStarted = false;
function lazyStartCleanup() {
  if (cleanupStarted) return;
  cleanupStarted = true;
  startCleanupTimer();
}

function createEntry(
  level: LogLevel,
  source: LogEntry['source'],
  message: string,
  extra?: Partial<LogEntry>,
): LogEntry {
  const ctx = logContext.getStore();
  const entry: LogEntry = {
    id: `${Date.now()}-${++logCounter}`,
    timestamp: Date.now(),
    level,
    source,
    message,
    traceId: ctx?.traceId,
    ...extra,
  };

  logs.push(entry);
  if (logs.length > MAX_LOGS) {
    logs.splice(0, logs.length - MAX_LOGS);
  }

  // 首次创建日志条目时惰性启动清理定时器
  lazyStartCleanup();

  writeEntryToDB(entry);

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
  traceId?: string;
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

const MAX_ARGS_LENGTH = 2000;

function safeSerialize(value: unknown): string {
  try {
    const seen = new WeakSet();
    const str = JSON.stringify(value, (_key, val) => {
      if (typeof val === 'function') return '[Function]';
      if (typeof val === 'object' && val !== null) {
        if (seen.has(val)) return '[Circular]';
        seen.add(val);
      }
      if (val instanceof Error) return `${val.name}: ${val.message}`;
      if (val instanceof Request) return '[Request]';
      if (val instanceof Response) return '[Response]';
      if (val instanceof Headers) return '[Headers]';
      if (val instanceof URL) return val.href;
      return val;
    }, 2);
    return str.length > MAX_ARGS_LENGTH ? str.slice(0, MAX_ARGS_LENGTH) + '...' : str;
  } catch {
    return String(value);
  }
}

const SENSITIVE_ARGS_KEY = new Set(['password', 'passwordHash', 'token', 'apiKey', 'secret', 'authorization', 'accessToken', 'refreshToken']);

function maskSensitiveFields(obj: unknown, depth = 0): unknown {
  if (depth > 5) return '[Deep]';
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(v => maskSensitiveFields(v, depth + 1));
  const masked: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_ARGS_KEY.has(key)) {
      masked[key] = '***';
    } else {
      masked[key] = maskSensitiveFields(val, depth + 1);
    }
  }
  return masked;
}

export function logFunctionCall(name: string, args: unknown[], result: unknown, duration: number, error?: Error) {
  const level = error ? 'error' : 'info';
  const maskedArgs = args.map(a => maskSensitiveFields(a));
  const maskedResult = error ? { error: error.message } : maskSensitiveFields(result);
  createEntry(level, 'function', `[函数] ${name} ${error ? '失败' : '成功'} (${duration}ms)`, {
    functionName: name,
    functionArgs: safeSerialize(maskedArgs),
    functionResult: safeSerialize(maskedResult),
    duration,
    errorDetails: error ? `${error.name}: ${error.message}\n${error.stack?.slice(0, 500)}` : undefined,
  });
}

/**
 * 高阶函数包装器：自动记录函数入参、返回值、耗时，并关联到当前请求
 */
export function withFunctionLogging<T extends (...args: any[]) => any>(
  name: string,
  fn: T,
): T {
  return ((...args: any[]) => {
    const start = Date.now();
    try {
      const result = fn(...args);
      if (result instanceof Promise) {
        return result.then(
          (val) => {
            logFunctionCall(name, args, val, Date.now() - start);
            return val;
          },
          (err) => {
            logFunctionCall(name, args, undefined, Date.now() - start, err);
            throw err;
          },
        );
      }
      logFunctionCall(name, args, result, Date.now() - start);
      return result;
    } catch (error) {
      logFunctionCall(name, args, undefined, Date.now() - start, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }) as T;
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

export async function clearLogs() {
  logs.length = 0;
  try {
    const db = await getPrisma();
    await db.systemLog.deleteMany({});
  } catch {
    // 清空失败不影响内存日志
  }
}

export function getLog(id: string): LogEntry | undefined {
  return logs.find((l) => l.id === id);
}

export interface LogQueryWithSearch extends LogQuery {
  search?: string;
  traceId?: string;
}

const SKIP_LOG_PATHS = new Set(['/api/logs', '/api/logs/', '/api/system/status', '/api/system/status/']);

export function withApiLogging<T extends (...args: any[]) => any>(
  methodName: string,
  handler: T,
): T {
  return (async (...args: any[]) => {
    const traceId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    return logContext.run({ traceId }, async () => {
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
            traceId,
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
            traceId,
          });
        }
        throw error;
      }
    });
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
  if (query.traceId) {
    filtered = filtered.filter((l) => l.traceId === query.traceId);
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