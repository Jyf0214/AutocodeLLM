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

import isEqual from 'fast-deep-equal';
import { type SWRResponse } from 'swr';

import { useClientDataSWR } from '@/libs/swr';
import { fileService } from '@/services/file';
import { topicService } from '@/services/topic';
import { type StoreSetter } from '@/store/types';
import { type FileListItem } from '@/types/files';
import { type RecentTopic } from '@/types/topic';
import { setNamespace } from '@/utils/storeDebug';

import { type SessionStore } from '../../store';

const n = setNamespace('recent');

const FETCH_RECENT_TOPICS_KEY = 'fetchRecentTopics';
const FETCH_RECENT_RESOURCES_KEY = 'fetchRecentResources';
const FETCH_RECENT_PAGES_KEY = 'fetchRecentPages';

type Setter = StoreSetter<SessionStore>;
export const createRecentSlice = (set: Setter, get: () => SessionStore, _api?: unknown) =>
  new RecentActionImpl(set, get, _api);

export class RecentActionImpl {
  readonly #get: () => SessionStore;
  readonly #set: Setter;

  constructor(set: Setter, get: () => SessionStore, _api?: unknown) {
    void _api;
    this.#set = set;
    this.#get = get;
  }

  useFetchRecentPages = (isLogin: boolean | undefined): SWRResponse<any[]> => {
    return useClientDataSWR<any[]>(
      // Only fetch when login status is explicitly true (not null/undefined)
      isLogin === true ? [FETCH_RECENT_PAGES_KEY, isLogin] : null,
      async () => fileService.getRecentPages(12),
      {
        onSuccess: (data) => {
          if (this.#get().isRecentPagesInit && isEqual(this.#get().recentPages, data)) return;

          this.#set(
            { isRecentPagesInit: true, recentPages: data },
            false,
            n('useFetchRecentPages/onSuccess'),
          );
        },
      },
    );
  };

  useFetchRecentResources = (isLogin: boolean | undefined): SWRResponse<FileListItem[]> => {
    return useClientDataSWR<FileListItem[]>(
      // Only fetch when login status is explicitly true (not null/undefined)
      isLogin === true ? [FETCH_RECENT_RESOURCES_KEY, isLogin] : null,
      async () => fileService.getRecentFiles(12),
      {
        onSuccess: (data) => {
          if (this.#get().isRecentResourcesInit && isEqual(this.#get().recentResources, data))
            return;

          this.#set(
            { isRecentResourcesInit: true, recentResources: data },
            false,
            n('useFetchRecentResources/onSuccess'),
          );
        },
      },
    );
  };

  useFetchRecentTopics = (isLogin: boolean | undefined): SWRResponse<RecentTopic[]> => {
    return useClientDataSWR<RecentTopic[]>(
      // Only fetch when login status is explicitly true (not null/undefined)
      isLogin === true ? [FETCH_RECENT_TOPICS_KEY, isLogin] : null,
      async () => topicService.getRecentTopics(12),
      {
        onSuccess: (data) => {
          if (this.#get().isRecentTopicsInit && isEqual(this.#get().recentTopics, data)) return;

          this.#set(
            { isRecentTopicsInit: true, recentTopics: data },
            false,
            n('useFetchRecentTopics/onSuccess'),
          );
        },
      },
    );
  };
}

export type RecentAction = Pick<RecentActionImpl, keyof RecentActionImpl>;
