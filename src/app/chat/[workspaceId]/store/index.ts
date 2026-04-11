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
 * 创建Chat Store实例
 * 使用函数形式以支持动态workspaceId
 */
const createChatStore = () => {
  return create<ChatStore>()(
    devtools(
      (...a) => ({
        ...initialState,
        ...createChatSlice(...a),
        ...createMessagesSlice(...a),
        ...createAgentSlice(...a),
        ...createInputSlice(...a),
        ...createUISlice(...a),
      }),
      {
        name: 'ChatStore',
        enabled: process.env.NODE_ENV === 'development',
      }
    )
  );
};

/**
 * Chat Store实例（单例）
 * 注意：每个workspace应该有独立的store实例
 * 这里先使用单例，后续可改为多实例
 */
export const useChatStore = createChatStore();

/**
 * 获取Store状态（用于非组件场景）
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
