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
import { type TRPCError } from '@trpc/server';

interface ResponseMetaParams {
  ctx?: unknown;
  errors: TRPCError[];
}

/**
 * Create response metadata for TRPC handlers.
 *
 * This function handles:
 * 1. Forwarding custom headers from context (ctx.resHeaders)
 * 2. Adding X-Auth-Required header for UNAUTHORIZED errors
 *
 * The X-Auth-Required header allows the desktop app (BackendProxyProtocolManager)
 * to distinguish between real authentication failures (e.g., token expired)
 * and other 401 errors (e.g., invalid API keys).
 */
export function createResponseMeta({ ctx, errors }: ResponseMetaParams): {
  headers: Headers | undefined;
} {
  const resHeaders =
    ctx && typeof ctx === 'object' && 'resHeaders' in ctx
      ? (ctx as { resHeaders?: HeadersInit }).resHeaders
      : undefined;
  const headers = resHeaders ? new Headers(resHeaders) : new Headers();

  const hasUnauthorizedError = errors.some((error) => error.code === TRPC_ERROR_CODE_UNAUTHORIZED);
  if (hasUnauthorizedError) {
    headers.set(AUTH_REQUIRED_HEADER, 'true');
  }

  // Only return headers if there's content or auth error
  if (hasUnauthorizedError || resHeaders) {
    return { headers };
  }

  return { headers: undefined };
}
