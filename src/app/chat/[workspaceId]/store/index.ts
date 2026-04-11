/**
 * 本文件是 AutocodeLLM 项目的原始实现
 *
 * AutocodeLLM 项目许可证：
 * Apache License, Version 2.0
 * Copyright (c) 2026 Jyf0214
 */

import createStore from 'zustand/vanilla';
import { useStore } from 'zustand/react';
import { devtools } from 'zustand/middleware';

import { initialState } from './initialState';
import type { ChatStoreState } from './types';
import { createChatSlice, type ChatSlice } from './slices/chat/slice';
import { createMessagesSlice, type MessagesSlice } from './slices/messages/slice';
import { createAgentSlice, type AgentSlice } from './slices/agent/slice';
import { createInputSlice, type InputSlice } from './slices/input/slice';
import { createUISlice, type UISlice } from './slices/ui/slice';

export type ChatStore = ChatStoreState & ChatSlice & MessagesSlice & AgentSlice & InputSlice & UISlice;

const store = createStore<ChatStore>()(
  devtools(
    (set, get) => ({
      ...initialState,
      ...createChatSlice(set, get),
      ...createMessagesSlice(set, get),
      ...createAgentSlice(set, get),
      ...createInputSlice(set, get),
      ...createUISlice(set, get),
    }),
    { name: 'ChatStore' }
  )
);

export function useChatStore(): ChatStore;
export function useChatStore<T>(selector: (state: ChatStore) => T): T;
export function useChatStore<T>(selector?: (state: ChatStore) => T): T | ChatStore {
  if (selector) return useStore(store, selector);
  return useStore(store) as ChatStore;
}
Object.assign(useChatStore, store);

export const getChatStoreState = (): ChatStoreState => {
  const s = store.getState();
  return { workspaceId: s.workspaceId, workspace: s.workspace, messages: s.messages, messageMap: s.messageMap, isLoading: s.isLoading, error: s.error, agents: s.agents, models: s.models, input: s.input, ui: s.ui };
};

export type { ChatStoreState } from './types';
export type { ChatMessage, WorkspaceInfo, ModelConfig, AgentInstance, GroupOrchestrationState, SupervisorState, AgentState, ModelState, InputState, FileAttachment, UIState, ErrorDialogState, ChatError } from './types';
