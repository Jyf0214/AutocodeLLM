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

import { message } from '@/components/AntdStaticMethods';
import { chatGroupService } from '@/services/chatGroup';
import { sessionService } from '@/services/session';
import { useSessionStore } from '@/store/session';
import { LobeSessionType } from '@/types/session';

import { sessionSelectors } from './selectors';

// Mock sessionService 和其他依赖项
vi.mock('@/services/session', () => ({
  sessionService: {
    removeAllSessions: vi.fn(),
    createSession: vi.fn(),
    cloneSession: vi.fn(),
    updateSessionGroup: vi.fn(),
    removeSession: vi.fn(),
    getAllSessions: vi.fn(),
    updateSession: vi.fn(),
    updateSessionGroupId: vi.fn(),
    searchSessions: vi.fn(),
    updateSessionPinned: vi.fn(),
  },
}));

vi.mock('@/services/chatGroup', () => ({
  chatGroupService: {
    updateGroup: vi.fn(),
  },
}));

vi.mock('@/components/AntdStaticMethods', () => ({
  message: {
    loading: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    destroy: vi.fn(),
  },
}));

const mockRefresh = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  useSessionStore.setState({
    refreshSessions: mockRefresh,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('SessionAction', () => {
  describe('clearSessions', () => {
    it('should clear all sessions and refresh the list', async () => {
      const { result } = renderHook(() => useSessionStore());

      await act(async () => {
        await result.current.clearSessions();
      });

      expect(sessionService.removeAllSessions).toHaveBeenCalled();
      expect(mockRefresh).toHaveBeenCalled(); // 假设 refreshSessions 调用了 getSessions
    });
  });

  describe('createSession', () => {
    it('should create a new session and switch to it', async () => {
      const { result } = renderHook(() => useSessionStore());
      const newSessionId = 'new-session-id';
      vi.mocked(sessionService.createSession).mockResolvedValue(newSessionId);

      let createdSessionId;

      await act(async () => {
        createdSessionId = await result.current.createSession({
          config: { chatConfig: { enableHistoryCount: true } },
        });
      });

      const call = vi.mocked(sessionService.createSession).mock.calls[0];
      expect(call[0]).toEqual(LobeSessionType.Agent);
      expect(call[1]).toMatchObject({ config: { chatConfig: { enableHistoryCount: true } } });

      expect(createdSessionId).toBe(newSessionId);
    });

    it('should create a new session but not switch to it if isSwitchSession is false', async () => {
      const { result } = renderHook(() => useSessionStore());
      const newSessionId = 'new-session-id';
      vi.mocked(sessionService.createSession).mockResolvedValue(newSessionId);

      let createdSessionId;

      await act(async () => {
        createdSessionId = await result.current.createSession(
          { config: { chatConfig: { enableHistoryCount: true } } },
          false,
        );
      });

      const call = vi.mocked(sessionService.createSession).mock.calls[0];
      expect(call[0]).toEqual(LobeSessionType.Agent);
      expect(call[1]).toMatchObject({ config: { chatConfig: { enableHistoryCount: true } } });

      expect(createdSessionId).toBe(newSessionId);
    });
  });

  describe('cloneSession', () => {
    it('should duplicate a session and switch to the new one', async () => {
      const { result } = renderHook(() => useSessionStore());
      const sessionId = 'session-id';
      const duplicatedSessionId = 'duplicated-session-id';
      vi.mocked(sessionService.cloneSession).mockResolvedValue(duplicatedSessionId);
      vi.mocked(message.loading).mockResolvedValue(true);

      await act(async () => {
        await result.current.duplicateSession(sessionId);
      });

      expect(message.loading).toHaveBeenCalled();
      expect(sessionService.cloneSession).toHaveBeenCalledWith(sessionId, expect.any(String));
    });
  });

  describe('removeSession', () => {
    it('should remove a session and refresh the list', async () => {
      const { result } = renderHook(() => useSessionStore());
      const sessionId = 'session-id';

      await act(async () => {
        await result.current.removeSession(sessionId);
      });

      expect(sessionService.removeSession).toHaveBeenCalledWith(sessionId);
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  describe('activeSession', () => {
    it('should set the provided session id as active', async () => {
      const { result } = renderHook(() => useSessionStore());
      const sessionId = 'active-session-id';

      act(() => {
        result.current.switchSession(sessionId);
      });

      expect(result.current.activeAgentId).toBe(sessionId);
    });
  });

  describe('pinSession', () => {
    it('should pin a session when pinned is true', async () => {
      const { result } = renderHook(() => useSessionStore());
      const sessionId = 'session-id-to-pin';

      await act(async () => {
        await result.current.pinSession(sessionId, true);
      });

      expect(sessionService.updateSession).toHaveBeenCalledWith(sessionId, { pinned: true });
      expect(mockRefresh).toHaveBeenCalled();
    });

    it('should unpin a session when pinned is false', async () => {
      const { result } = renderHook(() => useSessionStore());
      const sessionId = 'session-id-to-unpin';

      await act(async () => {
        await result.current.pinSession(sessionId, false);
      });

      expect(sessionService.updateSession).toHaveBeenCalledWith(sessionId, { pinned: false });
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  describe('updateSessionGroupId', () => {
    it('should update regular session group and refresh the list', async () => {
      const { result } = renderHook(() => useSessionStore());
      const sessionId = 'session-id';
      const groupId = 'new-group-id';

      // Mock session selector to return a regular agent session
      vi.spyOn(sessionSelectors, 'getSessionById').mockReturnValue(
        () =>
          ({
            id: sessionId,
            type: 'agent',
          }) as any,
      );

      await act(async () => {
        await result.current.updateSessionGroupId(sessionId, groupId);
      });

      expect(sessionService.updateSession).toHaveBeenCalledWith(sessionId, { group: groupId });
      expect(mockRefresh).toHaveBeenCalled();
    });

    it('should update chat group session and refresh the list', async () => {
      const { result } = renderHook(() => useSessionStore());
      const sessionId = 'group-session-id';
      const groupId = 'new-group-id';

      // Mock session selector to return a group session
      vi.spyOn(sessionSelectors, 'getSessionById').mockReturnValue(
        () =>
          ({
            id: sessionId,
            type: 'group',
          }) as any,
      );

      await act(async () => {
        await result.current.updateSessionGroupId(sessionId, groupId);
      });

      expect(chatGroupService.updateGroup).toHaveBeenCalledWith(sessionId, { groupId });
      expect(mockRefresh).toHaveBeenCalled();
    });

    it('should handle default group for chat group sessions', async () => {
      const { result } = renderHook(() => useSessionStore());
      const sessionId = 'group-session-id';
      const groupId = 'default';

      // Mock session selector to return a group session
      vi.spyOn(sessionSelectors, 'getSessionById').mockReturnValue(
        () =>
          ({
            id: sessionId,
            type: 'group',
          }) as any,
      );

      await act(async () => {
        await result.current.updateSessionGroupId(sessionId, groupId);
      });

      expect(chatGroupService.updateGroup).toHaveBeenCalledWith(sessionId, { groupId: null });
      expect(mockRefresh).toHaveBeenCalled();
    });
  });
});
