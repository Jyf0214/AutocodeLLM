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

import type * as SwrModule from '@/libs/swr';
import { mutate } from '@/libs/swr';
import { chatGroupService } from '@/services/chatGroup';

import { useAgentGroupStore } from '../store';

// Mock dependencies
vi.mock('@/services/chatGroup', () => ({
  chatGroupService: {
    addAgentsToGroup: vi.fn(),
    removeAgentsFromGroup: vi.fn(),
    updateAgentInGroup: vi.fn(),
  },
}));

vi.mock('@/libs/swr', async (importOriginal) => {
  const actual = await importOriginal<typeof SwrModule>();
  return { ...actual, mutate: vi.fn().mockResolvedValue(undefined) };
});

describe('ChatGroupMemberSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    act(() => {
      useAgentGroupStore.setState({
        groupMap: {},
        groups: [],
        groupsInit: false,
      });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('addAgentsToGroup', () => {
    it('should add agents to a group', async () => {
      vi.mocked(chatGroupService.addAgentsToGroup).mockResolvedValue({ added: [], existing: [] });

      const { result } = renderHook(() => useAgentGroupStore());

      await act(async () => {
        await result.current.addAgentsToGroup('group-1', ['agent-1', 'agent-2']);
      });

      expect(chatGroupService.addAgentsToGroup).toHaveBeenCalledWith('group-1', [
        'agent-1',
        'agent-2',
      ]);
    });

    it('should refresh group detail after adding agents', async () => {
      vi.mocked(chatGroupService.addAgentsToGroup).mockResolvedValue({ added: [], existing: [] });

      const { result } = renderHook(() => useAgentGroupStore());

      await act(async () => {
        await result.current.addAgentsToGroup('group-1', ['agent-1']);
      });

      expect(mutate).toHaveBeenCalledWith(['fetchGroupDetail', 'group-1']);
    });
  });

  describe('removeAgentFromGroup', () => {
    it('should remove an agent from a group', async () => {
      vi.mocked(chatGroupService.removeAgentsFromGroup).mockResolvedValue({
        deletedVirtualAgentIds: [],
        removedFromGroup: 1,
      });

      const { result } = renderHook(() => useAgentGroupStore());

      await act(async () => {
        await result.current.removeAgentFromGroup('group-1', 'agent-1');
      });

      expect(chatGroupService.removeAgentsFromGroup).toHaveBeenCalledWith('group-1', ['agent-1']);
    });

    it('should refresh group detail after removing agent', async () => {
      vi.mocked(chatGroupService.removeAgentsFromGroup).mockResolvedValue({
        deletedVirtualAgentIds: [],
        removedFromGroup: 1,
      });

      const { result } = renderHook(() => useAgentGroupStore());

      await act(async () => {
        await result.current.removeAgentFromGroup('group-1', 'agent-1');
      });

      expect(mutate).toHaveBeenCalledWith(['fetchGroupDetail', 'group-1']);
    });
  });

  describe('reorderGroupMembers', () => {
    it('should reorder group members', async () => {
      vi.mocked(chatGroupService.updateAgentInGroup).mockResolvedValue({} as any);

      const { result } = renderHook(() => useAgentGroupStore());

      await act(async () => {
        await result.current.reorderGroupMembers('group-1', ['agent-2', 'agent-1', 'agent-3']);
      });

      expect(chatGroupService.updateAgentInGroup).toHaveBeenCalledTimes(3);
      expect(chatGroupService.updateAgentInGroup).toHaveBeenNthCalledWith(1, 'group-1', 'agent-2', {
        order: 0,
      });
      expect(chatGroupService.updateAgentInGroup).toHaveBeenNthCalledWith(2, 'group-1', 'agent-1', {
        order: 1,
      });
      expect(chatGroupService.updateAgentInGroup).toHaveBeenNthCalledWith(3, 'group-1', 'agent-3', {
        order: 2,
      });
    });

    it('should refresh group detail after reordering', async () => {
      vi.mocked(chatGroupService.updateAgentInGroup).mockResolvedValue({} as any);

      const { result } = renderHook(() => useAgentGroupStore());

      await act(async () => {
        await result.current.reorderGroupMembers('group-1', ['agent-1', 'agent-2']);
      });

      expect(mutate).toHaveBeenCalledWith(['fetchGroupDetail', 'group-1']);
    });
  });
});
