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
import { describe, expect, it } from 'vitest';

import { useChatStore } from '../../../../store';
import { messageMapKey } from '../../../../utils/messageMapKey';

describe('Cancel send message functionality tests', () => {
  describe('cancelSendMessageInServer', () => {
    it('should be able to call cancel method normally', () => {
      const { result } = renderHook(() => useChatStore());

      // Initial state setup
      act(() => {
        useChatStore.setState({
          activeAgentId: 'session-1',
          activeTopicId: 'topic-1',
          operations: {},
          operationsByContext: {},
        });
      });

      // Test method exists
      expect(typeof result.current.cancelSendMessageInServer).toBe('function');

      // Test method can be called safely
      expect(() => {
        act(() => {
          result.current.cancelSendMessageInServer();
        });
      }).not.toThrow();
    });

    it('should cancel running sendMessage operations', () => {
      const { result } = renderHook(() => useChatStore());

      const agentId = 'session-1';
      const topicId = 'topic-1';

      act(() => {
        useChatStore.setState({
          activeAgentId: agentId,
          activeTopicId: topicId,
        });
      });

      // Start a sendMessage operation
      let operationId: string;
      act(() => {
        const res = result.current.startOperation({
          type: 'sendMessage',
          context: { agentId, topicId },
        });
        operationId = res.operationId;
      });

      expect(result.current.operations[operationId!].status).toBe('running');

      // Cancel the operation
      act(() => {
        result.current.cancelSendMessageInServer();
      });

      expect(result.current.operations[operationId!].status).toBe('cancelled');
    });

    it('should restore editor state when cancelling', () => {
      const { result } = renderHook(() => useChatStore());

      const agentId = 'session-1';
      const topicId = 'topic-1';
      const mockEditorState = { content: 'test message' };

      // Mock editor
      const mockEditor = {
        setJSONState: vi.fn(),
        getJSONState: vi.fn().mockReturnValue(mockEditorState),
      };

      act(() => {
        useChatStore.setState({
          activeAgentId: agentId,
          activeTopicId: topicId,
          mainInputEditor: mockEditor as any,
        });
      });

      // Create operation with editor state
      let operationId: string;
      act(() => {
        const res = result.current.startOperation({
          type: 'sendMessage',
          context: { agentId, topicId },
        });
        operationId = res.operationId;

        result.current.updateOperationMetadata(res.operationId, {
          inputEditorTempState: mockEditorState,
        });
      });

      // Cancel
      act(() => {
        result.current.cancelSendMessageInServer();
      });

      // Verify editor state was restored
      expect(mockEditor.setJSONState).toHaveBeenCalledWith(mockEditorState);
    });

    it('should be able to call with specified topic ID', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        useChatStore.setState({
          activeAgentId: 'session-1',
          operations: {},
          operationsByContext: {},
        });
      });

      expect(() => {
        act(() => {
          result.current.cancelSendMessageInServer('topic-2');
        });
      }).not.toThrow();
    });
  });

  describe('clearSendMessageError', () => {
    it('should be able to call clear error method normally', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        useChatStore.setState({
          activeAgentId: 'session-1',
          activeTopicId: 'topic-1',
          operations: {},
          operationsByContext: {},
        });
      });

      expect(typeof result.current.clearSendMessageError).toBe('function');

      expect(() => {
        act(() => {
          result.current.clearSendMessageError();
        });
      }).not.toThrow();
    });

    it('should clear error messages from sendMessage operations', () => {
      const { result } = renderHook(() => useChatStore());

      const agentId = 'session-1';
      const topicId = 'topic-1';

      act(() => {
        useChatStore.setState({
          activeAgentId: agentId,
          activeTopicId: topicId,
        });
      });

      // Create operation with error
      let operationId: string;
      act(() => {
        const res = result.current.startOperation({
          type: 'sendMessage',
          context: { agentId, topicId },
        });
        operationId = res.operationId;

        result.current.updateOperationMetadata(res.operationId, {
          inputSendErrorMsg: 'Test error',
        });
      });

      expect(result.current.operations[operationId!].metadata.inputSendErrorMsg).toBe('Test error');

      // Clear error
      act(() => {
        result.current.clearSendMessageError();
      });

      expect(result.current.operations[operationId!].metadata.inputSendErrorMsg).toBeUndefined();
    });
  });

  describe('Operation system', () => {
    it('should have operation management methods', () => {
      const { result } = renderHook(() => useChatStore());

      expect(typeof result.current.startOperation).toBe('function');
      expect(typeof result.current.cancelOperation).toBe('function');
      expect(typeof result.current.updateOperationMetadata).toBe('function');
    });

    it('should track operations by context', () => {
      const { result } = renderHook(() => useChatStore());

      const sessionId = 'session-1';
      const topicId = 'topic-1';

      let operationId: string;
      act(() => {
        const res = result.current.startOperation({
          type: 'sendMessage',
          context: { agentId: sessionId, topicId },
        });
        operationId = res.operationId;
      });

      const contextKey = messageMapKey({ agentId: sessionId, topicId });
      expect(result.current.operationsByContext[contextKey]).toContain(operationId!);
    });
  });
});
