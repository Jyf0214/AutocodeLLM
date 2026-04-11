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

import { type UIChatMessage } from '@lobechat/types';

import { DEFAULT_AGENT_CHAT_CONFIG, DEFAULT_AGENT_CONFIG } from '@/const/settings';
import { type ResolvedAgentConfig } from '@/services/chat/mecha';

// Test Constants
export const TEST_IDS = {
  ASSISTANT_MESSAGE_ID: 'test-assistant-message-id',
  FILE_ID: 'test-file-id',
  MESSAGE_ID: 'test-message-id',
  NEW_MESSAGE_ID: 'new-message-id',
  NEW_TOPIC_ID: 'new-topic-id',
  SESSION_ID: 'test-session-id',
  TOPIC_ID: 'test-topic-id',
  USER_MESSAGE_ID: 'test-user-message-id',
} as const;

export const TEST_CONTENT = {
  AI_RESPONSE: 'Test AI response',
  EMPTY: '',
  RAG_QUERY: 'Test RAG query',
  USER_MESSAGE: 'Test user message',
} as const;

// Mock Data Factories
export const createMockMessage = (overrides: Partial<UIChatMessage> = {}): UIChatMessage => {
  const base: any = {
    content: TEST_CONTENT.USER_MESSAGE,
    createdAt: Date.now(),
    id: TEST_IDS.MESSAGE_ID,
    role: 'user',
    sessionId: TEST_IDS.SESSION_ID,
    topicId: TEST_IDS.TOPIC_ID,
    updatedAt: Date.now(),
  };

  // Merge overrides, preserving all provided properties
  return { ...base, ...overrides } as UIChatMessage;
};

export const createMockMessages = (count: number): UIChatMessage[] =>
  Array.from({ length: count }, (_, i: any) =>
    createMockMessage({
      content: `Message ${i}`,
      id: `msg-${i}`,
    }),
  );

export const createMockAgentConfig = (overrides: any = {}) => ({
  ...DEFAULT_AGENT_CONFIG,
  ...overrides,
});

export const createMockChatConfig = (overrides: any = {}) => ({
  ...DEFAULT_AGENT_CHAT_CONFIG,
  ...overrides,
});

// Mock Store State Factory
export const createMockStoreState = (overrides: any = {}) => ({
  activeAgentId: TEST_IDS.SESSION_ID,
  activeTopicId: TEST_IDS.TOPIC_ID,
  messagesMap: {},
  toolCallingStreamIds: {},
  ...overrides,
});

/**
 * Create a mock ResolvedAgentConfig for testing
 */
export const createMockResolvedAgentConfig = (
  overrides: Partial<ResolvedAgentConfig> = {},
): ResolvedAgentConfig => ({
  agentConfig: createMockAgentConfig(),
  chatConfig: createMockChatConfig(),
  isBuiltinAgent: false,
  plugins: [],
  ...overrides,
});
