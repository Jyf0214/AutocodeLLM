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

import { type AgentItem, type LobeAgentConfig } from '@lobechat/types';
import { type SWRResponse } from 'swr';
import { type PartialDeep } from 'type-fest';

import { useOnlyFetchOnceSWR } from '@/libs/swr';
import { agentService } from '@/services/agent';
import { type StoreSetter } from '@/store/types';

import { type AgentStore } from '../../store';

interface UseInitBuiltinAgentContext {
  /**
   * Whether the user is logged in.
   * When false or undefined, the hook will not fetch the agent.
   */
  isLogin?: boolean;
}

/**
 * Builtin Agent Slice Actions
 * Handles initialization and management of builtin agents (page-agent, inbox, etc.)
 */

type Setter = StoreSetter<AgentStore>;
export const createBuiltinAgentSlice = (set: Setter, get: () => AgentStore, _api?: unknown) =>
  new BuiltinAgentSliceActionImpl(set, get, _api);

export class BuiltinAgentSliceActionImpl {
  readonly #get: () => AgentStore;
  readonly #set: Setter;

  constructor(set: Setter, get: () => AgentStore, _api?: unknown) {
    void _api;
    this.#set = set;
    this.#get = get;
  }

  refreshBuiltinAgent = async (slug: string): Promise<void> => {
    const data = await agentService.getBuiltinAgent(slug);
    if (data?.id) {
      this.#get().internal_dispatchAgentMap(data.id, data as PartialDeep<LobeAgentConfig>);
    }
  };

  useInitBuiltinAgent = (
    slug: string,
    context?: UseInitBuiltinAgentContext,
  ): SWRResponse<AgentItem | null> => {
    return useOnlyFetchOnceSWR(
      context?.isLogin === false ? null : `initBuiltinAgent:${slug}`,
      async () => {
        const data = await agentService.getBuiltinAgent(slug);

        return data as AgentItem | null;
      },
      {
        onSuccess: (data: AgentItem | null) => {
          if (data?.id) {
            // Update builtinAgentIdMap with the agent id
            // Update agentMap with the agent config
            // AgentItem contains all fields needed for LobeAgentConfig
            this.#get().internal_dispatchAgentMap(data.id, data as PartialDeep<LobeAgentConfig>);

            this.#set(
              { builtinAgentIdMap: { ...this.#get().builtinAgentIdMap, [slug]: data.id } },
              false,
              `useInitBuiltinAgent/${slug}`,
            );
          }
        },
      },
    );
  };
}

export type BuiltinAgentSliceAction = Pick<
  BuiltinAgentSliceActionImpl,
  keyof BuiltinAgentSliceActionImpl
>;
