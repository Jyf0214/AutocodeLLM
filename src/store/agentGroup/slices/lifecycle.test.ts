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

import { chatGroupService } from '@/services/chatGroup';

import { useAgentGroupStore } from '../store';

// Mock dependencies
vi.mock('@/services/chatGroup', () => ({
  chatGroupService: {
    addAgentsToGroup: vi.fn(),
    createGroup: vi.fn(),
    getGroupDetail: vi.fn(),
    getGroups: vi.fn(),
  },
}));

vi.mock('@/store/home', () => ({
  getHomeStoreState: vi.fn(() => ({
    refreshAgentList: vi.fn(),
    switchToGroup: vi.fn(),
  })),
}));

vi.mock('@/store/agent', () => ({
  getAgentStoreState: vi.fn(() => ({
    internal_dispatchAgentMap: vi.fn(),
    setActiveAgentId: vi.fn(),
  })),
}));

vi.mock('@/store/chat', () => ({
  useChatStore: {
    setState: vi.fn(),
  },
}));

describe('ChatGroupLifecycleSlice', () => {
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

  describe('createGroup', () => {
    it('should create a new group and switch to it', async () => {
      const mockGroup = {
        id: 'new-group-id',
        title: 'Test Group',
        userId: 'user-1',
      };
      const mockGroupDetail = {
        ...mockGroup,
        agents: [],
        supervisorAgentId: 'supervisor-1',
      };

      vi.mocked(chatGroupService.createGroup).mockResolvedValue({
        group: mockGroup as any,
        supervisorAgentId: 'supervisor-1',
      });
      vi.mocked(chatGroupService.getGroupDetail).mockResolvedValue(mockGroupDetail as any);

      const { result } = renderHook(() => useAgentGroupStore());

      let groupId: string = '';
      await act(async () => {
        groupId = await result.current.createGroup({ title: 'Test Group' });
      });

      expect(groupId).toBe('new-group-id');
      expect(chatGroupService.createGroup).toHaveBeenCalledWith({ title: 'Test Group' });
    });

    it('should add agents to group if provided', async () => {
      const mockGroup = {
        id: 'new-group-id',
        title: 'Test Group',
        userId: 'user-1',
      };
      const mockGroupDetail = {
        ...mockGroup,
        agents: [],
        supervisorAgentId: 'supervisor-1',
      };

      vi.mocked(chatGroupService.createGroup).mockResolvedValue({
        group: mockGroup as any,
        supervisorAgentId: 'supervisor-1',
      });
      vi.mocked(chatGroupService.addAgentsToGroup).mockResolvedValue({ added: [], existing: [] });
      vi.mocked(chatGroupService.getGroupDetail).mockResolvedValue(mockGroupDetail as any);

      const { result } = renderHook(() => useAgentGroupStore());

      await act(async () => {
        await result.current.createGroup({ title: 'Test Group' }, ['agent-1', 'agent-2']);
      });

      expect(chatGroupService.addAgentsToGroup).toHaveBeenCalledWith('new-group-id', [
        'agent-1',
        'agent-2',
      ]);
    });

    it('should fetch group detail and store supervisorAgentId for tools injection', async () => {
      const mockGroup = {
        id: 'new-group-id',
        title: 'Test Group',
        userId: 'user-1',
      };
      const mockSupervisorAgentId = 'supervisor-agent-123';
      const mockGroupDetail = {
        ...mockGroup,
        agents: [],
        supervisorAgentId: mockSupervisorAgentId,
      };

      vi.mocked(chatGroupService.createGroup).mockResolvedValue({
        group: mockGroup as any,
        supervisorAgentId: mockSupervisorAgentId,
      });
      vi.mocked(chatGroupService.getGroupDetail).mockResolvedValue(mockGroupDetail as any);

      const { result } = renderHook(() => useAgentGroupStore());

      await act(async () => {
        await result.current.createGroup({ title: 'Test Group' });
      });

      // Verify getGroupDetail was called to fetch full group info
      expect(chatGroupService.getGroupDetail).toHaveBeenCalledWith('new-group-id');

      // Verify supervisorAgentId is stored in groupMap for tools injection
      const groupDetail = result.current.groupMap['new-group-id'];
      expect(groupDetail).toBeDefined();
      expect(groupDetail.supervisorAgentId).toBe(mockSupervisorAgentId);
    });

    it('should not switch to group when silent is true', async () => {
      const mockSwitchToGroup = vi.fn();
      const { getHomeStoreState } = await import('@/store/home');
      vi.mocked(getHomeStoreState).mockReturnValue({
        refreshAgentList: vi.fn(),
        switchToGroup: mockSwitchToGroup,
      } as any);

      const mockGroup = {
        id: 'new-group-id',
        title: 'Test Group',
        userId: 'user-1',
      };
      const mockGroupDetail = {
        ...mockGroup,
        agents: [],
        supervisorAgentId: 'supervisor-1',
      };

      vi.mocked(chatGroupService.createGroup).mockResolvedValue({
        group: mockGroup as any,
        supervisorAgentId: 'supervisor-1',
      });
      vi.mocked(chatGroupService.getGroupDetail).mockResolvedValue(mockGroupDetail as any);

      const { result } = renderHook(() => useAgentGroupStore());

      await act(async () => {
        await result.current.createGroup({ title: 'Test Group' }, [], true);
      });

      expect(mockSwitchToGroup).not.toHaveBeenCalled();
    });
  });
});
