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

import { AUTH_REQUIRED_HEADER, TRPC_ERROR_CODE_UNAUTHORIZED } from '@lobechat/desktop-bridge';
import { TRPCError } from '@trpc/server';
import { describe, expect, it } from 'vitest';

import { createResponseMeta } from './responseMeta';

describe('createResponseMeta', () => {
  it('should return undefined headers when no errors and no resHeaders', () => {
    const result = createResponseMeta({ ctx: undefined, errors: [] });
    expect(result.headers).toBeUndefined();
  });

  it('should forward resHeaders from context', () => {
    const resHeaders = new Headers({ 'X-Custom': 'value' });
    const result = createResponseMeta({
      ctx: { resHeaders },
      errors: [],
    });

    expect(result.headers).toBeInstanceOf(Headers);
    expect(result.headers?.get('X-Custom')).toBe('value');
  });

  it('should set AUTH_REQUIRED_HEADER header for UNAUTHORIZED error', () => {
    const error = new TRPCError({ code: TRPC_ERROR_CODE_UNAUTHORIZED });
    const result = createResponseMeta({
      ctx: undefined,
      errors: [error],
    });

    expect(result.headers).toBeInstanceOf(Headers);
    expect(result.headers?.get(AUTH_REQUIRED_HEADER)).toBe('true');
  });

  it('should set AUTH_REQUIRED_HEADER and preserve resHeaders for UNAUTHORIZED error', () => {
    const resHeaders = new Headers({ 'X-Custom': 'value' });
    const error = new TRPCError({ code: TRPC_ERROR_CODE_UNAUTHORIZED });
    const result = createResponseMeta({
      ctx: { resHeaders },
      errors: [error],
    });

    expect(result.headers).toBeInstanceOf(Headers);
    expect(result.headers?.get(AUTH_REQUIRED_HEADER)).toBe('true');
    expect(result.headers?.get('X-Custom')).toBe('value');
  });

  it('should NOT set AUTH_REQUIRED_HEADER for non-UNAUTHORIZED errors', () => {
    const error = new TRPCError({ code: 'BAD_REQUEST' });
    const result = createResponseMeta({
      ctx: undefined,
      errors: [error],
    });

    expect(result.headers).toBeUndefined();
  });

  it('should handle context without resHeaders property', () => {
    const error = new TRPCError({ code: TRPC_ERROR_CODE_UNAUTHORIZED });
    const result = createResponseMeta({
      ctx: { userId: 'test-user' },
      errors: [error],
    });

    expect(result.headers).toBeInstanceOf(Headers);
    expect(result.headers?.get(AUTH_REQUIRED_HEADER)).toBe('true');
  });

  it('should handle multiple errors where one is UNAUTHORIZED', () => {
    const errors = [
      new TRPCError({ code: 'BAD_REQUEST' }),
      new TRPCError({ code: TRPC_ERROR_CODE_UNAUTHORIZED }),
    ];
    const result = createResponseMeta({
      ctx: undefined,
      errors,
    });

    expect(result.headers).toBeInstanceOf(Headers);
    expect(result.headers?.get(AUTH_REQUIRED_HEADER)).toBe('true');
  });
});
