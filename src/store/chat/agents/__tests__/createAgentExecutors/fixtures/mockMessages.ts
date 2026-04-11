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
import { nanoid } from '@lobechat/utils';

/**
 * Create a mock assistant message
 */
export const createAssistantMessage = (overrides: Partial<UIChatMessage> = {}): UIChatMessage => {
  return {
    content: 'I am an AI assistant.',
    createdAt: Date.now(),
    id: `msg_${nanoid()}`,
    model: 'gpt-4',
    provider: 'openai',
    role: 'assistant',
    updatedAt: Date.now(),
    ...overrides,
  } as UIChatMessage;
};

/**
 * Create a mock user message
 */
export const createUserMessage = (overrides: Partial<UIChatMessage> = {}): UIChatMessage => {
  return {
    content: 'Hello, AI!',
    createdAt: Date.now(),
    id: `msg_${nanoid()}`,
    role: 'user',
    updatedAt: Date.now(),
    ...overrides,
  } as UIChatMessage;
};

/**
 * Create a mock tool message
 */
export const createToolMessage = (overrides: Partial<UIChatMessage> = {}): UIChatMessage => {
  return {
    content: '',
    createdAt: Date.now(),
    id: `msg_${nanoid()}`,
    plugin: {
      apiName: 'search',
      arguments: JSON.stringify({ query: 'test' }),
      identifier: 'lobe-web-browsing',
      type: 'default',
    },
    role: 'tool',
    tool_call_id: `tool_call_${nanoid()}`,
    updatedAt: Date.now(),
    ...overrides,
  } as UIChatMessage;
};

/**
 * Create a mock tool message with pending intervention
 */
export const createPendingToolMessage = (overrides: Partial<UIChatMessage> = {}): UIChatMessage => {
  return createToolMessage({
    pluginIntervention: { status: 'pending' },
    ...overrides,
  });
};

/**
 * Create a mock tool message with aborted intervention
 */
export const createAbortedToolMessage = (overrides: Partial<UIChatMessage> = {}): UIChatMessage => {
  return createToolMessage({
    content: 'Tool execution was cancelled by user.',
    pluginIntervention: { status: 'aborted' },
    ...overrides,
  });
};

/**
 * Create a conversation history
 */
export const createConversationHistory = (messageCount: number = 3): UIChatMessage[] => {
  const messages: UIChatMessage[] = [];

  for (let i = 0; i < messageCount; i++) {
    if (i % 2 === 0) {
      messages.push(createUserMessage({ content: `User message ${i + 1}` }));
    } else {
      messages.push(createAssistantMessage({ content: `Assistant response ${i + 1}` }));
    }
  }

  return messages;
};
