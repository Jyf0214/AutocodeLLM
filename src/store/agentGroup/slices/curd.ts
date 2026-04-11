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

import { type LobeChatGroupConfig } from '@lobechat/types';

import { DEFAULT_CHAT_GROUP_CHAT_CONFIG } from '@/const/settings';
import { type ChatGroupItem } from '@/database/schemas/chatGroup';
import { chatGroupService } from '@/services/chatGroup';
import { type ChatGroupStore } from '@/store/agentGroup/store';
import { type StoreSetter } from '@/store/types';

import { agentGroupSelectors } from '../selectors';

type Setter = StoreSetter<ChatGroupStore>;

type ChatGroupStoreWithInternal = ChatGroupStore & {
  internal_dispatchChatGroup: (payload: {
    payload: { id: string; value: Partial<ChatGroupItem> };
    type: 'updateGroup';
  }) => void;
  refreshGroupDetail: (groupId: string) => Promise<void>;
};

export class ChatGroupCurdAction {
  readonly #get: () => ChatGroupStoreWithInternal;
  readonly #set: Setter;

  constructor(set: Setter, get: () => ChatGroupStoreWithInternal, _api?: unknown) {
    // keep signature aligned with StateCreator params: (set, get, api)
    void _api;

    this.#set = set;
    this.#get = get;
  }

  /**
   * Append content chunk to streaming system prompt
   */
  appendStreamingSystemPrompt = (chunk: string) => {
    const currentContent = this.#get().streamingSystemPrompt || '';
    this.#set(
      { streamingSystemPrompt: currentContent + chunk },
      false,
      'appendStreamingSystemPrompt',
    );
  };

  /**
   * Finish streaming and save final content to group config
   */
  finishStreamingSystemPrompt = async () => {
    const { streamingSystemPrompt } = this.#get();

    if (!streamingSystemPrompt) {
      this.#set({ streamingSystemPromptInProgress: false }, false, 'finishStreamingSystemPrompt');
      return;
    }

    // Save the streamed content to group config
    await this.updateGroupConfig({ systemPrompt: streamingSystemPrompt });

    // Reset streaming state
    this.#set(
      {
        streamingSystemPrompt: undefined,
        streamingSystemPromptInProgress: false,
      },
      false,
      'finishStreamingSystemPrompt',
    );
  };

  /**
   * Start streaming system prompt update
   */
  startStreamingSystemPrompt = () => {
    this.#set(
      {
        streamingSystemPrompt: '',
        streamingSystemPromptInProgress: true,
      },
      false,
      'startStreamingSystemPrompt',
    );
  };

  updateGroup = async (id: string, value: Partial<ChatGroupItem>) => {
    await chatGroupService.updateGroup(id, value);
    this.#get().internal_dispatchChatGroup({ payload: { id, value }, type: 'updateGroup' });
    await this.#get().refreshGroupDetail(id);
  };

  updateGroupConfig = async (config: Partial<LobeChatGroupConfig>) => {
    const group = agentGroupSelectors.currentGroup(this.#get());
    if (!group) return;

    const mergedConfig = {
      ...DEFAULT_CHAT_GROUP_CHAT_CONFIG,
      ...group.config,
      ...config,
    };

    // Update the database first
    await chatGroupService.updateGroup(group.id, { config: mergedConfig });

    // Immediately update the local store to ensure configuration is available
    // Note: reducer expects payload: { id, value }
    this.#get().internal_dispatchChatGroup({
      payload: { id: group.id, value: { config: mergedConfig } },
      type: 'updateGroup',
    });

    // Refresh groups to ensure consistency
    await this.#get().refreshGroupDetail(group.id);
  };

  updateGroupMeta = async (meta: Partial<ChatGroupItem>) => {
    const group = agentGroupSelectors.currentGroup(this.#get());
    if (!group) return;

    const id = group.id;

    await chatGroupService.updateGroup(id, meta);
    // Keep local store in sync immediately
    this.#get().internal_dispatchChatGroup({ payload: { id, value: meta }, type: 'updateGroup' });
    await this.#get().refreshGroupDetail(id);
  };
}
