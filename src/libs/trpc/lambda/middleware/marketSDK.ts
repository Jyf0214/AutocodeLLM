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

import { isTrustedClientEnabled, type TrustedClientUserInfo } from '@/libs/trusted-client';
import { MarketService } from '@/server/services/market';

import { trpc } from '../init';

interface ContextWithMarketUserInfo {
  marketAccessToken?: string;
  marketUserInfo?: TrustedClientUserInfo;
}

/**
 * Middleware that initializes MarketService with proper authentication.
 * This requires marketUserInfo middleware to be applied first.
 *
 * Provides:
 * - ctx.marketSDK: MarketSDK instance for backward compatibility
 * - ctx.marketService: MarketService instance (recommended)
 */
export const marketSDK = trpc.middleware(async (opts) => {
  const ctx = opts.ctx as ContextWithMarketUserInfo;

  // Initialize MarketService with authentication
  const marketService = new MarketService({
    accessToken: ctx.marketAccessToken,
    userInfo: ctx.marketUserInfo,
  });

  return opts.next({
    ctx: {
      marketSDK: marketService.market, // Backward compatibility
      marketService, // New recommended way
    },
  });
});

/**
 * Middleware that requires authentication for Market API access.
 * This middleware ensures that either accessToken or marketUserInfo is available.
 * It should be used after marketUserInfo and marketSDK middlewares.
 *
 * If trusted client is enabled, authentication check is skipped.
 * Throws UNAUTHORIZED error if neither authentication method is available.
 */
export const requireMarketAuth = trpc.middleware(async (opts) => {
  // If trusted client is enabled, skip authentication check
  if (isTrustedClientEnabled()) {
    return opts.next();
  }

  const ctx = opts.ctx as ContextWithMarketUserInfo;

  // Check if any authentication is available
  const hasAccessToken = !!ctx.marketAccessToken;
  const hasUserInfo = !!ctx.marketUserInfo;

  if (!hasAccessToken && !hasUserInfo) {
    const { TRPCError } = await import('@trpc/server');
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required. Please sign in.',
    });
  }

  return opts.next();
});
