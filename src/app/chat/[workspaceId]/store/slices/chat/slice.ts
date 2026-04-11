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
  initializeChat: (workspaceId: string) => Promise<void>;
  loadWorkspace: () => Promise<void>;
  clearChat: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: ChatError | null) => void;
}

export const createChatSlice: StateCreator<ChatStoreState, [], [], ChatSlice> = (set, get) => ({
  workspaceId: '',
  workspace: null,
  isLoading: false,
  error: null,

  initializeChat: async (workspaceId: string) => {
    set({ workspaceId, isLoading: true, error: null });
    try {
      await get().loadWorkspace();
    } catch (error) {
      set({ error: { message: error instanceof Error ? error.message : '初始化失败', code: 'INIT_FAILED' } });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  loadWorkspace: async () => {
    const { workspaceId } = get();
    if (!workspaceId) throw new Error('Workspace ID not set');
    set({ isLoading: true });
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}`);
      const result = await response.json();
      if (!result.success || !result.data) throw new Error(result.error?.message ?? '获取工作区失败');
      set({ workspace: result.data });
    } catch (error) {
      set({ error: { message: error instanceof Error ? error.message : '加载失败', code: 'LOAD_FAILED' } });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  clearChat: () => set({ messages: [], messageMap: new Map(), error: null }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: ChatError | null) => set({ error }),
});
