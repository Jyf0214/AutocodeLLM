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

import { parse } from '@lobechat/conversation-flow';
import { type ConversationContext, type UIChatMessage } from '@lobechat/types';
import isEqual from 'fast-deep-equal';
import { type SWRResponse } from 'swr';

import { mutate, useClientDataSWRWithSync } from '@/libs/swr';
import { messageService } from '@/services/message';
import { type ChatStore } from '@/store/chat/store';
import { type StoreSetter } from '@/store/types';

import { type MessageMapKeyInput } from '../../../utils/messageMapKey';
import { messageMapKey } from '../../../utils/messageMapKey';

const SWR_USE_FETCH_MESSAGES = 'SWR_USE_FETCH_MESSAGES';

/**
 * Data query and synchronization actions
 * Handles fetching, refreshing, and replacing message data
 */

type Setter = StoreSetter<ChatStore>;
export const messageQuery = (set: Setter, get: () => ChatStore, _api?: unknown) =>
  new MessageQueryActionImpl(set, get, _api);

export class MessageQueryActionImpl {
  readonly #get: () => ChatStore;
  readonly #set: Setter;

  constructor(set: Setter, get: () => ChatStore, _api?: unknown) {
    void _api;
    this.#set = set;
    this.#get = get;
  }

  refreshMessages = async (context?: Partial<ConversationContext>): Promise<void> => {
    const agentId = context?.agentId ?? this.#get().activeAgentId;
    const topicId = context?.topicId !== undefined ? context.topicId : this.#get().activeTopicId;
    // TODO: Support threadId refresh when needed
    await mutate([SWR_USE_FETCH_MESSAGES, agentId, topicId, 'session']);
    await mutate([SWR_USE_FETCH_MESSAGES, agentId, topicId, 'group']);
  };

  replaceMessages = (
    messages: UIChatMessage[],
    params?: {
      action?: any;

      context?: Partial<ConversationContext>;

      operationId?: string;
    },
  ): void => {
    let ctx: MessageMapKeyInput;

    // Priority 1: Use explicit context if provided (preserving scope)
    if (params?.context) {
      ctx = {
        agentId: params.context.agentId ?? this.#get().activeAgentId,
        // Preserve groupId from context
        groupId: params.context.groupId,
        // Preserve scope from context
        isNew: params.context.isNew,

        scope: params.context.scope,

        threadId: params.context.threadId,
        topicId:
          params.context.topicId !== undefined ? params.context.topicId : this.#get().activeTopicId,
      };
    }
    // Priority 2: Get full context from operation if operationId is provided (deprecated)
    else if (params?.operationId) {
      ctx = this.#get().internal_getConversationContext(params);
    }
    // Priority 3: Fallback to global state
    else {
      ctx = {
        agentId: this.#get().activeAgentId,
        groupId: this.#get().activeGroupId,
        threadId: this.#get().activeThreadId,
        topicId: this.#get().activeTopicId,
      };
    }

    const messagesKey = messageMapKey(ctx);

    // Get raw messages from dbMessagesMap and apply reducer
    const nextDbMap = { ...this.#get().dbMessagesMap, [messagesKey]: messages };

    if (isEqual(nextDbMap, this.#get().dbMessagesMap)) return;

    // Parse messages using conversation-flow
    const { flatList } = parse(messages);

    this.#set(
      {
        // Store raw messages from backend
        dbMessagesMap: nextDbMap,
        // Store parsed messages for display
        messagesMap: { ...this.#get().messagesMap, [messagesKey]: flatList },
      },
      false,
      params?.action ?? 'replaceMessages',
    );
  };

  useFetchMessages = (
    context: ConversationContext,
    skipFetch?: boolean,
  ): SWRResponse<UIChatMessage[]> => {
    // Skip fetch when skipFetch is true or required fields are missing
    const shouldFetch = !skipFetch && !!context.agentId && !!context.topicId;

    return useClientDataSWRWithSync<UIChatMessage[]>(
      shouldFetch ? ['CHAT_STORE_FETCH_MESSAGES', context] : null,
      () => messageService.getMessages(context),
      {
        onData: (data) => {
          if (!data || !context.topicId) return;

          // Use replaceMessages to store the fetched messages
          this.#get().replaceMessages(data, { action: 'useFetchMessages', context });
        },
      },
    );
  };
}

export type MessageQueryAction = Pick<MessageQueryActionImpl, keyof MessageQueryActionImpl>;
