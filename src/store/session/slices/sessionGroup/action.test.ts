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
import { afterEach, describe, expect, it, vi } from 'vitest';

import { sessionService } from '@/services/session';
import { useSessionStore } from '@/store/session';

afterEach(() => {
  vi.restoreAllMocks();
});

vi.mock('@/components/AntdStaticMethods', () => ({
  message: {
    loading: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    destroy: vi.fn(),
  },
}));

describe('createSessionGroupSlice', () => {
  describe('addSessionGroup', () => {
    it('should add a session group and refresh sessions', async () => {
      const mockId = 'mock-id';
      const mockName = 'Test Group';
      vi.spyOn(sessionService, 'createSessionGroup').mockResolvedValue(mockId);
      const spyOnRefreshSessions = vi.spyOn(useSessionStore.getState(), 'refreshSessions');

      const { result } = renderHook(() => useSessionStore());

      let returnedId;
      await act(async () => {
        returnedId = await result.current.addSessionGroup(mockName);
      });

      expect(sessionService.createSessionGroup).toHaveBeenCalledWith(mockName);
      expect(spyOnRefreshSessions).toHaveBeenCalled();
      expect(returnedId).toBe(mockId);
    });
  });

  describe('clearSessionGroups', () => {
    it('should clear session groups and refresh sessions', async () => {
      const spyOn = vi
        .spyOn(sessionService, 'removeSessionGroups')
        .mockResolvedValueOnce(undefined as any);
      const spyOnRefreshSessions = vi.spyOn(useSessionStore.getState(), 'refreshSessions');

      const { result } = renderHook(() => useSessionStore());

      await act(async () => {
        await result.current.clearSessionGroups();
      });

      expect(spyOn).toHaveBeenCalled();
      expect(spyOnRefreshSessions).toHaveBeenCalled();
    });
  });

  describe('removeSessionGroup', () => {
    it('should remove a session group and refresh sessions', async () => {
      const mockId = 'mock-id';
      vi.spyOn(sessionService, 'removeSessionGroup').mockResolvedValueOnce(undefined as any);
      const spyOnRefreshSessions = vi.spyOn(useSessionStore.getState(), 'refreshSessions');

      const { result } = renderHook(() => useSessionStore());

      await act(async () => {
        await result.current.removeSessionGroup(mockId);
      });

      expect(sessionService.removeSessionGroup).toHaveBeenCalledWith(mockId);
      expect(spyOnRefreshSessions).toHaveBeenCalled();
    });
  });

  describe('updateSessionGroupId', () => {
    it('should update a session group id and refresh sessions', async () => {
      const mockSessionId = 'session-id';
      const mockGroupId = 'group-id';
      vi.spyOn(sessionService, 'updateSession').mockResolvedValueOnce(undefined as any);
      const spyOnRefreshSessions = vi.spyOn(useSessionStore.getState(), 'refreshSessions');

      const { result } = renderHook(() => useSessionStore());

      await act(async () => {
        await result.current.updateSessionGroupId(mockSessionId, mockGroupId);
      });

      expect(sessionService.updateSession).toHaveBeenCalledWith(mockSessionId, {
        group: mockGroupId,
      });
      expect(spyOnRefreshSessions).toHaveBeenCalled();
    });
  });

  describe('updateSessionGroupName', () => {
    it('should update a session group name and refresh sessions', async () => {
      const mockId = 'mock-id';
      const mockName = 'New Name';
      const spyOnRefreshSessions = vi.spyOn(useSessionStore.getState(), 'refreshSessions');
      vi.spyOn(sessionService, 'updateSessionGroup').mockResolvedValueOnce(undefined as any);

      const { result } = renderHook(() => useSessionStore());

      await act(async () => {
        await result.current.updateSessionGroupName(mockId, mockName);
      });

      expect(sessionService.updateSessionGroup).toHaveBeenCalledWith(mockId, { name: mockName });
      expect(spyOnRefreshSessions).toHaveBeenCalled();
    });
  });

  describe('updateSessionGroupSort', () => {
    it('should update session group sort order and refresh sessions', async () => {
      const mockItems: any[] = [
        { id: 'id1', sort: 0 },
        { id: 'id2', sort: 1 },
      ];
      vi.spyOn(sessionService, 'updateSessionGroupOrder').mockResolvedValueOnce(undefined as any);
      const spyOnRefreshSessions = vi.spyOn(useSessionStore.getState(), 'refreshSessions');

      const { result } = renderHook(() => useSessionStore());

      await act(async () => {
        await result.current.updateSessionGroupSort(mockItems);
      });

      expect(sessionService.updateSessionGroupOrder).toHaveBeenCalledWith(
        mockItems.map((item) => ({ id: item.id, sort: item.sort })),
      );
      expect(spyOnRefreshSessions).toHaveBeenCalled();
    });
  });
});
