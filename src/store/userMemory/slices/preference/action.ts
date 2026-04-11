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

import { uniqBy } from 'es-toolkit/compat';
import { produce } from 'immer';
import { type SWRResponse } from 'swr';
import useSWR from 'swr';

import { type DisplayPreferenceMemory } from '@/database/repositories/userMemory';
import { memoryCRUDService, userMemoryService } from '@/services/userMemory';
import { type StoreSetter } from '@/store/types';
import { LayersEnum } from '@/types/userMemory';
import { setNamespace } from '@/utils/storeDebug';

import { type UserMemoryStore } from '../../store';

const n = setNamespace('userMemory/preference');

export interface PreferenceQueryParams {
  page?: number;
  pageSize?: number;
  q?: string;
  sort?: 'capturedAt' | 'scorePriority';
}

type Setter = StoreSetter<UserMemoryStore>;
export const createPreferenceSlice = (set: Setter, get: () => UserMemoryStore, _api?: unknown) =>
  new PreferenceActionImpl(set, get, _api);

export class PreferenceActionImpl {
  readonly #get: () => UserMemoryStore;
  readonly #set: Setter;

  constructor(set: Setter, get: () => UserMemoryStore, _api?: unknown) {
    void _api;
    this.#set = set;
    this.#get = get;
  }

  deletePreference = async (id: string): Promise<void> => {
    await memoryCRUDService.deletePreference(id);
    // Reset list to refresh
    this.#get().resetPreferencesList({
      q: this.#get().preferencesQuery,
      sort: this.#get().preferencesSort,
    });
  };

  loadMorePreferences = (): void => {
    const { preferencesPage, preferencesTotal, preferences } = this.#get();
    if (preferences.length < (preferencesTotal || 0)) {
      this.#set(
        produce((draft) => {
          draft.preferencesPage = preferencesPage + 1;
        }),
        false,
        n('loadMorePreferences'),
      );
    }
  };

  resetPreferencesList = (params?: Omit<PreferenceQueryParams, 'page' | 'pageSize'>): void => {
    this.#set(
      produce((draft) => {
        draft.preferences = [];
        draft.preferencesPage = 1;
        draft.preferencesQuery = params?.q;
        draft.preferencesSearchLoading = true;
        draft.preferencesSort = params?.sort;
      }),
      false,
      n('resetPreferencesList'),
    );
  };

  useFetchPreferences = (params: PreferenceQueryParams): SWRResponse<any> => {
    const swrKeyParts = [
      'useFetchPreferences',
      params.page,
      params.pageSize,
      params.q,
      params.sort,
    ];
    const swrKey = swrKeyParts
      .filter((part) => part !== undefined && part !== null && part !== '')
      .join('-');
    const page = params.page ?? 1;

    return useSWR(
      swrKey,
      async () => {
        const result = await userMemoryService.queryMemories({
          layer: LayersEnum.Preference,
          page: params.page,
          pageSize: params.pageSize,
          q: params.q,
          sort: params.sort,
        });

        return result;
      },
      {
        onSuccess: (data: any) => {
          this.#set(
            produce((draft) => {
              draft.preferencesSearchLoading = false;

              // Set basic information
              if (!draft.preferencesInit) {
                draft.preferencesInit = true;
                draft.preferencesTotal = data.total;
              }

              // Transform data structure
              const transformedItems: DisplayPreferenceMemory[] = data.items.map((item: any) => ({
                ...item.memory,
                ...item.preference,
              }));

              // Accumulate data logic
              if (page === 1) {
                // First page, set directly
                draft.preferences = uniqBy(transformedItems, 'id');
              } else {
                // Subsequent pages, accumulate data
                draft.preferences = uniqBy([...draft.preferences, ...transformedItems], 'id');
              }

              // Update hasMore
              draft.preferencesHasMore = data.items.length >= (params.pageSize || 20);
            }),
            false,
            n('useFetchPreferences/onSuccess'),
          );
        },
        revalidateOnFocus: false,
      },
    );
  };
}

export type PreferenceAction = Pick<PreferenceActionImpl, keyof PreferenceActionImpl>;
