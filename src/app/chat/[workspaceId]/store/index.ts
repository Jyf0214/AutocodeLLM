/**
 * 本文件是 AutocodeLLM 项目的原始实现
 *
 * AutocodeLLM 项目许可证：
 * Apache License, Version 2.0
 * Copyright (c) 2026 Jyf0214
 */

import create from 'zustand';
import { devtools } from 'zustand/middleware';

import { initialState } from './initialState';
import type { ChatStoreState } from './types';
import { createChatSlice, type ChatSlice } from './slices/chat/slice';
import { createMessagesSlice, type MessagesSlice } from './slices/messages/slice';
import { createAgentSlice, type AgentSlice } from './slices/agent/slice';
import { createInputSlice, type InputSlice } from './slices/input/slice';
import { createUISlice, type UISlice } from './slices/ui/slice';

/**
 * Chat Store 类型
 */
export type ChatStore = ChatStoreState &
  ChatSlice &
  MessagesSlice &
  AgentSlice &
  InputSlice &
  UISlice;

/**
 * Chat Store 实例（单例）
 * 注意：每个 workspace 应该有独立的 store 实例
 * 这里先使用单例，后续可改为多实例
 */
export const useChatStore = create<ChatStore>(
  devtools(
    (set, get, api) => ({
      ...initialState,
      ...createChatSlice(set as any, get, api),
      ...createMessagesSlice(set as any, get, api),
      ...createAgentSlice(set as any, get, api),
      ...createInputSlice(set as any, get, api),
      ...createUISlice(set as any, get, api),
    }),
    {
      name: 'ChatStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

/**
 * 获取 Store 状态（用于非组件场景）
 */
export const getChatStoreState = (): ChatStoreState => {
  const state = useChatStore.getState();
  return {
    workspaceId: state.workspaceId,
    workspace: state.workspace,
    messages: state.messages,
    messageMap: state.messageMap,
    isLoading: state.isLoading,
    error: state.error,
    agents: state.agents,
    models: state.models,
    input: state.input,
    ui: state.ui,
  };
};

// 导出类型
export type { ChatStoreState } from './types';
export type {
  ChatMessage,
  WorkspaceInfo,
  ModelConfig,
  AgentInstance,
  GroupOrchestrationState,
  SupervisorState,
  AgentState,
  ModelState,
  InputState,
  FileAttachment,
  UIState,
  ErrorDialogState,
  ChatError,
} from './types';
