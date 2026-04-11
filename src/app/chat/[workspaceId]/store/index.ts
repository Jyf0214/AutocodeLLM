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

export type ChatStore = ChatStoreState & ChatSlice & MessagesSlice & AgentSlice & InputSlice & UISlice;

const useChatStoreBase = create<ChatStore>()(
  devtools(
    (set, get) => ({
      ...initialState,
      ...createChatSlice(set as never, get as never),
      ...createMessagesSlice(set as never, get as never),
      ...createAgentSlice(set as never, get as never),
      ...createInputSlice(set as never, get as never),
      ...createUISlice(set as never, get as never),
    }),
    { name: 'ChatStore' }
  )
);

export const useChatStore = useChatStoreBase as typeof useChatStoreBase & {
  getState: () => ChatStore;
  setState: (state: Partial<ChatStore>) => void;
  subscribe: (listener: (state: ChatStore) => void) => () => void;
};

export const getChatStoreState = (): ChatStoreState => {
  const s = useChatStoreBase.getState();
  return { workspaceId: s.workspaceId, workspace: s.workspace, messages: s.messages, messageMap: s.messageMap, isLoading: s.isLoading, error: s.error, agents: s.agents, models: s.models, input: s.input, ui: s.ui };
};

export type { ChatStoreState } from './types';
export type { ChatMessage, WorkspaceInfo, ModelConfig, AgentInstance, GroupOrchestrationState, SupervisorState, AgentState, ModelState, InputState, FileAttachment, UIState, ErrorDialogState, ChatError } from './types';
