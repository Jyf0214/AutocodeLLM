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

import { type Operation, type OperationType, type QueuedMessage } from './types';

/**
 * Chat Operation State
 * Unified state for all async operations
 */
export interface ChatOperationState {
  /**
   * Message to operation mapping (for automatic context retrieval)
   * key: messageId, value: operationId
   */
  messageOperationMap: Record<string, string>;

  /**
   * All operations map, key is operationId
   */
  operations: Record<string, Operation>;

  /**
   * Operations indexed by agent/topic
   * key: messageMapKey(agentId, topicId), value: operationId[]
   */
  operationsByContext: Record<string, string[]>;

  /**
   * Operations indexed by message
   * key: messageId, value: operationId[]
   */
  operationsByMessage: Record<string, string[]>;

  /**
   * Operations indexed by type (for fast querying)
   * key: OperationType, value: operationId[]
   */
  operationsByType: Record<OperationType, string[]>;

  /**
   * Message queue per conversation context.
   * key: contextKey (messageMapKey), value: queued messages
   * Messages are consumed either by the running step loop (injection)
   * or by triggering a new sendMessage when no operation is running.
   */
  queuedMessages: Record<string, QueuedMessage[]>;

  /**
   * Agent IDs with unread completed generation
   */
  unreadCompletedAgentIds: Set<string>;

  /**
   * Topic IDs with unread completed generation
   */
  unreadCompletedTopicIds: Set<string>;
}

export const initialOperationState: ChatOperationState = {
  messageOperationMap: {},
  operations: {},
  operationsByContext: {},
  operationsByMessage: {},
  operationsByType: {} as Record<OperationType, string[]>,
  queuedMessages: {},
  unreadCompletedAgentIds: new Set(),
  unreadCompletedTopicIds: new Set(),
};
