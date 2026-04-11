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

import { type StateCreator } from 'zustand';

import { useChatStore } from '@/store/chat';

import { type Store as ConversationStore } from '../../action';
import { dataSelectors } from '../data/selectors';

/**
 * Tool Interaction Actions
 *
 * Handles tool call approval and rejection
 */
export interface ToolAction {
  /**
   * Approve a tool call
   */
  approveToolCall: (toolMessageId: string, assistantGroupId: string) => Promise<void>;

  cancelToolInteraction: (toolMessageId: string) => Promise<void>;

  /**
   * Reject a tool call and continue the conversation
   */
  rejectAndContinueToolCall: (toolMessageId: string, reason?: string) => Promise<void>;

  /**
   * Reject a tool call
   */
  rejectToolCall: (toolMessageId: string, reason?: string) => Promise<void>;

  skipToolInteraction: (toolMessageId: string, reason?: string) => Promise<void>;

  submitToolInteraction: (
    toolMessageId: string,
    response: Record<string, unknown>,
  ) => Promise<void>;
}

export const toolSlice: StateCreator<
  ConversationStore,
  [['zustand/devtools', never]],
  [],
  ToolAction
> = (set, get) => ({
  approveToolCall: async (toolMessageId: string, assistantGroupId: string) => {
    const state = get();
    const { hooks, context, waitForPendingArgsUpdate } = state;

    // Wait for any pending args update to complete before approval
    await waitForPendingArgsUpdate(toolMessageId);

    // ===== Hook: onToolApproved =====
    if (hooks.onToolApproved) {
      const shouldProceed = await hooks.onToolApproved(toolMessageId);
      if (shouldProceed === false) return;
    }

    // Delegate to global ChatStore with context for correct conversation scope
    const chatStore = useChatStore.getState();
    await chatStore.approveToolCalling(toolMessageId, assistantGroupId, context);

    // ===== Hook: onToolCallComplete =====
    if (hooks.onToolCallComplete) {
      hooks.onToolCallComplete(toolMessageId, undefined);
    }
  },

  cancelToolInteraction: async (toolMessageId: string) => {
    const { context } = get();
    const chatStore = useChatStore.getState();
    await chatStore.cancelToolInteraction(toolMessageId, context);
  },

  rejectAndContinueToolCall: async (toolMessageId: string, reason?: string) => {
    const { context, waitForPendingArgsUpdate } = get();

    // Wait for any pending args update to complete before rejection
    await waitForPendingArgsUpdate(toolMessageId);

    // First reject the tool call
    await get().rejectToolCall(toolMessageId, reason);

    // Then delegate to ChatStore to continue the conversation with context
    const chatStore = useChatStore.getState();
    await chatStore.rejectAndContinueToolCalling(toolMessageId, reason, context);
  },

  rejectToolCall: async (toolMessageId: string, reason?: string) => {
    const state = get();
    const { hooks, updateMessagePlugin, updateMessageContent, waitForPendingArgsUpdate } = state;

    // Wait for any pending args update to complete before rejection
    await waitForPendingArgsUpdate(toolMessageId);

    // ===== Hook: onToolRejected =====
    if (hooks.onToolRejected) {
      const shouldProceed = await hooks.onToolRejected(toolMessageId, reason);
      if (shouldProceed === false) return;
    }

    const toolMessage = dataSelectors.getDbMessageById(toolMessageId)(state);
    if (!toolMessage) return;

    // Update intervention status to rejected
    await updateMessagePlugin(toolMessageId, {
      intervention: {
        rejectedReason: reason,
        status: 'rejected',
      },
    });

    // Update tool message content with rejection reason
    const toolContent = !!reason
      ? `User reject this tool calling with reason: ${reason}`
      : 'User reject this tool calling without reason';

    await updateMessageContent(toolMessageId, toolContent);
  },

  skipToolInteraction: async (toolMessageId: string, reason?: string) => {
    const { context } = get();
    const chatStore = useChatStore.getState();
    await chatStore.skipToolInteraction(toolMessageId, reason, context);
  },

  submitToolInteraction: async (toolMessageId: string, response: Record<string, unknown>) => {
    const { context } = get();
    const chatStore = useChatStore.getState();
    await chatStore.submitToolInteraction(toolMessageId, response, context);
  },
});
