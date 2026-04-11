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

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useChatStore } from '@/store/chat/store';

import { aiChatSelectors } from './selectors';

describe('aiChatSelectors', () => {
  beforeEach(() => {
    useChatStore.setState(useChatStore.getInitialState());
  });

  describe('isMessageInReasoning', () => {
    it('should return true when message has reasoning operation', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        useChatStore.setState({ activeAgentId: 'session1', activeTopicId: 'topic1' });
        result.current.startOperation({
          type: 'reasoning',
          context: { agentId: 'session1', topicId: 'topic1', messageId: 'msg1' },
        });
      });

      expect(aiChatSelectors.isMessageInReasoning('msg1')(result.current)).toBe(true);
    });

    it('should return false when message has no reasoning operation', () => {
      const { result } = renderHook(() => useChatStore());

      expect(aiChatSelectors.isMessageInReasoning('msg1')(result.current)).toBe(false);
    });
  });

  describe('isMessageInSearchWorkflow', () => {
    it('should return true when message is in search workflow', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        useChatStore.setState({ searchWorkflowLoadingIds: ['msg1', 'msg2'] });
      });

      expect(aiChatSelectors.isMessageInSearchWorkflow('msg1')(result.current)).toBe(true);
      expect(aiChatSelectors.isMessageInSearchWorkflow('msg2')(result.current)).toBe(true);
    });

    it('should return false when message is not in search workflow', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        useChatStore.setState({ searchWorkflowLoadingIds: ['msg1'] });
      });

      expect(aiChatSelectors.isMessageInSearchWorkflow('msg2')(result.current)).toBe(false);
    });
  });

  describe('isIntentUnderstanding', () => {
    it('should return true when message is in search workflow', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        useChatStore.setState({ searchWorkflowLoadingIds: ['msg1'] });
      });

      expect(aiChatSelectors.isIntentUnderstanding('msg1')(result.current)).toBe(true);
    });

    it('should return false when message is not in search workflow', () => {
      const { result } = renderHook(() => useChatStore());

      expect(aiChatSelectors.isIntentUnderstanding('msg1')(result.current)).toBe(false);
    });
  });

  describe('isCurrentSendMessageLoading', () => {
    it('should return true when there is a running sendMessage operation in current context', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        useChatStore.setState({ activeAgentId: 'session1', activeTopicId: 'topic1' });
        result.current.startOperation({
          type: 'sendMessage',
          context: { agentId: 'session1', topicId: 'topic1' },
        });
      });

      expect(aiChatSelectors.isCurrentSendMessageLoading(result.current)).toBe(true);
    });

    it('should return false when there is no sendMessage operation', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        useChatStore.setState({ activeAgentId: 'session1', activeTopicId: 'topic1' });
      });

      expect(aiChatSelectors.isCurrentSendMessageLoading(result.current)).toBe(false);
    });

    it('should return false when sendMessage operation is completed', () => {
      const { result } = renderHook(() => useChatStore());

      let opId: string;

      act(() => {
        useChatStore.setState({ activeAgentId: 'session1', activeTopicId: 'topic1' });
        opId = result.current.startOperation({
          type: 'sendMessage',
          context: { agentId: 'session1', topicId: 'topic1' },
        }).operationId;
      });

      act(() => {
        result.current.completeOperation(opId);
      });

      expect(aiChatSelectors.isCurrentSendMessageLoading(result.current)).toBe(false);
    });

    it('should return false for different context', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        useChatStore.setState({ activeAgentId: 'session1', activeTopicId: 'topic1' });
        result.current.startOperation({
          type: 'sendMessage',
          context: { agentId: 'session2', topicId: 'topic2' },
        });
      });

      expect(aiChatSelectors.isCurrentSendMessageLoading(result.current)).toBe(false);
    });
  });

  describe('isCurrentSendMessageError', () => {
    it('should return error message when latest sendMessage operation has error', () => {
      const { result } = renderHook(() => useChatStore());

      let opId: string;

      act(() => {
        useChatStore.setState({ activeAgentId: 'session1', activeTopicId: 'topic1' });
        opId = result.current.startOperation({
          type: 'sendMessage',
          context: { agentId: 'session1', topicId: 'topic1' },
        }).operationId;
      });

      act(() => {
        result.current.updateOperationMetadata(opId, {
          inputSendErrorMsg: 'Network error',
        });
      });

      expect(aiChatSelectors.isCurrentSendMessageError(result.current)).toBe('Network error');
    });

    it('should return undefined when there is no error', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        useChatStore.setState({ activeAgentId: 'session1', activeTopicId: 'topic1' });
        result.current.startOperation({
          type: 'sendMessage',
          context: { agentId: 'session1', topicId: 'topic1' },
        });
      });

      expect(aiChatSelectors.isCurrentSendMessageError(result.current)).toBeUndefined();
    });

    it('should return undefined when there are no operations', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        useChatStore.setState({ activeAgentId: 'session1', activeTopicId: 'topic1' });
      });

      expect(aiChatSelectors.isCurrentSendMessageError(result.current)).toBeUndefined();
    });

    it('should return the latest error when multiple operations exist', () => {
      const { result } = renderHook(() => useChatStore());

      let op1Id: string;
      let op2Id: string;

      act(() => {
        useChatStore.setState({ activeAgentId: 'session1', activeTopicId: 'topic1' });

        op1Id = result.current.startOperation({
          type: 'sendMessage',
          context: { agentId: 'session1', topicId: 'topic1' },
        }).operationId;

        op2Id = result.current.startOperation({
          type: 'sendMessage',
          context: { agentId: 'session1', topicId: 'topic1' },
        }).operationId;
      });

      act(() => {
        result.current.updateOperationMetadata(op1Id, {
          inputSendErrorMsg: 'First error',
        });
        result.current.updateOperationMetadata(op2Id, {
          inputSendErrorMsg: 'Second error',
        });
      });

      // Should return the latest (second) error
      expect(aiChatSelectors.isCurrentSendMessageError(result.current)).toBe('Second error');
    });
  });

  describe('isSendMessageLoadingForTopic', () => {
    it('should return true when sendMessage operation is running for the topic', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        result.current.startOperation({
          type: 'sendMessage',
          context: { agentId: 'session1', topicId: 'topic1' },
        });
      });

      expect(
        aiChatSelectors.isSendMessageLoadingForTopic('main_session1_topic1')(result.current),
      ).toBe(true);
    });

    it('should return false when no sendMessage operation exists', () => {
      const { result } = renderHook(() => useChatStore());

      expect(
        aiChatSelectors.isSendMessageLoadingForTopic('main_session1_topic1')(result.current),
      ).toBe(false);
    });

    it('should return false when sendMessage operation is completed', () => {
      const { result } = renderHook(() => useChatStore());

      let opId: string;

      act(() => {
        opId = result.current.startOperation({
          type: 'sendMessage',
          context: { agentId: 'session1', topicId: 'topic1' },
        }).operationId;
      });

      act(() => {
        result.current.completeOperation(opId);
      });

      expect(
        aiChatSelectors.isSendMessageLoadingForTopic('main_session1_topic1')(result.current),
      ).toBe(false);
    });

    it('should distinguish between different topics', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        result.current.startOperation({
          type: 'sendMessage',
          context: { agentId: 'session1', topicId: 'topic1' },
        });
      });

      expect(
        aiChatSelectors.isSendMessageLoadingForTopic('main_session1_topic1')(result.current),
      ).toBe(true);
      expect(
        aiChatSelectors.isSendMessageLoadingForTopic('main_session1_topic2')(result.current),
      ).toBe(false);
    });
  });
});
