/**
 * 本文件是 AutocodeLLM 项目的原始实现
 *
 * AutocodeLLM 项目许可证：
 * Apache License, Version 2.0
 * Copyright (c) 2026 Jyf0214
 */

import type { StateCreator } from 'zustand';
import type { ChatStoreState, ChatMessage } from '../../types';

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
  addMessage: (message: ChatMessage) => set((s) => { const m = new Map(s.messageMap); m.set(message.id, message); return { messages: [...s.messages, message], messageMap: m }; }),
  updateMessage: (id, u) => set((s) => { const e = s.messageMap.get(id); if (!e) return s; const x = { ...e, ...u, updatedAt: Date.now() }; const m = new Map(s.messageMap); m.set(id, x); return { messages: s.messages.map((i) => (i.id === id ? x : i)), messageMap: m }; }),
  removeMessage: (id) => set((s) => { const m = new Map(s.messageMap); m.delete(id); return { messages: s.messages.filter((i) => i.id !== id), messageMap: m }; }),
  batchUpdateMessages: (updates) => set((s) => { let msgs = [...s.messages]; const map = new Map(s.messageMap); for (const { id, updates: u } of updates) { const e = map.get(id); if (!e) continue; const x = { ...e, ...u, updatedAt: Date.now() }; msgs = msgs.map((i) => (i.id === id ? x : i)); map.set(id, x); } return { messages: msgs, messageMap: map }; }),
  clearMessages: () => set({ messages: [], messageMap: new Map() }),
});
