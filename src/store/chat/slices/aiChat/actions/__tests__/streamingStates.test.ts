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
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useChatStore } from '../../../../store';
import { TEST_IDS } from './fixtures';
import { resetTestEnvironment } from './helpers';

// Keep zustand mock as it's needed globally
vi.mock('zustand/traditional');

beforeEach(() => {
  resetTestEnvironment();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('StreamingStates actions', () => {
  describe('internal_toggleToolCallingStreaming', () => {
    it('should track tool calling stream status', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        result.current.internal_toggleToolCallingStreaming(TEST_IDS.MESSAGE_ID, [true]);
      });

      expect(result.current.toolCallingStreamIds[TEST_IDS.MESSAGE_ID]).toEqual([true]);
    });

    it('should clear tool calling stream status', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        result.current.internal_toggleToolCallingStreaming(TEST_IDS.MESSAGE_ID, [true]);
        result.current.internal_toggleToolCallingStreaming(TEST_IDS.MESSAGE_ID, undefined);
      });

      expect(result.current.toolCallingStreamIds[TEST_IDS.MESSAGE_ID]).toBeUndefined();
    });
  });

  describe('internal_toggleSearchWorkflow', () => {
    it('should enable search workflow loading state', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        result.current.internal_toggleSearchWorkflow(true, TEST_IDS.MESSAGE_ID);
      });

      const state = useChatStore.getState();
      expect(state.searchWorkflowLoadingIds).toEqual([TEST_IDS.MESSAGE_ID]);
    });

    it('should disable search workflow loading state', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        result.current.internal_toggleSearchWorkflow(true, TEST_IDS.MESSAGE_ID);
        result.current.internal_toggleSearchWorkflow(false, TEST_IDS.MESSAGE_ID);
      });

      const state = useChatStore.getState();
      expect(state.searchWorkflowLoadingIds).toEqual([]);
    });
  });
});
