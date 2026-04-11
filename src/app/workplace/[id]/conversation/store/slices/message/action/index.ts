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

import type { StateCreator } from 'zustand';

import type { Store as ConversationStore } from '../../../action';
import { type MessageCRUDAction, messageCRUDSlice } from './crud';
import { type MessageReactionAction, messageReactionSlice } from './reaction';
import { sendMessage } from './sendMessage';
import type { MessageStateAction } from './state';
import { messageStateSlice } from './state';

/**
 * Message Actions
 *
 * Handles all message operations:
 * - CRUD (create, read, update, delete)
 * - Reaction (add, remove emoji reactions)
 * - State management (loading, collapsed, editing)
 * - Sending messages
 */
export interface MessageAction
  extends MessageCRUDAction, MessageReactionAction, MessageStateAction {
  /**
   * Add an AI message (convenience method)
   */
  addAIMessage: (content: string) => Promise<string | undefined>;

  /**
   * Add a user message (convenience method)
   */
  addUserMessage: (params: { fileList?: string[]; message: string }) => Promise<string | undefined>;

  /**
   * Send a message in this conversation (unified Main + Thread)
   */
  sendMessage: ReturnType<typeof sendMessage>;
}

export const messageSlice: StateCreator<
  ConversationStore,
  [['zustand/devtools', never]],
  [],
  MessageAction
> = (set, get, ...rest) => ({
  // Spread CRUD actions
  ...messageCRUDSlice(set, get, ...rest),

  // Spread reaction actions
  ...messageReactionSlice(set, get, ...rest),

  // Spread state actions
  ...messageStateSlice(set, get, ...rest),

  // Convenience methods
  addAIMessage: async (content: string) => {
    const state = get();
    const { context, hooks } = state;
    const { agentId, topicId, threadId } = context;

    // Get parent message ID
    const displayMessages = state.displayMessages;
    const parentId = displayMessages.length > 0 ? displayMessages.at(-1)?.id : undefined;

    const id = await state.createMessage({
      agentId,
      content,
      parentId,
      role: 'assistant',
      threadId: threadId ?? undefined,
      topicId: topicId ?? undefined,
    });

    if (id) {
      // ===== Hook: onMessageCreated =====
      if (hooks.onMessageCreated) {
        const message = state.displayMessages.find((m) => m.id === id);
        if (message) {
          hooks.onMessageCreated(message);
        }
      }

      // Clear input after successful creation
      set({ inputMessage: '' });
    }

    return id;
  },

  addUserMessage: async ({ message, fileList }) => {
    const state = get();
    const { context, hooks } = state;
    const { agentId, topicId, threadId } = context;

    // Get parent message ID
    const displayMessages = state.displayMessages;
    const parentId = displayMessages.length > 0 ? displayMessages.at(-1)?.id : undefined;

    const id = await state.createMessage({
      agentId,
      content: message,
      files: fileList,
      parentId,
      role: 'user',
      threadId: threadId ?? undefined,
      topicId: topicId ?? undefined,
    });

    if (id) {
      // ===== Hook: onMessageCreated =====
      if (hooks.onMessageCreated) {
        const createdMessage = state.displayMessages.find((m) => m.id === id);
        if (createdMessage) {
          hooks.onMessageCreated(createdMessage);
        }
      }

      // Clear input after successful creation
      set({ inputMessage: '' });
    }

    return id;
  },

  // Send message
  sendMessage: sendMessage(set, get),
});
