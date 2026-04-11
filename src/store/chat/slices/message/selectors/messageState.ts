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

import { type ChatStoreState } from '../../../initialState';
import { operationSelectors } from '../../operation/selectors';
import { mainDisplayChatIDs } from './chat';
import { getDbMessageByToolCallId } from './dbMessage';
import { getDisplayMessageById } from './displayMessage';

const isMessageEditing = (id: string) => (s: ChatStoreState) => s.messageEditingIds.includes(id);

/**
 * Check if a message is in loading state
 * Priority: operation system (for AI flows) > legacy messageLoadingIds (for CRUD operations)
 */
const isMessageLoading = (id: string) => (s: ChatStoreState) => {
  // First check operation system (sendMessage, etc.)
  const hasOperation = operationSelectors.isMessageProcessing(id)(s);
  if (hasOperation) return true;

  // Fallback to legacy loading state (for non-operation CRUD)
  return s.messageLoadingIds.includes(id);
};

// Use operation system for AI-related loading states
const isMessageRegenerating = (id: string) => (s: ChatStoreState) =>
  operationSelectors.isMessageRegenerating(id)(s);
const isMessageContinuing = (id: string) => (s: ChatStoreState) =>
  operationSelectors.isMessageContinuing(id)(s);
const isMessageGenerating = (id: string) => (s: ChatStoreState) =>
  operationSelectors.isMessageGenerating(id)(s); // Only check generateAI operations
const isMessageInChatReasoning = (id: string) => (s: ChatStoreState) =>
  operationSelectors.isMessageInReasoning(id)(s);

// Use operation system for message CRUD operations
const isMessageCreating = (id: string) => (s: ChatStoreState) =>
  operationSelectors.isMessageCreating(id)(s); // Only check sendMessage operations

const isMessageCollapsed = (id: string) => (s: ChatStoreState) => {
  const message = getDisplayMessageById(id)(s);
  return message?.metadata?.collapsed ?? false;
};

// Use operation system for plugin API invocation
const isPluginApiInvoking = (id: string) => (s: ChatStoreState) =>
  operationSelectors.isMessageInToolCalling(id)(s);

const isToolCallStreaming = (id: string, index: number) => (s: ChatStoreState) => {
  const isLoading = s.toolCallingStreamIds[id];

  if (!isLoading) return false;

  return isLoading[index];
};

const isInToolsCalling = (id: string, index: number) => (s: ChatStoreState) => {
  const isStreamingToolsCalling = isToolCallStreaming(id, index)(s);

  // Check if assistant message has any tool calling operations
  const isInvokingPluginApi = operationSelectors.isMessageInToolCalling(id)(s);

  return isStreamingToolsCalling || isInvokingPluginApi;
};

const isToolApiNameShining =
  (messageId: string, index: number, toolCallId: string) => (s: ChatStoreState) => {
    const toolMessageId = getDbMessageByToolCallId(toolCallId)(s)?.id;
    const isStreaming = isToolCallStreaming(messageId, index)(s);
    const isPluginInvoking = !toolMessageId ? true : isPluginApiInvoking(toolMessageId)(s);

    return isStreaming || isPluginInvoking;
  };

const isCreatingMessage = (s: ChatStoreState) => s.isCreatingMessage;

const isHasMessageLoading = (s: ChatStoreState) =>
  s.messageLoadingIds.some((id) => mainDisplayChatIDs(s).includes(id));

/**
 * this function is used to determine whether the send button should be disabled
 */
const isSendButtonDisabledByMessage = (s: ChatStoreState) =>
  // 1. when there is message loading
  isHasMessageLoading(s) ||
  // 2. when is creating the topic
  s.creatingTopic ||
  // 3. when is creating the message
  isCreatingMessage(s);

export const messageStateSelectors = {
  isCreatingMessage,
  isHasMessageLoading,
  isInToolsCalling,
  isMessageCollapsed,
  isMessageContinuing,
  isMessageCreating,
  isMessageEditing,
  isMessageGenerating,
  isMessageInChatReasoning,
  isMessageLoading,
  isMessageRegenerating,
  isPluginApiInvoking,
  isSendButtonDisabledByMessage,
  isToolApiNameShining,
  isToolCallStreaming,
};
