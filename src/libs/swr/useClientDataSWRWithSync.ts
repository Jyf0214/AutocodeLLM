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

/**
 * useClientDataSWR with automatic Zustand store sync
 *
 * Solves the problem of SWR cached data not being immediately synced to Zustand store.
 * When SWR returns data from localStorage cache, it will automatically sync to store via onData callback.
 */

import { useEffect, useRef } from 'react';
import { type SWRConfiguration, type SWRResponse } from 'swr';

import { useClientDataSWR } from './index';

type Key = string | readonly unknown[] | null | undefined;

interface UseClientDataSWRWithSyncOptions<T> extends SWRConfiguration<T> {
  /**
   * Data sync callback, called when data is available (both cached and fresh data)
   * Used to sync data to Zustand store
   */
  onData?: (data: T) => void;
  /**
   * Whether to skip sync (optional, for conditional skipping)
   */
  skipSync?: boolean;
}

/**
 * Enhanced version of useClientDataSWR with automatic cache data sync to Zustand store
 *
 * @example
 * ```ts
 * useClientDataSWRWithSync(
 *   isLogin ? ['fetchAgentList', isLogin] : null,
 *   () => homeService.getSidebarAgentList(),
 *   {
 *     onData: (data) => {
 *       // Auto sync to store, whether cached or fresh data
 *       set({ ...mapResponseToState(data), isInit: true });
 *     },
 *     skipSync: state.isInit, // Optional: skip after initialized
 *   }
 * );
 * ```
 */
export function useClientDataSWRWithSync<T>(
  key: Key,
  fetcher: (() => Promise<T>) | null,
  options?: UseClientDataSWRWithSyncOptions<T>,
): SWRResponse<T> {
  const { onData, skipSync, onSuccess, ...swrOptions } = options || {};
  const hasSyncedRef = useRef(false);

  const response = useClientDataSWR<T>(key, fetcher, {
    ...swrOptions,
    onSuccess: (data, key, config) => {
      // Call original onSuccess
      onSuccess?.(data, key, config);
      // Also sync via onData
      if (onData && !skipSync) {
        onData(data);
        hasSyncedRef.current = true;
      }
    },
  });

  const { data } = response;

  // When cached data is available, sync to store immediately
  useEffect(() => {
    if (data && onData && !skipSync && !hasSyncedRef.current) {
      onData(data);
      hasSyncedRef.current = true;
    }
  }, [data, onData, skipSync]);

  // Reset sync state when key changes
  useEffect(() => {
    hasSyncedRef.current = false;
  }, [key?.toString()]);

  return response;
}
