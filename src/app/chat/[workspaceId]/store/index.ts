/**
 * 本文件是 AutocodeLLM 项目的原始实现
 *
 * AutocodeLLM 项目许可证：
 * Apache License, Version 2.0
 * Copyright (c) 2026 Jyf0214
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { initialState } from './initialState';
import type { ChatStoreState } from './types';
import { createChatSlice, type ChatSlice } from './slices/chat/slice';
import { createMessagesSlice, type MessagesSlice } from './slices/messages/slice';
import { createAgentSlice, type AgentSlice } from './slices/agent/slice';
import { createInputSlice, type InputSlice } from './slices/input/slice';
import { createUISlice, type UISlice } from './slices/ui/slice';

export type ChatStore = ChatStoreState & ChatSlice & MessagesSlice & AgentSlice & InputSlice & UISlice;

export const useChatStore = create<ChatStore>()(
  devtools(
    (set, get) => ({
      ...initialState,
      ...createChatSlice(set, get),
      ...createMessagesSlice(set, get),
      ...createAgentSlice(set, get),
      ...createInputSlice(set, get),
      ...createUISlice(set, get),
    }),
    { name: 'ChatStore', enabled: process.env.NODE_ENV === 'development' }
  )
);

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

export type { ChatStoreState } from './types';
export type { ChatMessage, WorkspaceInfo, ModelConfig, AgentInstance, GroupOrchestrationState, SupervisorState, AgentState, ModelState, InputState, FileAttachment, UIState, ErrorDialogState, ChatError } from './types';
