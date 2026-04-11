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

import { type SendMessageParams } from '@lobechat/types';

import { useChatStore } from '@/store/chat';

import { isLocalOnlyMessage } from '../../../../utils/localMessages';
import { type Store as ConversationStore } from '../../../action';

/**
 * Send a message in this conversation
 *
 * This is a simplified wrapper that:
 * 1. Calls lifecycle hooks
 * 2. Forwards to ChatStore.sendMessage with context
 * 3. Passes displayMessages to decouple from store selectors
 *
 * All actual message sending logic lives in ChatStore.
 */
export const sendMessage = (
  set: (partial: Partial<ConversationStore>) => void,
  get: () => ConversationStore,
) => {
  return async (params: SendMessageParams) => {
    const state = get();
    const { context, hooks, displayMessages } = state;

    // ===== Hook: onBeforeSendMessage =====
    if (hooks.onBeforeSendMessage) {
      const result = await hooks.onBeforeSendMessage(params);
      if (result === false) {
        console.info('[ConversationStore] sendMessage blocked by onBeforeSendMessage hook');
        return;
      }
    }

    // Keep ConversationStore in sync with the editor, which is cleared immediately on send.
    // Do this before awaiting the full streaming lifecycle so drafts typed during generation
    // are not overwritten when the request completes.
    set({ inputMessage: '' });

    // Get global chat store
    const chatStore = useChatStore.getState();
    const messages = (params.messages ?? displayMessages).filter(
      (message) => !isLocalOnlyMessage(message),
    );

    // Forward to ChatStore.sendMessage with context and messages
    // Pass displayMessages to decouple sendMessage from store selectors
    const result = await chatStore.sendMessage({
      ...params,
      context,
      messages,
    });

    // ===== Hook: onAfterMessageCreate =====
    // Called after messages are created but before AI response is complete
    if (result && hooks.onAfterMessageCreate) {
      await hooks.onAfterMessageCreate({
        assistantMessageId: result.assistantMessageId,
        createdThreadId: result.createdThreadId,
        userMessageId: result.userMessageId,
      });
    }

    // ===== Hook: onAfterSendMessage =====
    if (hooks.onAfterSendMessage) {
      await hooks.onAfterSendMessage();
    }
  };
};
