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

import { isEqual } from 'es-toolkit';
import { shallow } from 'zustand/shallow';

import { mutate, useClientDataSWR } from '@/libs/swr';
import { resourceService } from '@/services/resource';
import { type ResourceQueryParams } from '@/types/resource';

import { useFileStore } from '../../store';
import { mergeServerResourcesWithOptimistic } from './utils';

const SWR_KEY_RESOURCES = 'SWR_RESOURCES';

/**
 * Revalidate resources with current or specific query params
 * This can be called from outside React components (e.g., store actions)
 */
export const revalidateResources = async (params?: ResourceQueryParams) => {
  const queryParams = params || useFileStore.getState().queryParams;
  if (queryParams) {
    await mutate([SWR_KEY_RESOURCES, queryParams]);
  }
};

/**
 * Custom SWR hook for fetching resources with caching and revalidation
 */
export const useFetchResources = (params: ResourceQueryParams | null, enable: any = true) => {
  return useClientDataSWR(
    enable && params ? [SWR_KEY_RESOURCES, params] : null,
    async ([, queryParams]: [string, ResourceQueryParams]) => {
      const response = await resourceService.queryResources({
        ...queryParams,
        limit: queryParams.limit || 50,
        offset: 0,
      });
      return response;
    },
    {
      // SWR configuration for optimal UX
      dedupingInterval: 2000,
      onSuccess: (data: { hasMore: boolean; items: any[]; total?: number }) => {
        const { resourceList, resourceMap } = useFileStore.getState();
        const merged = mergeServerResourcesWithOptimistic(data.items, resourceMap, params);
        const newResourceList = merged.resourceList;
        const newResourceMap = merged.resourceMap;

        // Only update store if data actually changed
        if (!isEqual(newResourceList, resourceList) || !isEqual(newResourceMap, resourceMap)) {
          useFileStore.setState(
            {
              hasMore: data.hasMore,
              offset: data.items.length,
              queryParams: params ?? undefined,
              resourceList: newResourceList,
              resourceMap: newResourceMap,
              total: data.total,
            },
            false,
            'useFetchResources/success',
          );
        }
      },
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    },
  );
};

/**
 * Hook to access resource store state
 */
export const useResourceStore = () => {
  return useFileStore(
    (s) => ({
      hasMore: s.hasMore,
      queryParams: s.queryParams,
      resourceList: s.resourceList,
      resourceMap: s.resourceMap,
      total: s.total,
    }),
    shallow,
  );
};
