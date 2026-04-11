/**
 * 本文件是 AutocodeLLM 项目的原始实现
 *
 * AutocodeLLM 项目许可证：
 * Apache License, Version 2.0
 * Copyright (c) 2026 Jyf0214
 */

import React, { createContext, useContext, useReducer, useCallback, useRef } from 'react';
import { initialState } from './initialState';
import type { ChatStoreState, ChatMessage, ModelConfig, AgentInstance, AgentState, FileAttachment, ErrorDialogState } from './types';

type Action =
  | { type: 'SET_WORKSPACE_ID'; payload: string }
  | { type: 'SET_WORKSPACE'; payload: ChatStoreState['workspace'] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: ChatStoreState['error'] }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; updates: Partial<ChatMessage> } }
  | { type: 'REMOVE_MESSAGE'; payload: string }
  | { type: 'BATCH_UPDATE_MESSAGES'; payload: Array<{ id: string; updates: Partial<ChatMessage> }> }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'SET_AGENTS'; payload: Partial<AgentState> }
  | { type: 'SET_INPUT_VALUE'; payload: string }
  | { type: 'SET_SENDING'; payload: boolean }
  | { type: 'ADD_ATTACHMENT'; payload: FileAttachment }
  | { type: 'REMOVE_ATTACHMENT'; payload: string }
  | { type: 'CLEAR_ATTACHMENTS' }
  | { type: 'CLEAR_INPUT' }
  | { type: 'TOGGLE_AGENT_PANEL'; payload?: boolean }
  | { type: 'SET_SCROLL_TO_BOTTOM'; payload: boolean }
  | { type: 'SET_LOADING_MESSAGES'; payload: boolean }
  | { type: 'SHOW_ERROR_DIALOG'; payload: ErrorDialogState }
  | { type: 'HIDE_ERROR_DIALOG' };

function reducer(state: ChatStoreState, action: Action): ChatStoreState {
  switch (action.type) {
    case 'SET_WORKSPACE_ID':
      return { ...state, workspaceId: action.payload };
    case 'SET_WORKSPACE':
      return { ...state, workspace: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
        messageMap: new Map(state.messageMap).set(action.payload.id, action.payload),
      };
    case 'UPDATE_MESSAGE': {
      const { id, updates } = action.payload;
      const existing = state.messageMap.get(id);
      if (!existing) return state;
      const updated = { ...existing, ...updates, updatedAt: Date.now() };
      const newMap = new Map(state.messageMap).set(id, updated);
      return {
        ...state,
        messages: state.messages.map((m) => (m.id === id ? updated : m)),
        messageMap: newMap,
      };
    }
    case 'REMOVE_MESSAGE': {
      const newMap = new Map(state.messageMap);
      newMap.delete(action.payload);
      return {
        ...state,
        messages: state.messages.filter((m) => m.id !== action.payload),
        messageMap: newMap,
      };
    }
    case 'BATCH_UPDATE_MESSAGES': {
      let newMessages = [...state.messages];
      const newMap = new Map(state.messageMap);
      for (const { id, updates } of action.payload) {
        const existing = newMap.get(id);
        if (!existing) continue;
        const updated = { ...existing, ...updates, updatedAt: Date.now() };
        newMessages = newMessages.map((m) => (m.id === id ? updated : m));
        newMap.set(id, updated);
      }
      return { ...state, messages: newMessages, messageMap: newMap };
    }
    case 'CLEAR_MESSAGES':
      return { ...state, messages: [], messageMap: new Map() };
    case 'SET_AGENTS':
      return { ...state, agents: { ...state.agents, ...action.payload } };
    case 'SET_INPUT_VALUE':
      return { ...state, input: { ...state.input, value: action.payload } };
    case 'SET_SENDING':
      return { ...state, input: { ...state.input, isSending: action.payload } };
    case 'ADD_ATTACHMENT':
      return { ...state, input: { ...state.input, attachments: [...state.input.attachments, action.payload] } };
    case 'REMOVE_ATTACHMENT':
      return { ...state, input: { ...state.input, attachments: state.input.attachments.filter((f) => f.id !== action.payload) } };
    case 'CLEAR_ATTACHMENTS':
      return { ...state, input: { ...state.input, attachments: [] } };
    case 'CLEAR_INPUT':
      return { ...state, input: { ...state.input, value: '' } };
    case 'TOGGLE_AGENT_PANEL':
      return { ...state, ui: { ...state.ui, showAgentPanel: action.payload !== undefined ? action.payload : !state.ui.showAgentPanel } };
    case 'SET_SCROLL_TO_BOTTOM':
      return { ...state, ui: { ...state.ui, scrollToBottom: action.payload } };
    case 'SET_LOADING_MESSAGES':
      return { ...state, ui: { ...state.ui, loadingMessages: action.payload } };
    case 'SHOW_ERROR_DIALOG':
      return { ...state, ui: { ...state.ui, errorDialog: action.payload } };
    case 'HIDE_ERROR_DIALOG':
      return { ...state, ui: { ...state.ui, errorDialog: null } };
    default:
      return state;
  }
}

const ChatStoreContext = createContext<{
  state: ChatStoreState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function ChatStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <ChatStoreContext.Provider value={{ state, dispatch }}>{children}</ChatStoreContext.Provider>;
}

function useChatStoreContext() {
  const ctx = useContext(ChatStoreContext);
  if (!ctx) throw new Error('useChatStoreContext must be used within ChatStoreProvider');
  return ctx;
}

// Hook 接口（兼容之前的 useChatStore 调用）
export function useChatStore() {
  const { state, dispatch } = useChatStoreContext();

  return {
    ...state,
    initializeChat: useCallback((workspaceId: string) => {
      dispatch({ type: 'SET_WORKSPACE_ID', payload: workspaceId });
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
    }, [dispatch]),
    loadWorkspace: useCallback(async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const response = await fetch(`/api/workspaces/${state.workspaceId}`);
        const result = await response.json();
        if (result.success && result.data) {
          dispatch({ type: 'SET_WORKSPACE', payload: result.data });
        } else {
          throw new Error(result.error?.message ?? '获取工作区失败');
        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: { message: error instanceof Error ? error.message : '加载失败', code: 'LOAD_FAILED' } });
        throw error;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }, [state.workspaceId, dispatch]),
    clearChat: useCallback(() => dispatch({ type: 'CLEAR_MESSAGES' }), [dispatch]),
    setLoading: useCallback((loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }), [dispatch]),
    setError: useCallback((error: ChatStoreState['error']) => dispatch({ type: 'SET_ERROR', payload: error }), [dispatch]),
    addMessage: useCallback((message: ChatMessage) => dispatch({ type: 'ADD_MESSAGE', payload: message }), [dispatch]),
    updateMessage: useCallback((id: string, updates: Partial<ChatMessage>) => dispatch({ type: 'UPDATE_MESSAGE', payload: { id, updates } }), [dispatch]),
    removeMessage: useCallback((id: string) => dispatch({ type: 'REMOVE_MESSAGE', payload: id }), [dispatch]),
    batchUpdateMessages: useCallback((updates: Array<{ id: string; updates: Partial<ChatMessage> }>) => dispatch({ type: 'BATCH_UPDATE_MESSAGES', payload: updates }), [dispatch]),
    runSingleAgent: useCallback(async (_params: { message: string; model: ModelConfig }) => {
      console.log('runSingleAgent called with:', _params);
    }, []),
    cancelAgentExecution: useCallback(() => dispatch({ type: 'SET_AGENTS', payload: { status: 'cancelled' } }), [dispatch]),
    updateAgentStatus: useCallback((status: AgentState['status']) => dispatch({ type: 'SET_AGENTS', payload: { status } }), [dispatch]),
    setActiveAgents: useCallback((activeAgents: AgentInstance[]) => dispatch({ type: 'SET_AGENTS', payload: { activeAgents } }), [dispatch]),
    addActiveAgent: useCallback((agent: AgentInstance) => {
      dispatch({ type: 'SET_AGENTS', payload: { activeAgents: [] } }); // placeholder
    }, [dispatch]),
    removeActiveAgent: useCallback((agentId: string) => {
      // placeholder
    }, []),
    updateAgent: useCallback((_agentId: string, _updates: Partial<AgentInstance>) => {
      // placeholder
    }, []),
    setInputValue: useCallback((value: string) => dispatch({ type: 'SET_INPUT_VALUE', payload: value }), [dispatch]),
    clearInput: useCallback(() => dispatch({ type: 'CLEAR_INPUT' }), [dispatch]),
    setSending: useCallback((isSending: boolean) => dispatch({ type: 'SET_SENDING', payload: isSending }), [dispatch]),
    addAttachment: useCallback((file: FileAttachment) => dispatch({ type: 'ADD_ATTACHMENT', payload: file }), [dispatch]),
    removeAttachment: useCallback((id: string) => dispatch({ type: 'REMOVE_ATTACHMENT', payload: id }), [dispatch]),
    clearAttachments: useCallback(() => dispatch({ type: 'CLEAR_ATTACHMENTS' }), [dispatch]),
    toggleAgentPanel: useCallback((show?: boolean) => dispatch({ type: 'TOGGLE_AGENT_PANEL', payload: show }), [dispatch]),
    setScrollToBottom: useCallback((scroll: boolean) => dispatch({ type: 'SET_SCROLL_TO_BOTTOM', payload: scroll }), [dispatch]),
    setLoadingMessages: useCallback((loading: boolean) => dispatch({ type: 'SET_LOADING_MESSAGES', payload: loading }), [dispatch]),
    showErrorDialog: useCallback((dialogState: ErrorDialogState) => dispatch({ type: 'SHOW_ERROR_DIALOG', payload: dialogState }), [dispatch]),
    hideErrorDialog: useCallback(() => dispatch({ type: 'HIDE_ERROR_DIALOG' }), [dispatch]),
  };
}

// 用于非组件场景
export const getChatStoreState = () => {
  // 注意：这只能在组件内调用，因为使用了 context
  const ctx = useChatStoreContext();
  return ctx.state;
};

export type { ChatStoreState } from './types';
export type { ChatMessage, WorkspaceInfo, ModelConfig, AgentInstance, GroupOrchestrationState, SupervisorState, AgentState, ModelState, InputState, FileAttachment, UIState, ErrorDialogState, ChatError } from './types';
