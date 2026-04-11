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

import { agentService } from '@/services/agent';

import { useAgentStore } from '../../store';

// Mock zustand/traditional for store testing
vi.mock('zustand/traditional');

// Mock agentService
vi.mock('@/services/agent', () => ({
  agentService: {
    updateAgentConfig: vi.fn(),
  },
}));

// Mock sessionStore
vi.mock('@/store/session', () => ({
  useSessionStore: {
    getState: vi.fn(() => ({
      refreshSessions: vi.fn(),
    })),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  useAgentStore.setState({
    activeAgentId: undefined,
    agentMap: {},
    builtinAgentIdMap: {},
    updateAgentConfigSignal: undefined,
    updateAgentMetaSignal: undefined,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PluginSlice Actions', () => {
  describe('togglePlugin', () => {
    it('should add plugin when not in list', async () => {
      const { result } = renderHook(() => useAgentStore());

      vi.mocked(agentService.updateAgentConfig).mockResolvedValue({
        agent: { plugins: ['plugin-1'] } as any,
        success: true,
      });

      act(() => {
        useAgentStore.setState({
          activeAgentId: 'agent-1',
          agentMap: { 'agent-1': { plugins: [] } as any },
        });
      });

      await act(async () => {
        await result.current.togglePlugin('plugin-1');
      });

      expect(agentService.updateAgentConfig).toHaveBeenCalledWith(
        'agent-1',
        expect.objectContaining({
          plugins: ['plugin-1'],
        }),
        expect.any(AbortSignal),
      );
    });

    it('should remove plugin when in list', async () => {
      const { result } = renderHook(() => useAgentStore());

      vi.mocked(agentService.updateAgentConfig).mockResolvedValue({
        agent: { plugins: [] } as any,
        success: true,
      });

      act(() => {
        useAgentStore.setState({
          activeAgentId: 'agent-1',
          agentMap: { 'agent-1': { plugins: ['plugin-1'] } as any },
        });
      });

      await act(async () => {
        await result.current.togglePlugin('plugin-1');
      });

      expect(agentService.updateAgentConfig).toHaveBeenCalledWith(
        'agent-1',
        expect.objectContaining({
          plugins: [],
        }),
        expect.any(AbortSignal),
      );
    });

    it('should add plugin when open=true explicitly', async () => {
      const { result } = renderHook(() => useAgentStore());

      vi.mocked(agentService.updateAgentConfig).mockResolvedValue({
        agent: { plugins: ['plugin-1'] } as any,
        success: true,
      });

      act(() => {
        useAgentStore.setState({
          activeAgentId: 'agent-1',
          agentMap: { 'agent-1': { plugins: [] } as any },
        });
      });

      await act(async () => {
        await result.current.togglePlugin('plugin-1', true);
      });

      expect(agentService.updateAgentConfig).toHaveBeenCalledWith(
        'agent-1',
        expect.objectContaining({
          plugins: ['plugin-1'],
        }),
        expect.any(AbortSignal),
      );
    });

    it('should remove plugin when open=false explicitly', async () => {
      const { result } = renderHook(() => useAgentStore());

      vi.mocked(agentService.updateAgentConfig).mockResolvedValue({
        agent: { plugins: [] } as any,
        success: true,
      });

      act(() => {
        useAgentStore.setState({
          activeAgentId: 'agent-1',
          agentMap: { 'agent-1': { plugins: ['plugin-1'] } as any },
        });
      });

      await act(async () => {
        await result.current.togglePlugin('plugin-1', false);
      });

      expect(agentService.updateAgentConfig).toHaveBeenCalledWith(
        'agent-1',
        expect.objectContaining({
          plugins: [],
        }),
        expect.any(AbortSignal),
      );
    });

    it('should not add duplicate plugin', async () => {
      const { result } = renderHook(() => useAgentStore());

      vi.mocked(agentService.updateAgentConfig).mockResolvedValue({
        agent: { plugins: ['plugin-1'] } as any,
        success: true,
      });

      act(() => {
        useAgentStore.setState({
          activeAgentId: 'agent-1',
          agentMap: { 'agent-1': { plugins: ['plugin-1'] } as any },
        });
      });

      await act(async () => {
        await result.current.togglePlugin('plugin-1', true);
      });

      // Should still have only one plugin-1
      expect(agentService.updateAgentConfig).toHaveBeenCalledWith(
        'agent-1',
        expect.objectContaining({
          plugins: ['plugin-1'],
        }),
        expect.any(AbortSignal),
      );
    });

    it('should handle empty plugins array', async () => {
      const { result } = renderHook(() => useAgentStore());

      vi.mocked(agentService.updateAgentConfig).mockResolvedValue({
        agent: { plugins: ['plugin-1'] } as any,
        success: true,
      });

      act(() => {
        useAgentStore.setState({
          activeAgentId: 'agent-1',
          agentMap: { 'agent-1': {} as any }, // No plugins field
        });
      });

      await act(async () => {
        await result.current.togglePlugin('plugin-1');
      });

      expect(agentService.updateAgentConfig).toHaveBeenCalledWith(
        'agent-1',
        expect.objectContaining({
          plugins: ['plugin-1'],
        }),
        expect.any(AbortSignal),
      );
    });
  });

  describe('removePlugin', () => {
    it('should call togglePlugin with open=false', async () => {
      const { result } = renderHook(() => useAgentStore());

      vi.mocked(agentService.updateAgentConfig).mockResolvedValue({
        agent: { plugins: [] } as any,
        success: true,
      });

      act(() => {
        useAgentStore.setState({
          activeAgentId: 'agent-1',
          agentMap: { 'agent-1': { plugins: ['plugin-1'] } as any },
        });
      });

      await act(async () => {
        await result.current.removePlugin('plugin-1');
      });

      expect(agentService.updateAgentConfig).toHaveBeenCalledWith(
        'agent-1',
        expect.objectContaining({
          plugins: [],
        }),
        expect.any(AbortSignal),
      );
    });

    it('should handle removing non-existent plugin gracefully', async () => {
      const { result } = renderHook(() => useAgentStore());

      vi.mocked(agentService.updateAgentConfig).mockResolvedValue({
        agent: { plugins: ['existing-plugin'] } as any,
        success: true,
      });

      act(() => {
        useAgentStore.setState({
          activeAgentId: 'agent-1',
          agentMap: { 'agent-1': { plugins: ['existing-plugin'] } as any },
        });
      });

      await act(async () => {
        await result.current.removePlugin('non-existent');
      });

      // Should not modify the array
      expect(agentService.updateAgentConfig).toHaveBeenCalledWith(
        'agent-1',
        expect.objectContaining({
          plugins: ['existing-plugin'],
        }),
        expect.any(AbortSignal),
      );
    });
  });
});
