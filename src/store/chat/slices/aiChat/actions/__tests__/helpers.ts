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

import { vi } from 'vitest';

import { chatService } from '@/services/chat';
import { messageService } from '@/services/message';
import { agentChatConfigSelectors, agentSelectors } from '@/store/agent/selectors';

import { useChatStore } from '../../../../store';
import { messageMapKey } from '../../../../utils/messageMapKey';
import { createMockAgentConfig, createMockChatConfig,TEST_IDS } from './fixtures';

/**
 * Setup mock selectors with default or custom values
 */
export const setupMockSelectors = (
  options: {
    agentConfig?: Record<string, any>;
    agentMeta?: Record<string, any>;
    chatConfig?: Record<string, any>;
  } = {},
) => {
  vi.spyOn(agentSelectors, 'currentAgentConfig').mockImplementation(() =>
    createMockAgentConfig(options.agentConfig),
  );

  // Mock getAgentConfigById to return config for any agentId
  const getAgentConfig = () => createMockAgentConfig(options.agentConfig);
  vi.spyOn(agentSelectors, 'getAgentConfigById').mockImplementation(() => getAgentConfig);

  vi.spyOn(agentChatConfigSelectors, 'currentChatConfig').mockImplementation(() =>
    createMockChatConfig(options.chatConfig),
  );

  vi.spyOn(agentSelectors, 'currentAgentMeta').mockImplementation(
    () => options.agentMeta || { tags: [] },
  );
};

/**
 * Setup store state with messages
 */
export const setupStoreWithMessages = (
  messages: any[],
  sessionId: any = TEST_IDS.SESSION_ID,
  topicId: string | null | undefined = TEST_IDS.TOPIC_ID,
) => {
  useChatStore.setState({
    activeAgentId: sessionId,
    activeTopicId: topicId ?? undefined,
    messagesMap: {
      [messageMapKey({ agentId: sessionId, topicId: topicId ?? undefined })]: messages,
    },
  });
};

/**
 * Create a mock AbortController for testing
 */
export const createMockAbortController = () => {
  const controller = new AbortController();
  vi.spyOn(controller, 'abort');
  return controller;
};

/**
 * Setup spies for message service methods
 */
export const spyOnMessageService = () => {
  const createMessageSpy = vi
    .spyOn(messageService, 'createMessage')
    .mockResolvedValue({ id: TEST_IDS.NEW_MESSAGE_ID, messages: [] });
  const updateMessageSpy = vi
    .spyOn(messageService, 'updateMessage')
    .mockResolvedValue({ messages: [], success: true });
  const updateMessageMetadataSpy = vi
    .spyOn(messageService, 'updateMessageMetadata')
    .mockResolvedValue({ messages: [], success: true });
  const removeMessageSpy = vi
    .spyOn(messageService, 'removeMessage')
    .mockResolvedValue(undefined as any);
  const updateMessageErrorSpy = vi
    .spyOn(messageService, 'updateMessageError')
    .mockResolvedValue(undefined as any);

  return {
    createMessageSpy,
    removeMessageSpy,
    updateMessageErrorSpy,
    updateMessageMetadataSpy,
    updateMessageSpy,
  };
};

/**
 * Setup spies for chat service methods
 */
export const spyOnChatService = () => {
  const createAssistantMessageSpy = vi
    .spyOn(chatService, 'createAssistantMessage')
    .mockResolvedValue(new Response(TEST_IDS.ASSISTANT_MESSAGE_ID));

  return {
    createAssistantMessageSpy,
  };
};

/**
 * Reset all mocks and store state to clean state
 */
export const resetTestEnvironment = () => {
  vi.clearAllMocks();
  useChatStore.setState(
    {
      activeAgentId: TEST_IDS.SESSION_ID,
      activeTopicId: TEST_IDS.TOPIC_ID,
      messagesMap: {},
      toolCallingStreamIds: {},
    },
    false,
  );
};
