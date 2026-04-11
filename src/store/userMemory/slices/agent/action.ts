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

import { omit } from 'es-toolkit';
import { type SWRResponse } from 'swr';

import { useClientDataSWRWithSync } from '@/libs/swr';
import { userMemoryService } from '@/services/userMemory';
import { type StoreSetter } from '@/store/types';
import { type RetrieveMemoryResult } from '@/types/userMemory';
import { setNamespace } from '@/utils/storeDebug';

import { type UserMemoryStore } from '../../store';

const n = setNamespace('userMemory/agent');

type Setter = StoreSetter<UserMemoryStore>;
export const createAgentMemorySlice = (set: Setter, get: () => UserMemoryStore, _api?: unknown) =>
  new AgentMemoryActionImpl(set, get, _api);

export class AgentMemoryActionImpl {
  readonly #get: () => UserMemoryStore;
  readonly #set: Setter;

  constructor(set: Setter, get: () => UserMemoryStore, _api?: unknown) {
    void _api;
    this.#set = set;
    this.#get = get;
  }

  clearTopicMemories = (topicId: string): void => {
    this.#set(
      { topicMemoriesMap: omit(this.#get().topicMemoriesMap, [topicId]) },
      false,
      n('clearTopicMemories', { topicId }),
    );
  };

  useFetchMemoriesForTopic = (topicId?: string | null): SWRResponse<RetrieveMemoryResult> => {
    return useClientDataSWRWithSync<RetrieveMemoryResult>(
      topicId ? ['useFetchMemoriesForTopic', topicId] : null,
      async () => {
        // Retrieve memories using topic's context
        // The backend will use topic info to build the query
        return await userMemoryService.retrieveMemoryForTopic(topicId!);
      },
      {
        onData: (data) => {
          if (!topicId || !data) return;

          this.#set(
            (state) => ({
              topicMemoriesMap: { ...state.topicMemoriesMap, [topicId]: data },
            }),
            false,
            n('useFetchMemoriesForTopic/success', {
              activitiesCount: data.activities?.length ?? 0,
              contextsCount: data.contexts?.length ?? 0,
              experiencesCount: data.experiences?.length ?? 0,
              preferencesCount: data.preferences?.length ?? 0,
              topicId,
            }),
          );
        },
        revalidateOnFocus: false,
      },
    );
  };
}

export type AgentMemoryAction = Pick<AgentMemoryActionImpl, keyof AgentMemoryActionImpl>;
