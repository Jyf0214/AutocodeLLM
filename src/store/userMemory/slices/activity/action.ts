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

import { type ActivityListResult } from '@lobechat/types';
import { uniqBy } from 'es-toolkit/compat';
import { produce } from 'immer';
import { type SWRResponse } from 'swr';
import useSWR from 'swr';

import { memoryCRUDService, userMemoryService } from '@/services/userMemory';
import { type StoreSetter } from '@/store/types';
import { setNamespace } from '@/utils/storeDebug';

import { type UserMemoryStore } from '../../store';

const n = setNamespace('userMemory/activity');

export interface ActivityQueryParams {
  page?: number;
  pageSize?: number;
  q?: string;
  sort?: 'capturedAt' | 'startsAt';
  status?: string[];
  types?: string[];
}

type Setter = StoreSetter<UserMemoryStore>;
export const createActivitySlice = (set: Setter, get: () => UserMemoryStore, _api?: unknown) =>
  new ActivityActionImpl(set, get, _api);

export class ActivityActionImpl {
  readonly #get: () => UserMemoryStore;
  readonly #set: Setter;

  constructor(set: Setter, get: () => UserMemoryStore, _api?: unknown) {
    void _api;
    this.#set = set;
    this.#get = get;
  }

  deleteActivity = async (id: string): Promise<void> => {
    await memoryCRUDService.deleteActivity(id);
    this.#get().resetActivitiesList({
      q: this.#get().activitiesQuery,
      sort: this.#get().activitiesSort,
    });
  };

  loadMoreActivities = (): void => {
    const { activitiesPage, activitiesTotal, activities } = this.#get();
    if (activities.length < (activitiesTotal || 0)) {
      this.#set(
        produce((draft) => {
          draft.activitiesPage = activitiesPage + 1;
        }),
        false,
        n('loadMoreActivities'),
      );
    }
  };

  resetActivitiesList = (params?: Omit<ActivityQueryParams, 'page' | 'pageSize'>): void => {
    this.#set(
      produce((draft) => {
        draft.activities = [];
        draft.activitiesPage = 1;
        draft.activitiesQuery = params?.q;
        draft.activitiesSearchLoading = true;
        draft.activitiesSort = params?.sort;
      }),
      false,
      n('resetActivitiesList'),
    );
  };

  useFetchActivities = (params: ActivityQueryParams): SWRResponse<ActivityListResult> => {
    const swrKeyParts = [
      'useFetchActivities',
      params.page,
      params.pageSize,
      params.q,
      params.sort,
      params.status?.join(',') ?? '',
      params.types?.join(',') ?? '',
    ];
    const swrKey = swrKeyParts
      .filter((part) => part !== undefined && part !== null && part !== '')
      .join('-');
    const page = params.page ?? 1;

    return useSWR(
      swrKey,
      async () => {
        return userMemoryService.queryActivities({
          page: params.page,
          pageSize: params.pageSize,
          q: params.q,
          sort: params.sort,
          status: params.status,
          types: params.types,
        });
      },
      {
        onSuccess: (data: ActivityListResult) => {
          this.#set(
            produce((draft) => {
              draft.activitiesSearchLoading = false;
              draft.activitiesTotal = data.total;

              if (!draft.activitiesInit) {
                draft.activitiesInit = true;
              }

              if (page === 1) {
                draft.activities = uniqBy(data.items, 'id');
              } else {
                draft.activities = uniqBy([...draft.activities, ...data.items], 'id');
              }

              draft.activitiesHasMore = data.items.length >= (params.pageSize || 20);
            }),
            false,
            n('useFetchActivities/onSuccess'),
          );
        },
        revalidateOnFocus: false,
      },
    );
  };
}

export type ActivityAction = Pick<ActivityActionImpl, keyof ActivityActionImpl>;
