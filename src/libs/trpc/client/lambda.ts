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

import { type TRPCLink } from '@trpc/client';
import { createTRPCClient, httpBatchLink, httpLink, splitLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import { observable } from '@trpc/server/observable';
import debug from 'debug';
import { type ModelProvider } from 'model-bank';
import superjson from 'superjson';

import { withElectronProtocolIfElectron } from '@/const/protocol';
import { isDesktop } from '@/const/version';
import { type LambdaRouter } from '@/server/routers/lambda';

const log = debug('lobe-image:lambda-client');

// 401 error debouncing: prevent showing multiple login notifications in short time
let last401Time = 0;
let lastMarket401Time = 0;
const MIN_401_INTERVAL = 5000; // 5 seconds

// handle error
const errorHandlingLink: TRPCLink<LambdaRouter> = () => {
  return ({ op, next }) =>
    observable((observer) =>
      next(op).subscribe({
        complete: () => observer.complete(),
        error: async (err) => {
          // Check if this is an abort error and should be ignored
          const isAbortError =
            err.message.includes('aborted') ||
            err.name === 'AbortError' ||
            err.cause?.name === 'AbortError' ||
            err.message.includes('signal is aborted without reason');

          const showError = (op.context?.showNotification as boolean) ?? true;
          const status = err.data?.httpStatus as number;

          // Check if this is a market API call
          const isMarketApi = op.path.startsWith('market.');

          // Don't show notifications for abort errors
          if (showError && !isAbortError) {
            switch (status) {
              case 401: {
                if (isMarketApi) {
                  // Market API 401: emit event for MarketAuthProvider to handle
                  // Don't trigger LobeChat logout for market auth issues
                  const now = Date.now();
                  if (now - lastMarket401Time > MIN_401_INTERVAL) {
                    lastMarket401Time = now;
                    // Dynamically import to avoid circular dependencies
                    const { marketAuthEvents } =
                      await import('@/layout/AuthProvider/MarketAuth/events');
                    marketAuthEvents.emit('market-unauthorized', {
                      path: op.path,
                      timestamp: now,
                    });
                  }
                } else {
                  // Non-market 401: handle as before (LobeChat session expired)
                  const now = Date.now();
                  if (now - last401Time > MIN_401_INTERVAL) {
                    last401Time = now;
                    // Desktop app doesn't have the web auth routes like `/signin`,
                    // so skip the login redirect/notification there.
                    if (!isDesktop) {
                      const { getUserStoreState } = await import('@/store/user/store');
                      const { isSignedIn, logout } = getUserStoreState();
                      // If user is still marked as signed in but got 401,
                      // session is invalid - clear client state first
                      if (isSignedIn) {
                        await logout();
                      }
                      const { loginRequired } =
                        await import('@/components/Error/loginRequiredNotification');
                      loginRequired.redirect();
                    }
                  }
                }
                // Mark error as non-retryable to prevent SWR infinite retry loop
                err.meta = { ...err.meta, shouldRetry: false };
                break;
              }

              default: {
                console.error(err);
              }
            }
          }

          observer.error(err);
        },
        next: (value) => observer.next(value),
      }),
    );
};

// 2. Shared link options
const linkOptions = {
  fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
    // Ensure credentials are included to send cookies (like mp_token)

    const fetchOptions: RequestInit = {
      ...init,
      credentials: 'include',
    };

    if (isDesktop) {
      const res = await fetch(input as string, fetchOptions);

      if (res) return res;
    }

    return await fetch(input, fetchOptions);
  },
  headers: async () => {
    // dynamic import to avoid circular dependency
    const { createHeaderWithAuth } = await import('@/services/_auth');

    let provider: ModelProvider | undefined;
    // for image page, we need to get the provider from the store
    log('Getting provider from store for image page: %s', location.pathname);
    if (location.pathname === '/image') {
      const { getImageStoreState } = await import('@/store/image');
      const { imageGenerationConfigSelectors } =
        await import('@/store/image/slices/generationConfig/selectors');
      provider = imageGenerationConfigSelectors.provider(getImageStoreState()) as ModelProvider;
      log('Getting provider from store for image page: %s', provider);
    }

    // Only include provider in JWT for image operations
    // For other operations (like knowledge base embedding), let server use its own config
    const headers = await createHeaderWithAuth(provider ? { provider } : undefined);
    log('Headers: %O', headers);
    return headers;
  },
  transformer: superjson,
  url: withElectronProtocolIfElectron('/trpc/lambda'),
};

// Procedures that should skip batching for faster initial load
const initialLoadProcedures = new Set(['user.getUserState', 'config.getGlobalConfig']);
const slowProcedures = new Set(['market.getAssistantList']);
const SKIP_BATCH_PROCEDURES = new Set([...initialLoadProcedures, ...slowProcedures]);

// 3. splitLink to conditionally disable batching
const customSplitLink = splitLink({
  condition: (op) => SKIP_BATCH_PROCEDURES.has(op.path),
  false: httpBatchLink({ ...linkOptions, maxURLLength: 2083 }),
  true: httpLink(linkOptions),
});

// 4. assembly links
const links = [errorHandlingLink, customSplitLink];

export const lambdaClient = createTRPCClient<LambdaRouter>({
  links,
});

export const lambdaQuery = createTRPCReact<LambdaRouter>();

export const lambdaQueryClient = lambdaQuery.createClient({ links });
