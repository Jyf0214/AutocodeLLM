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

import { type ChatTopic } from '@/types/topic';

/**
 * Unified topic data structure for each agent
 */
export interface TopicData {
  currentPage: number;
  excludeTriggers?: string[];
  hasMore: boolean;
  isExpandingPageSize?: boolean;
  isLoadingMore?: boolean;
  items: ChatTopic[];
  /**
   * Last fetched/used page size for this topic container.
   * Used to detect "pageSize expansion" (user increases pageSize) without being affected by SWR revalidation
   * or cases where total items < pageSize.
   */
  pageSize: number;
  total: number;
}

export interface ChatTopicState {
  activeTopicId: string | null;
  /**
   * whether all topics drawer is open
   */
  allTopicsDrawerOpen: boolean;
  creatingTopic: boolean;
  inSearchingMode?: boolean;
  isSearchingTopic: boolean;
  searchTopics: ChatTopic[];
  /**
   * Unified topic data map for each agent
   * Contains items, total count, pagination state, and loading states
   */
  topicDataMap: Record<string, TopicData>;
  topicLoadingIds: string[];
  topicRenamingId?: string;
  topicSearchKeywords: string;
}

export const initialTopicState: ChatTopicState = {
  activeTopicId: null,
  allTopicsDrawerOpen: false,
  creatingTopic: false,
  isSearchingTopic: false,
  searchTopics: [],
  topicDataMap: {},
  topicLoadingIds: [],
  topicSearchKeywords: '',
};
