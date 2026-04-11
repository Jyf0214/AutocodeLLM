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

import type { ResourceItem, ResourceQueryParams } from '@/types/resource';

export const getResourceQueryKey = (params?: ResourceQueryParams | null) => {
  if (!params) return 'resource-query:default';

  return JSON.stringify({
    category: params.category ?? null,
    libraryId: params.libraryId ?? null,
    parentId: params.parentId ?? null,
    q: params.q ?? null,
    showFilesInKnowledgeBase: params.showFilesInKnowledgeBase ?? null,
    sorter: params.sorter ?? null,
    sortType: params.sortType ?? null,
  });
};

export const mergeServerResourcesWithOptimistic = (
  serverItems: ResourceItem[],
  localResourceMap: Map<string, ResourceItem>,
  queryParams?: ResourceQueryParams | null,
) => {
  const queryKey = getResourceQueryKey(queryParams);
  const serverMap = new Map(serverItems.map((item) => [item.id, item]));

  const optimisticItems = Array.from(localResourceMap.values()).filter(
    (item) => item._optimistic?.queryKey === queryKey,
  );

  const optimisticById = new Map<string, ResourceItem>();
  const optimisticOnlyItems: ResourceItem[] = [];

  for (const item of optimisticItems) {
    if (serverMap.has(item.id)) {
      optimisticById.set(item.id, item);
      continue;
    }

    optimisticOnlyItems.push(item);
  }

  const mergedList = [
    ...optimisticOnlyItems,
    ...serverItems.map((item) => optimisticById.get(item.id) ?? item),
  ];
  const mergedMap = new Map(localResourceMap);

  for (const item of mergedList) {
    mergedMap.set(item.id, item);
  }

  return {
    changed:
      !isEqual(mergedList, serverItems) ||
      optimisticOnlyItems.length > 0 ||
      optimisticById.size > 0,
    resourceList: mergedList,
    resourceMap: mergedMap,
  };
};
