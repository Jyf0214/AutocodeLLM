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

import { messageMapKey } from '@/store/chat/utils/messageMapKey';

import { type ChatStoreState } from '../../initialState';
import { operationSelectors } from '../operation/selectors';

const isMessageInReasoning = (id: string) => (s: ChatStoreState) =>
  operationSelectors.isMessageInReasoning(id)(s);

const isMessageInSearchWorkflow = (id: string) => (s: ChatStoreState) =>
  s.searchWorkflowLoadingIds.includes(id);

const isIntentUnderstanding = (id: string) => (s: ChatStoreState) =>
  isMessageInSearchWorkflow(id)(s);

const isCurrentSendMessageLoading = (s: ChatStoreState) => {
  const contextKey = messageMapKey({ agentId: s.activeAgentId, topicId: s.activeTopicId });
  const operationIds = s.operationsByContext[contextKey] || [];

  // Check if there's any running sendMessage operation
  return operationIds.some((opId) => {
    const op = s.operations[opId];
    return op && op.type === 'sendMessage' && op.status === 'running';
  });
};

const isCurrentSendMessageError = (s: ChatStoreState) => {
  const contextKey = messageMapKey({ agentId: s.activeAgentId, topicId: s.activeTopicId });
  const operationIds = s.operationsByContext[contextKey] || [];

  // Find the latest sendMessage operation with error
  for (const opId of [...operationIds].reverse()) {
    const op = s.operations[opId];
    if (op && op.type === 'sendMessage' && op.metadata.inputSendErrorMsg) {
      return op.metadata.inputSendErrorMsg;
    }
  }

  return undefined;
};

const isSendMessageLoadingForTopic = (topicKey: string) => (s: ChatStoreState) => {
  const operationIds = s.operationsByContext[topicKey] || [];

  // Check if there's any running sendMessage operation for this topic
  return operationIds.some((opId) => {
    const op = s.operations[opId];
    return op && op.type === 'sendMessage' && op.status === 'running';
  });
};

export const aiChatSelectors = {
  isCurrentSendMessageError,
  isCurrentSendMessageLoading,
  isIntentUnderstanding,
  isMessageInReasoning,
  isMessageInSearchWorkflow,
  isSendMessageLoadingForTopic,
};
