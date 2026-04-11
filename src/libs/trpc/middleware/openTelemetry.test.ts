/**
 * 本代码来源于 LobeChat 项目（https://github.com/lobehub/lobe-chat）
 *
 * LobeChat 许可证信息：
 * LobeHub Community License（基于 Apache License 2.0）
 * Copyright (c) 2024-2026 LobeHub LLC. All rights reserved.
 * 详细信息：http://www.apache.org/licenses/LICENSE-2.0
 *
 * 修改声明：
 * 本文件已从 LobeChat 源代码进行修改以适配 AutocodeLLM 项目。
 * 修改内容包括：目录结构调整、依赖适配、API 接口兼容等。
 *
 * AutocodeLLM 项目许可证：
 * Apache License, Version 2.0
 * Copyright (c) 2026 Jyf0214
 *
 * 双重许可：本文件同时受上述两个许可证约束。
 * 商业使用需分别获得对应授权。
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type * as TraceparentModule from '@/libs/observability/traceparent';
import { injectSpanTraceHeaders } from '@/libs/observability/traceparent';

import { openTelemetry } from './openTelemetry';

const spanContext = {
  traceId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  spanId: 'bbbbbbbbbbbbbbbb',
  traceFlags: 1,
};

const mocks = vi.hoisted(() => ({
  capturedMiddleware: undefined as any,
}));

vi.mock('@lobechat/observability-otel/api', () => {
  const tracer = {
    startSpan: vi.fn(() => ({
      spanContext: () => spanContext,
      setStatus: vi.fn(),
      setAttribute: vi.fn(),
      end: vi.fn(),
    })),
  };

  return {
    SpanKind: { SERVER: 'server' },
    SpanStatusCode: { OK: 1, ERROR: 2 },
    context: {
      active: vi.fn(() => ({})),
      with: vi.fn((_ctx, fn) => fn()),
    },
    diag: { debug: vi.fn(), error: vi.fn() },
    trace: {
      getTracer: vi.fn(() => tracer),
      setSpan: vi.fn((_ctx, span) => span),
    },
    propagation: { inject: vi.fn() },
  };
});

vi.mock('../lambda/init', () => {
  const middleware = (fn: any) => {
    mocks.capturedMiddleware = fn;
    return fn;
  };

  return {
    trpc: {
      middleware,
    },
  };
});

vi.mock('@/libs/observability/traceparent', async () => {
  const actual = await vi.importActual<typeof TraceparentModule>(
    '@/libs/observability/traceparent',
  );
  return {
    ...actual,
    injectSpanTraceHeaders: vi.fn(actual.injectSpanTraceHeaders),
  };
});

describe('openTelemetry middleware', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.ENABLE_TELEMETRY = 'true';
  });

  it('injects trace headers into response headers', async () => {
    const ctx = { resHeaders: new Headers() };
    const middleware = mocks.capturedMiddleware || openTelemetry;

    expect(typeof middleware).toBe('function');

    const result = await middleware({
      ctx: ctx as any,
      getRawInput: () => undefined,
      next: vi.fn().mockResolvedValue({ ok: true, data: null }),
      path: 'foo.bar',
      type: 'query',
    });

    expect(result).toEqual({ ok: true, data: null });
    expect(ctx.resHeaders?.get('traceparent')).toBe(
      '00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01',
    );
    expect(injectSpanTraceHeaders).toHaveBeenCalled();
  });
});
