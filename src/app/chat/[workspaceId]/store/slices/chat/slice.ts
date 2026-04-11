/**
 * 本文件是 AutocodeLLM 项目的原始实现
 *
 * AutocodeLLM 项目许可证：
 * Apache License, Version 2.0
 * Copyright (c) 2026 Jyf0214
 */

import type { StateCreator } from 'zustand';
import type { ChatStoreState, WorkspaceInfo, ChatError } from '../types';

/**
 * Chat Slice - 聊天核心功能
 */
export interface ChatSlice {
  // Actions
  initializeChat: (workspaceId: string) => Promise<void>;
  loadWorkspace: () => Promise<void>;
  clearChat: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: ChatError | null) => void;
}

/**
 * 创建Chat Slice
 */
export const createChatSlice: StateCreator<
  ChatStoreState,
  [['zustand/devtools', never]],
  [],
  ChatSlice
> = (set, get) => ({
  // 初始状态
  workspaceId: '',
  workspace: null,
  isLoading: false,
  error: null,

  // Actions
  initializeChat: async (workspaceId: string) => {
    set({ workspaceId, isLoading: true, error: null });
    
    try {
      await get().loadWorkspace();
    } catch (error) {
      const chatError: ChatError = {
        message: error instanceof Error ? error.message : '初始化聊天失败',
        code: 'INIT_FAILED',
      };
      set({ error: chatError });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  loadWorkspace: async () => {
    const { workspaceId } = get();
    
    if (!workspaceId) {
      throw new Error('Workspace ID not set');
    }

    set({ isLoading: true });

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}`);
      const result: { success: boolean; data?: WorkspaceInfo; error?: { message: string } } =
        await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error?.message ?? '获取工作区信息失败');
      }

      set({ workspace: result.data });
    } catch (error) {
      const chatError: ChatError = {
        message: error instanceof Error ? error.message : '加载工作区失败',
        code: 'LOAD_WORKSPACE_FAILED',
      };
      set({ error: chatError });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  clearChat: () => {
    set({
      messages: [],
      messageMap: new Map(),
      error: null,
      agents: {
        activeAgents: [],
        status: 'idle',
      },
    });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: ChatError | null) => {
    set({ error });
  },
});
