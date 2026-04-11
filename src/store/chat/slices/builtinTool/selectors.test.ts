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

import { chatToolSelectors } from './selectors';

describe('chatToolSelectors', () => {
  beforeEach(() => {
    useChatStore.setState(useChatStore.getInitialState());
  });

  describe('isInterpreterExecuting', () => {
    it('should return true when interpreter is executing for message', () => {
      const { result } = renderHook(() => useChatStore());

      let opId: string;

      act(() => {
        opId = result.current.startOperation({
          type: 'builtinToolInterpreter',
          context: { sessionId: 'session1', messageId: 'msg1' },
        }).operationId;

        result.current.associateMessageWithOperation('msg1', opId);
      });

      expect(chatToolSelectors.isInterpreterExecuting('msg1')(result.current)).toBe(true);
    });

    it('should return false when no operation exists for message', () => {
      const { result } = renderHook(() => useChatStore());

      expect(chatToolSelectors.isInterpreterExecuting('msg1')(result.current)).toBe(false);
    });

    it('should return false when operation is not builtinToolInterpreter', () => {
      const { result } = renderHook(() => useChatStore());

      let opId: string;

      act(() => {
        opId = result.current.startOperation({
          type: 'execAgentRuntime',
          context: { sessionId: 'session1', messageId: 'msg1' },
        }).operationId;

        result.current.associateMessageWithOperation('msg1', opId);
      });

      expect(chatToolSelectors.isInterpreterExecuting('msg1')(result.current)).toBe(false);
    });

    it('should return false when operation is completed', () => {
      const { result } = renderHook(() => useChatStore());

      let opId: string;

      act(() => {
        opId = result.current.startOperation({
          type: 'builtinToolInterpreter',
          context: { sessionId: 'session1', messageId: 'msg1' },
        }).operationId;

        result.current.associateMessageWithOperation('msg1', opId);
      });

      act(() => {
        result.current.completeOperation(opId);
      });

      expect(chatToolSelectors.isInterpreterExecuting('msg1')(result.current)).toBe(false);
    });
  });

  describe('isSearXNGSearching', () => {
    it('should return true when SearXNG search is running for message', () => {
      const { result } = renderHook(() => useChatStore());

      let opId: string;

      act(() => {
        opId = result.current.startOperation({
          type: 'builtinToolSearch',
          context: { sessionId: 'session1', messageId: 'msg1' },
        }).operationId;

        result.current.associateMessageWithOperation('msg1', opId);
      });

      expect(chatToolSelectors.isSearXNGSearching('msg1')(result.current)).toBe(true);
    });

    it('should return false when no operation exists', () => {
      const { result } = renderHook(() => useChatStore());

      expect(chatToolSelectors.isSearXNGSearching('msg1')(result.current)).toBe(false);
    });

    it('should return false when operation type is different', () => {
      const { result } = renderHook(() => useChatStore());

      let opId: string;

      act(() => {
        opId = result.current.startOperation({
          type: 'builtinToolInterpreter',
          context: { sessionId: 'session1', messageId: 'msg1' },
        }).operationId;

        result.current.associateMessageWithOperation('msg1', opId);
      });

      expect(chatToolSelectors.isSearXNGSearching('msg1')(result.current)).toBe(false);
    });

    it('should return false when operation is not running', () => {
      const { result } = renderHook(() => useChatStore());

      let opId: string;

      act(() => {
        opId = result.current.startOperation({
          type: 'builtinToolSearch',
          context: { sessionId: 'session1', messageId: 'msg1' },
        }).operationId;

        result.current.associateMessageWithOperation('msg1', opId);
        result.current.completeOperation(opId);
      });

      expect(chatToolSelectors.isSearXNGSearching('msg1')(result.current)).toBe(false);
    });
  });

  describe('isSearchingLocalFiles', () => {
    it('should return true when local system search is running', () => {
      const { result } = renderHook(() => useChatStore());

      let opId: string;

      act(() => {
        opId = result.current.startOperation({
          type: 'builtinToolLocalSystem',
          context: { sessionId: 'session1', messageId: 'msg1' },
        }).operationId;

        result.current.associateMessageWithOperation('msg1', opId);
      });

      expect(chatToolSelectors.isSearchingLocalFiles('msg1')(result.current)).toBe(true);
    });

    it('should return false when no operation exists', () => {
      const { result } = renderHook(() => useChatStore());

      expect(chatToolSelectors.isSearchingLocalFiles('msg1')(result.current)).toBe(false);
    });

    it('should return false when operation type is different', () => {
      const { result } = renderHook(() => useChatStore());

      let opId: string;

      act(() => {
        opId = result.current.startOperation({
          type: 'builtinToolSearch',
          context: { sessionId: 'session1', messageId: 'msg1' },
        }).operationId;

        result.current.associateMessageWithOperation('msg1', opId);
      });

      expect(chatToolSelectors.isSearchingLocalFiles('msg1')(result.current)).toBe(false);
    });

    it('should return false when operation is completed', () => {
      const { result } = renderHook(() => useChatStore());

      let opId: string;

      act(() => {
        opId = result.current.startOperation({
          type: 'builtinToolLocalSystem',
          context: { sessionId: 'session1', messageId: 'msg1' },
        }).operationId;

        result.current.associateMessageWithOperation('msg1', opId);
        result.current.completeOperation(opId);
      });

      expect(chatToolSelectors.isSearchingLocalFiles('msg1')(result.current)).toBe(false);
    });
  });
});
