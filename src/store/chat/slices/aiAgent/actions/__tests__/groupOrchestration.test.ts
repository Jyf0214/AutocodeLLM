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

import { useChatStore } from '@/store/chat/store';

// Keep zustand mock as it's needed globally
vi.mock('zustand/traditional');

// Test Constants
const TEST_IDS = {
  GROUP_ID: 'test-group-id',
  SUPERVISOR_AGENT_ID: 'test-supervisor-agent-id',
  TOPIC_ID: 'test-topic-id',
  OPERATION_ID: 'test-operation-id',
} as const;

// Helper to reset test environment
const resetTestEnvironment = () => {
  vi.clearAllMocks();
  useChatStore.setState(
    {
      activeAgentId: TEST_IDS.SUPERVISOR_AGENT_ID,
      activeGroupId: TEST_IDS.GROUP_ID,
      activeTopicId: TEST_IDS.TOPIC_ID,
      messagesMap: {},
      dbMessagesMap: {},
      operations: {},
      messageOperationMap: {},
    },
    false,
  );
};

describe('groupOrchestration actions', () => {
  beforeEach(() => {
    resetTestEnvironment();

    // Setup default mocks for store methods
    act(() => {
      useChatStore.setState({
        startOperation: vi.fn().mockReturnValue({
          operationId: TEST_IDS.OPERATION_ID,
          abortController: new AbortController(),
        }),
        completeOperation: vi.fn(),
        failOperation: vi.fn(),
      });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('internal_execGroupOrchestration', () => {
    it('should create operation with scope: group in context', async () => {
      const { result } = renderHook(() => useChatStore());

      // Spy on startOperation to verify it's called with correct context
      const startOperationSpy = vi.spyOn(result.current, 'startOperation');

      // Call internal_execGroupOrchestration - it will fail after startOperation
      // because the runtime needs more setup, but we only care about the startOperation call
      try {
        await act(async () => {
          await result.current.internal_execGroupOrchestration({
            groupId: TEST_IDS.GROUP_ID,
            supervisorAgentId: TEST_IDS.SUPERVISOR_AGENT_ID,
            topicId: TEST_IDS.TOPIC_ID,
            initialResult: {
              type: 'supervisor_decided',
              payload: {
                decision: 'finish',
                params: {},
                skipCallSupervisor: true,
              },
            },
          });
        });
      } catch {
        // Expected to fail after startOperation due to runtime dependencies
      }

      // Verify startOperation was called with scope: 'group' in context
      // This is the key assertion - ensures supervisor messages have correct scope
      // after broadcast completes and call_supervisor is invoked
      expect(startOperationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'execAgentRuntime',
          context: expect.objectContaining({
            groupId: TEST_IDS.GROUP_ID,
            topicId: TEST_IDS.TOPIC_ID,
            agentId: TEST_IDS.SUPERVISOR_AGENT_ID,
            scope: 'group',
          }),
          label: expect.stringContaining('Group Orchestration'),
        }),
      );
    });
  });

  describe('triggerBroadcast', () => {
    it('should call internal_execGroupOrchestration with broadcast decision', async () => {
      const { result } = renderHook(() => useChatStore());

      const internal_execGroupOrchestrationSpy = vi.fn().mockResolvedValue({ status: 'done' });
      act(() => {
        useChatStore.setState({
          internal_execGroupOrchestration: internal_execGroupOrchestrationSpy,
        });
      });

      await act(async () => {
        await result.current.triggerBroadcast({
          supervisorAgentId: TEST_IDS.SUPERVISOR_AGENT_ID,
          agentIds: ['agent-1', 'agent-2'],
          instruction: 'Test instruction',
          skipCallSupervisor: false,
          toolMessageId: 'tool-msg-id',
        });
      });

      expect(internal_execGroupOrchestrationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          groupId: TEST_IDS.GROUP_ID,
          supervisorAgentId: TEST_IDS.SUPERVISOR_AGENT_ID,
          topicId: TEST_IDS.TOPIC_ID,
          initialResult: expect.objectContaining({
            type: 'supervisor_decided',
            payload: expect.objectContaining({
              decision: 'broadcast',
              params: expect.objectContaining({
                agentIds: ['agent-1', 'agent-2'],
                instruction: 'Test instruction',
                toolMessageId: 'tool-msg-id',
              }),
              skipCallSupervisor: false,
            }),
          }),
        }),
      );
    });
  });

  describe('triggerSpeak', () => {
    it('should call internal_execGroupOrchestration with speak decision', async () => {
      const { result } = renderHook(() => useChatStore());

      const internal_execGroupOrchestrationSpy = vi.fn().mockResolvedValue({ status: 'done' });
      act(() => {
        useChatStore.setState({
          internal_execGroupOrchestration: internal_execGroupOrchestrationSpy,
        });
      });

      await act(async () => {
        await result.current.triggerSpeak({
          supervisorAgentId: TEST_IDS.SUPERVISOR_AGENT_ID,
          agentId: 'target-agent-id',
          instruction: 'Test instruction',
          skipCallSupervisor: true,
        });
      });

      expect(internal_execGroupOrchestrationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          groupId: TEST_IDS.GROUP_ID,
          supervisorAgentId: TEST_IDS.SUPERVISOR_AGENT_ID,
          initialResult: expect.objectContaining({
            type: 'supervisor_decided',
            payload: expect.objectContaining({
              decision: 'speak',
              params: expect.objectContaining({
                agentId: 'target-agent-id',
                instruction: 'Test instruction',
              }),
              skipCallSupervisor: true,
            }),
          }),
        }),
      );
    });
  });

  describe('triggerDelegate', () => {
    it('should call internal_execGroupOrchestration with delegate decision', async () => {
      const { result } = renderHook(() => useChatStore());

      const internal_execGroupOrchestrationSpy = vi.fn().mockResolvedValue({ status: 'done' });
      act(() => {
        useChatStore.setState({
          internal_execGroupOrchestration: internal_execGroupOrchestrationSpy,
        });
      });

      await act(async () => {
        await result.current.triggerDelegate({
          supervisorAgentId: TEST_IDS.SUPERVISOR_AGENT_ID,
          agentId: 'delegate-agent-id',
          reason: 'Test reason',
        });
      });

      expect(internal_execGroupOrchestrationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          groupId: TEST_IDS.GROUP_ID,
          supervisorAgentId: TEST_IDS.SUPERVISOR_AGENT_ID,
          initialResult: expect.objectContaining({
            type: 'supervisor_decided',
            payload: expect.objectContaining({
              decision: 'delegate',
              params: expect.objectContaining({
                agentId: 'delegate-agent-id',
                reason: 'Test reason',
              }),
              skipCallSupervisor: false,
            }),
          }),
        }),
      );
    });
  });
});
