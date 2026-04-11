/**
 * 本文件是 AutocodeLLM 项目的原始实现
 *
 * AutocodeLLM 项目许可证：
 * Apache License, Version 2.0
 * Copyright (c) 2026 Jyf0214
 */

import type { StateCreator } from 'zustand';
import type { ChatStoreState, ChatMessage } from '../types';

export interface MessagesSlice {
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  removeMessage: (id: string) => void;
  batchUpdateMessages: (updates: Array<{ id: string; updates: Partial<ChatMessage> }>) => void;
  clearMessages: () => void;
}

export const createMessagesSlice: StateCreator<ChatStoreState, [], [], MessagesSlice> = (set) => ({
  messages: [],
  messageMap: new Map(),

  addMessage: (message: ChatMessage) => {
    set((state) => {
      const newMap = new Map(state.messageMap);
      newMap.set(message.id, message);
      return { messages: [...state.messages, message], messageMap: newMap };
    });
  },

  updateMessage: (id: string, updates: Partial<ChatMessage>) => {
    set((state) => {
      const existing = state.messageMap.get(id);
      if (!existing) return state;
      const updated = { ...existing, ...updates, updatedAt: Date.now() };
      const newMap = new Map(state.messageMap);
      newMap.set(id, updated);
      return { messages: state.messages.map((m) => (m.id === id ? updated : m)), messageMap: newMap };
    });
  },

  removeMessage: (id: string) => {
    set((state) => {
      const newMap = new Map(state.messageMap);
      newMap.delete(id);
      return { messages: state.messages.filter((m) => m.id !== id), messageMap: newMap };
    });
  },

  batchUpdateMessages: (updates) => {
    set((state) => {
      let newMessages = [...state.messages];
      const newMap = new Map(state.messageMap);
      for (const { id, updates: u } of updates) {
        const existing = newMap.get(id);
        if (!existing) continue;
        const updated = { ...existing, ...u, updatedAt: Date.now() };
        newMessages = newMessages.map((m) => (m.id === id ? updated : m));
        newMap.set(id, updated);
      }
      return { messages: newMessages, messageMap: newMap };
    });
  },

  clearMessages: () => set({ messages: [], messageMap: new Map() }),
});
