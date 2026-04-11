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

import type { OptimisticMutationSnapshot } from '@/store/utils/optimisticEngine';
import type { ResourceItem, ResourceQueryParams } from '@/types/resource';

/**
 * Resource slice state
 */
export interface ResourceState {
  /**
   * Pagination state
   */
  hasMore: boolean;

  /**
   * Loading states
   */
  isLoadingMore: boolean;

  isSyncing: boolean;

  /**
   * Sync status
   */
  lastSyncTime?: Date;

  offset: number;
  /**
   * Current query parameters
   */
  queryParams?: ResourceQueryParams;
  /**
   * Derived sorted/filtered list (computed from map)
   * Used for rendering in UI
   */
  resourceList: ResourceItem[];

  /**
   * Primary store - Map for O(1) lookups
   */
  resourceMap: Map<string, ResourceItem>;

  syncError?: Error;
  /**
   * Track which resources are currently syncing
   */
  syncingIds: Set<string>;

  /**
   * Sync queue (FIFO)
   * Contains pending operations to be synced to server
   */
  syncQueue: OptimisticMutationSnapshot[];
  total: number;
}

/**
 * Initial state for resource slice
 */
export const initialResourceState: ResourceState = {
  hasMore: false,
  isLoadingMore: false,
  isSyncing: false,
  offset: 0,
  resourceList: [],
  resourceMap: new Map(),
  syncQueue: [],
  syncingIds: new Set(),
  total: 0,
};
