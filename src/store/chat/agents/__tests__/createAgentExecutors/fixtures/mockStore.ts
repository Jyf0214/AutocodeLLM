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

import { nanoid } from '@lobechat/utils';
import { vi } from 'vitest';

import { type ChatStore } from '@/store/chat/store';

/**
 * Create a mock ChatStore for testing executors
 * All methods are mocked with vi.fn() and can be customized
 */
export const createMockStore = (overrides: Partial<ChatStore> = {}): ChatStore => {
  const operations: Record<string, any> = {};
  const messageOperationMap: Record<string, string> = {};
  const operationsByMessage: Record<string, string[]> = {};
  const dbMessagesMap: Record<string, any[]> = {};

  const store = {
    // Other store properties (add as needed)
    activeAgentId: 'test-session',

    activeTopicId: 'test-topic',

    associateMessageWithOperation: vi.fn().mockImplementation((messageId, operationId) => {
      messageOperationMap[messageId] = operationId;

      if (!operationsByMessage[messageId]) {
        operationsByMessage[messageId] = [];
      }
      if (!operationsByMessage[messageId].includes(operationId)) {
        operationsByMessage[messageId].push(operationId);
      }
    }),

    cancelOperation: vi.fn().mockImplementation((operationId) => {
      if (operations[operationId]) {
        operations[operationId].abortController.abort();
        operations[operationId].status = 'cancelled';
      }
    }),

    completeOperation: vi.fn().mockImplementation((operationId) => {
      if (operations[operationId]) {
        operations[operationId].status = 'completed';
        operations[operationId].metadata.endTime = Date.now();
      }
    }),

    // Message state
    dbMessagesMap,

    failOperation: vi.fn().mockImplementation((operationId, error) => {
      if (operations[operationId]) {
        operations[operationId].status = 'failed';
        operations[operationId].metadata.error = error;
        operations[operationId].metadata.endTime = Date.now();
      }
    }),

    // AI chat methods
    internal_dispatchMessage: vi.fn(),

    internal_invokeDifferentTypePlugin: vi.fn().mockResolvedValue({ error: null }),

    internal_toggleToolCallingStreaming: vi.fn(),

    internal_transformToolCalls: vi.fn().mockImplementation((toolCalls: any[]) =>
      toolCalls.map((tc: any) => ({
        apiName: tc.function?.name?.split('____')[1] || tc.function?.name || 'unknown',
        arguments: tc.function?.arguments || '{}',
        id: tc.id,
        identifier: tc.function?.name?.split('____')[0] || 'unknown',
        type: 'default',
      })),
    ),

    messageOperationMap,

    onOperationCancel: vi.fn(),

    // Operation state
    operations,

    operationsByContext: {},

    operationsByMessage,

    operationsByType: {} as any,

    optimisticAddToolToAssistantMessage: vi.fn().mockResolvedValue(undefined),

    // Message management methods
    optimisticCreateMessage: vi.fn().mockImplementation(async (params) => {
      const id = nanoid();
      const message = { id, ...params, createdAt: Date.now(), updatedAt: Date.now() };
      return message;
    }),

    optimisticUpdateMessageContent: vi.fn().mockResolvedValue(undefined),

    optimisticUpdateMessageError: vi.fn().mockResolvedValue(undefined),

    optimisticUpdateMessagePlugin: vi.fn().mockResolvedValue(undefined),

    optimisticUpdateMessagePluginError: vi.fn().mockResolvedValue(undefined),

    optimisticUpdatePluginArguments: vi.fn().mockResolvedValue(undefined),

    optimisticUpdatePluginState: vi.fn().mockResolvedValue(undefined),

    // Operation management methods
    startOperation: vi.fn().mockImplementation((config) => {
      const operationId = `op_${nanoid()}`;
      const abortController = new AbortController();

      const operation = {
        abortController,
        childOperationIds: [],
        context: config.context || {},
        id: operationId,
        metadata: config.metadata || { startTime: Date.now() },
        parentOperationId: config.parentOperationId,
        status: 'running',
        type: config.type,
      };

      operations[operationId] = operation;

      // Auto-associate message with operation if messageId exists
      if (config.context?.messageId) {
        messageOperationMap[config.context.messageId] = operationId;

        if (!operationsByMessage[config.context.messageId]) {
          operationsByMessage[config.context.messageId] = [];
        }
        operationsByMessage[config.context.messageId].push(operationId);
      }

      return { abortController, operationId };
    }),
    updateOperationMetadata: vi.fn().mockImplementation((operationId, metadata) => {
      if (operations[operationId]) {
        operations[operationId].metadata = {
          ...operations[operationId].metadata,
          ...metadata,
        };
      }
    }),

    ...overrides,
  } as unknown as ChatStore;

  return store;
};
