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

import { chainSummaryHistory } from '@lobechat/prompts';
import { type UIChatMessage } from '@lobechat/types';
import { TraceNameMap } from '@lobechat/types';

import { chatService } from '@/services/chat';
import { topicService } from '@/services/topic';
import { type ChatStore } from '@/store/chat';
import { type StoreSetter } from '@/store/types';
import { useUserStore } from '@/store/user';
import { systemAgentSelectors } from '@/store/user/selectors';

type Setter = StoreSetter<ChatStore>;
export const chatMemory = (set: Setter, get: () => ChatStore, _api?: unknown) =>
  new ChatMemoryActionImpl(set, get, _api);

export class ChatMemoryActionImpl {
  readonly #get: () => ChatStore;

  constructor(set: Setter, get: () => ChatStore, _api?: unknown) {
    void _api;
    void set;
    this.#get = get;
  }

  internal_summaryHistory = async (messages: UIChatMessage[]): Promise<void> => {
    const topicId = this.#get().activeTopicId;
    if (messages.length <= 1 || !topicId) return;

    const { model, provider } = systemAgentSelectors.historyCompress(useUserStore.getState());

    let historySummary = '';
    await chatService.fetchPresetTaskResult({
      onFinish: async (text) => {
        historySummary = text;
      },
      params: { ...chainSummaryHistory(messages), model, provider, stream: false },
      trace: {
        sessionId: this.#get().activeAgentId,
        topicId: this.#get().activeTopicId,
        traceName: TraceNameMap.SummaryHistoryMessages,
      },
    });

    await topicService.updateTopic(topicId, {
      historySummary,
      metadata: { model, provider },
    });
    await this.#get().refreshTopic();
    await this.#get().refreshMessages();
  };
}

export type ChatMemoryAction = Pick<ChatMemoryActionImpl, keyof ChatMemoryActionImpl>;
