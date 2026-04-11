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

import { createTRPCClient, httpBatchLink, type TRPCLink } from '@trpc/client';
import { observable } from '@trpc/server/observable';
import superjson from 'superjson';

import { withElectronProtocolIfElectron } from '@/const/protocol';
import { type ToolsRouter } from '@/server/routers/tools';

// 401 error debouncing for market auth
let lastMarket401Time = 0;
const MIN_401_INTERVAL = 5000; // 5 seconds

// Error handling link for tools client
const errorHandlingLink: TRPCLink<ToolsRouter> = () => {
  return ({ op, next }) =>
    observable((observer) =>
      next(op).subscribe({
        complete: () => observer.complete(),
        error: async (err) => {
          const status = err.data?.httpStatus as number;
          const code = err.data?.code as string;

          console.info('[toolsClient] Error:', {
            code,
            message: err.message,
            path: op.path,
            status,
          });

          // Check if this is a market API call with 401 error
          // UNAUTHORIZED tRPC code maps to HTTP 401
          const is401 = status === 401 || code === 'UNAUTHORIZED';
          if (is401 && op.path.startsWith('market.')) {
            const now = Date.now();
            if (now - lastMarket401Time > MIN_401_INTERVAL) {
              lastMarket401Time = now;
              console.info('[toolsClient] Emitting market-unauthorized event for path:', op.path);
              // Emit event for MarketAuthProvider to handle
              const { marketAuthEvents } = await import('@/layout/AuthProvider/MarketAuth/events');
              marketAuthEvents.emit('market-unauthorized', {
                path: op.path,
                timestamp: now,
              });
            }
          }

          observer.error(err);
        },
        next: (value) => observer.next(value),
      }),
    );
};

export const toolsClient = createTRPCClient<ToolsRouter>({
  links: [
    errorHandlingLink,
    httpBatchLink({
      headers: async () => {
        // dynamic import to avoid circular dependency
        const { createHeaderWithAuth } = await import('@/services/_auth');

        return createHeaderWithAuth();
      },
      maxURLLength: 2083,
      transformer: superjson,
      url: withElectronProtocolIfElectron('/trpc/tools'),
    }),
  ],
});
