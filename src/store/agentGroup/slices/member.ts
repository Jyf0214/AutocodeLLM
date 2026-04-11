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

import { type LobeAgentConfig } from '@lobechat/types';
import { type PartialDeep } from 'type-fest';

import { chatGroupService } from '@/services/chatGroup';
import { getAgentStoreState } from '@/store/agent';
import { type ChatGroupStore } from '@/store/agentGroup/store';

type ChatGroupStoreWithRefresh = ChatGroupStore & {
  refreshGroupDetail: (groupId: string) => Promise<void>;
};

export class ChatGroupMemberAction {
  readonly #get: () => ChatGroupStoreWithRefresh;

  constructor(_set: unknown, get: () => ChatGroupStoreWithRefresh, _api?: unknown) {
    // keep signature aligned with StateCreator params: (set, get, api)
    void _set;
    void _api;

    this.#get = get;
  }

  addAgentsToGroup = async (groupId: string, agentIds: string[]) => {
    await chatGroupService.addAgentsToGroup(groupId, agentIds);
    await this.#get().refreshGroupDetail(groupId);
  };

  removeAgentFromGroup = async (groupId: string, agentId: string) => {
    await chatGroupService.removeAgentsFromGroup(groupId, [agentId]);
    await this.#get().refreshGroupDetail(groupId);
  };

  reorderGroupMembers = async (groupId: string, orderedAgentIds: string[]) => {
    await Promise.all(
      orderedAgentIds.map((agentId, index) =>
        chatGroupService.updateAgentInGroup(groupId, agentId, { order: index }),
      ),
    );

    await this.#get().refreshGroupDetail(groupId);
  };

  /**
   * Update member agent config in group
   * Persists to database via agentStore and refreshes group detail to sync UI
   */
  updateMemberAgentConfig = async (
    groupId: string,
    agentId: string,
    config: PartialDeep<LobeAgentConfig>,
  ) => {
    // 1. Persist to database via agentStore
    const agentStore = getAgentStoreState();
    await agentStore.updateAgentConfigById(agentId, config);

    // 2. Refresh group detail to sync the updated agent data to groupMap
    await this.#get().refreshGroupDetail(groupId);
  };
}
