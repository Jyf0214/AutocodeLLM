/**
 * 本文件是 AutocodeLLM 项目的原始实现
 *
 * AutocodeLLM 项目许可证：
 * Apache License, Version 2.0
 * Copyright (c) 2026 Jyf0214
 */

import type { StateCreator } from 'zustand';
import type { ChatStoreState, ChatMessage } from '../types';

/**
 * Messages Slice - 消息管理
 */
export interface MessagesSlice {
  // Actions
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  removeMessage: (id: string) => void;
  optimisticUpdate: (id: string, updates: Partial<ChatMessage>) => void;
  batchUpdateMessages: (updates: Array<{ id: string; updates: Partial<ChatMessage> }>) => void;
  clearMessages: () => void;
}

/**
 * 创建Messages Slice
 */
export const createMessagesSlice: StateCreator<
  ChatStoreState,
  [['zustand/devtools', never]],
  [],
  MessagesSlice
> = (set, get) => ({
  // 初始状态
  messages: [],
  messageMap: new Map(),

  // Actions
  addMessage: (message: ChatMessage) => {
    set((state) => {
      const newMessages = [...state.messages, message];
      const newMap = new Map(state.messageMap);
      newMap.set(message.id, message);
      
      return {
        messages: newMessages,
        messageMap: newMap,
      };
    });
  },

  updateMessage: (id: string, updates: Partial<ChatMessage>) => {
    set((state) => {
      const existingMessage = state.messageMap.get(id);
      if (!existingMessage) {
        console.warn(`Message ${id} not found`);
        return state;
      }

      const updatedMessage = {
        ...existingMessage,
        ...updates,
        updatedAt: Date.now(),
      };

      const newMessages = state.messages.map((m) => (m.id === id ? updatedMessage : m));
      const newMap = new Map(state.messageMap);
      newMap.set(id, updatedMessage);

      return {
        messages: newMessages,
        messageMap: newMap,
      };
    });
  },

  removeMessage: (id: string) => {
    set((state) => {
      const newMessages = state.messages.filter((m) => m.id !== id);
      const newMap = new Map(state.messageMap);
      newMap.delete(id);

      return {
        messages: newMessages,
        messageMap: newMap,
      };
    });
  },

  optimisticUpdate: (id: string, updates: Partial<ChatMessage>) => {
    // 乐观更新，立即反映到UI
    get().updateMessage(id, updates);
  },

  batchUpdateMessages: (updates) => {
    set((state) => {
      let newMessages = [...state.messages];
      const newMap = new Map(state.messageMap);

      for (const { id, updates: msgUpdates } of updates) {
        const existingMessage = newMap.get(id);
        if (!existingMessage) {
          console.warn(`Message ${id} not found`);
          continue;
        }

        const updatedMessage = {
          ...existingMessage,
          ...msgUpdates,
          updatedAt: Date.now(),
        };

        newMessages = newMessages.map((m) => (m.id === id ? updatedMessage : m));
        newMap.set(id, updatedMessage);
      }

      return {
        messages: newMessages,
        messageMap: newMap,
      };
    });
  },

  clearMessages: () => {
    set({
      messages: [],
      messageMap: new Map(),
    });
  },
});
