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

import {
  type CompressionGroupMetadata,
  type ConversationContext,
  type UIChatMessage,
} from '@lobechat/types';

import { type Operation } from '../slices/operation/types';

export const isCompressionOperationType = (type?: string) =>
  type === 'contextCompression' || type === 'generateSummary';

export const getCompressionCandidateMessageIds = (messages: UIChatMessage[]) =>
  messages
    .filter((message) => message.role !== 'compressedGroup')
    .map((message) => message.id)
    .filter(Boolean);

export const createPendingCompressedGroup = ({
  agentId,
  content = '...',
  groupId,
  id,
  threadId,
  topicId,
}: {
  agentId: string;
  content?: string;
  groupId?: string | null;
  id: string;
  threadId?: string | null;
  topicId?: string | null;
}): UIChatMessage => {
  const now = Date.now();
  const metadata: CompressionGroupMetadata = { expanded: true };

  return {
    agentId,
    compressedMessages: [],
    content,
    createdAt: now,
    groupId: groupId ?? undefined,
    id,
    metadata: metadata as UIChatMessage['metadata'],
    role: 'compressedGroup',
    threadId: threadId ?? undefined,
    topicId: topicId ?? undefined,
    updatedAt: now,
  };
};

export const hasRunningCompressionOperation = (
  operations: Operation[],
  context: Pick<ConversationContext, 'agentId' | 'groupId' | 'threadId' | 'topicId'>,
) =>
  operations.some((operation) => {
    if (operation.status !== 'running' || !isCompressionOperationType(operation.type)) return false;

    return (
      operation.context.agentId === context.agentId &&
      (operation.context.groupId ?? null) === (context.groupId ?? null) &&
      (operation.context.threadId ?? null) === (context.threadId ?? null) &&
      (operation.context.topicId ?? null) === (context.topicId ?? null)
    );
  });
