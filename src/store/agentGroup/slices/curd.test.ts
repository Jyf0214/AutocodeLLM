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

import { type AgentGroupDetail } from '@lobechat/types';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_CHAT_GROUP_CHAT_CONFIG } from '@/const/settings';
import type * as SwrModule from '@/libs/swr';
import { mutate } from '@/libs/swr';
import { chatGroupService } from '@/services/chatGroup';

import { useAgentGroupStore } from '../store';

// Mock dependencies
vi.mock('@/services/chatGroup', () => ({
  chatGroupService: {
    updateGroup: vi.fn(),
  },
}));

vi.mock('@/libs/swr', async (importOriginal) => {
  const actual = await importOriginal<typeof SwrModule>();
  return { ...actual, mutate: vi.fn().mockResolvedValue(undefined) };
});

// Helper to create mock AgentGroupDetail
const createMockGroup = (overrides: Partial<AgentGroupDetail>): AgentGroupDetail => ({
  agents: [],
  createdAt: new Date(),
  id: 'group-1',
  supervisorAgentId: 'supervisor-1',
  title: 'Test Group',
  updatedAt: new Date(),
  userId: 'user-1',
  ...overrides,
});

describe('ChatGroupCurdSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    act(() => {
      useAgentGroupStore.setState({
        activeGroupId: 'group-1',
        groupMap: {
          'group-1': createMockGroup({ id: 'group-1', title: 'Test Group' }),
        },
        groups: [],
        groupsInit: true,
      });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('updateGroup', () => {
    it('should update group properties', async () => {
      vi.mocked(chatGroupService.updateGroup).mockResolvedValue({} as any);

      const { result } = renderHook(() => useAgentGroupStore());

      await act(async () => {
        await result.current.updateGroup('group-1', { title: 'Updated Title' });
      });

      expect(chatGroupService.updateGroup).toHaveBeenCalledWith('group-1', {
        title: 'Updated Title',
      });
    });

    it('should refresh group detail after update', async () => {
      vi.mocked(chatGroupService.updateGroup).mockResolvedValue({} as any);

      const { result } = renderHook(() => useAgentGroupStore());

      await act(async () => {
        await result.current.updateGroup('group-1', { description: 'New description' });
      });

      expect(mutate).toHaveBeenCalledWith(['fetchGroupDetail', 'group-1']);
    });
  });

  describe('updateGroupConfig', () => {
    it('should update group config with merged defaults', async () => {
      vi.mocked(chatGroupService.updateGroup).mockResolvedValue({} as any);

      const { result } = renderHook(() => useAgentGroupStore());

      await act(async () => {
        await result.current.updateGroupConfig({ allowDM: false });
      });

      expect(chatGroupService.updateGroup).toHaveBeenCalledWith('group-1', {
        config: expect.objectContaining({
          ...DEFAULT_CHAT_GROUP_CHAT_CONFIG,
          allowDM: false,
        }),
      });
    });

    it('should not update if no current group', async () => {
      act(() => {
        useAgentGroupStore.setState({
          activeGroupId: undefined,
          groupMap: {},
        });
      });

      const { result } = renderHook(() => useAgentGroupStore());

      await act(async () => {
        await result.current.updateGroupConfig({ allowDM: false });
      });

      expect(chatGroupService.updateGroup).not.toHaveBeenCalled();
    });

    it('should refresh group detail after config update', async () => {
      vi.mocked(chatGroupService.updateGroup).mockResolvedValue({} as any);

      const { result } = renderHook(() => useAgentGroupStore());

      await act(async () => {
        await result.current.updateGroupConfig({ revealDM: true });
      });

      expect(mutate).toHaveBeenCalledWith(['fetchGroupDetail', 'group-1']);
    });
  });

  describe('updateGroupMeta', () => {
    it('should update group meta', async () => {
      vi.mocked(chatGroupService.updateGroup).mockResolvedValue({} as any);

      const { result } = renderHook(() => useAgentGroupStore());

      await act(async () => {
        await result.current.updateGroupMeta({ title: 'New Title', description: 'New Desc' });
      });

      expect(chatGroupService.updateGroup).toHaveBeenCalledWith('group-1', {
        description: 'New Desc',
        title: 'New Title',
      });
    });

    it('should not update if no current group', async () => {
      act(() => {
        useAgentGroupStore.setState({
          activeGroupId: undefined,
          groupMap: {},
        });
      });

      const { result } = renderHook(() => useAgentGroupStore());

      await act(async () => {
        await result.current.updateGroupMeta({ title: 'New Title' });
      });

      expect(chatGroupService.updateGroup).not.toHaveBeenCalled();
    });

    it('should refresh group detail after meta update', async () => {
      vi.mocked(chatGroupService.updateGroup).mockResolvedValue({} as any);

      const { result } = renderHook(() => useAgentGroupStore());

      await act(async () => {
        await result.current.updateGroupMeta({ title: 'Updated' });
      });

      expect(mutate).toHaveBeenCalledWith(['fetchGroupDetail', 'group-1']);
    });
  });
});
