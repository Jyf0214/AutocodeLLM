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

import {
  type IdentityListResult,
  type NewUserMemoryIdentity,
  type UpdateUserMemoryIdentity,
} from '@lobechat/types';
import { uniqBy } from 'es-toolkit/compat';
import { produce } from 'immer';
import { type SWRResponse } from 'swr';
import useSWR from 'swr';

import { type AddIdentityEntryResult } from '@/database/models/userMemory';
import { memoryCRUDService, userMemoryService } from '@/services/userMemory';
import { type StoreSetter } from '@/store/types';
import { setNamespace } from '@/utils/storeDebug';

import { type UserMemoryStore } from '../../store';

const n = setNamespace('userMemory/identity');

export interface IdentityQueryParams {
  page?: number;
  pageSize?: number;
  q?: string;
  relationships?: string[];
  sort?: 'capturedAt' | 'type';
  types?: string[];
}

type Setter = StoreSetter<UserMemoryStore>;
export const createIdentitySlice = (set: Setter, get: () => UserMemoryStore, _api?: unknown) =>
  new IdentityActionImpl(set, get, _api);

export class IdentityActionImpl {
  readonly #get: () => UserMemoryStore;
  readonly #set: Setter;

  constructor(set: Setter, get: () => UserMemoryStore, _api?: unknown) {
    void _api;
    this.#set = set;
    this.#get = get;
  }

  createIdentity = async (data: NewUserMemoryIdentity): Promise<AddIdentityEntryResult> => {
    const result = await memoryCRUDService.createIdentity(data);
    // Reset list to refresh
    this.#get().resetIdentitiesList({
      q: this.#get().identitiesQuery,
      relationships: this.#get().identitiesRelationships,
      sort: this.#get().identitiesSort,
      types: this.#get().identitiesTypes,
    });
    return result;
  };

  deleteIdentity = async (id: string): Promise<void> => {
    await memoryCRUDService.deleteIdentity(id);
    // Reset list to refresh
    this.#get().resetIdentitiesList({
      q: this.#get().identitiesQuery,
      relationships: this.#get().identitiesRelationships,
      sort: this.#get().identitiesSort,
      types: this.#get().identitiesTypes,
    });
  };

  loadMoreIdentities = (): void => {
    const { identitiesPage, identitiesTotal, identities } = this.#get();
    if (identities.length < (identitiesTotal || 0)) {
      this.#set(
        produce((draft) => {
          draft.identitiesPage = identitiesPage + 1;
        }),
        false,
        n('loadMoreIdentities'),
      );
    }
  };

  resetIdentitiesList = (params?: Omit<IdentityQueryParams, 'page' | 'pageSize'>): void => {
    this.#set(
      produce((draft) => {
        draft.identities = [];
        draft.identitiesPage = 1;
        draft.identitiesQuery = params?.q;
        draft.identitiesRelationships = params?.relationships;
        draft.identitiesSearchLoading = true;
        draft.identitiesSort = params?.sort;
        draft.identitiesTypes = params?.types;
      }),
      false,
      n('resetIdentitiesList'),
    );
  };

  updateIdentity = async (id: string, data: UpdateUserMemoryIdentity): Promise<boolean> => {
    const result = await memoryCRUDService.updateIdentity(id, data);
    // Reset list to refresh
    this.#get().resetIdentitiesList({
      q: this.#get().identitiesQuery,
      relationships: this.#get().identitiesRelationships,
      sort: this.#get().identitiesSort,
      types: this.#get().identitiesTypes,
    });
    return result;
  };

  useFetchIdentities = (params: IdentityQueryParams): SWRResponse<IdentityListResult> => {
    const swrKeyParts = [
      'useFetchIdentities',
      params.page,
      params.pageSize,
      params.q,
      params.relationships?.join(','),
      params.sort,
      params.types?.join(','),
    ];
    const swrKey = swrKeyParts
      .filter((part) => part !== undefined && part !== null && part !== '')
      .join('-');
    const page = params.page ?? 1;

    return useSWR(
      swrKey,
      async () => {
        // Use the new dedicated queryIdentities API
        return userMemoryService.queryIdentities({
          page: params.page,
          pageSize: params.pageSize,
          q: params.q,
          relationships: params.relationships,
          sort: params.sort,
          types: params.types,
        });
      },
      {
        onSuccess: (data: IdentityListResult) => {
          this.#set(
            produce((draft) => {
              draft.identitiesSearchLoading = false;
              draft.identitiesTotal = data.total;

              if (!draft.identitiesInit) {
                draft.identitiesInit = true;
              }

              // Backend now returns flat structure directly, no transformation needed
              if (page === 1) {
                draft.identities = uniqBy(data.items, 'id');
              } else {
                draft.identities = uniqBy([...draft.identities, ...data.items], 'id');
              }

              draft.identitiesHasMore = data.items.length >= (params.pageSize || 20);
            }),
            false,
            n('useFetchIdentities/onSuccess'),
          );
        },
        revalidateOnFocus: false,
      },
    );
  };
}

export type IdentityAction = Pick<IdentityActionImpl, keyof IdentityActionImpl>;
