/**
 * 本文件是 AutocodeLLM 项目的原始实现
 *
 * AutocodeLLM 项目许可证：
 * Apache License, Version 2.0
 * Copyright (c) 2026 Jyf0214
 */

import type { StateCreator } from 'zustand';
import type { ChatStoreState, FileAttachment, InputState } from '../types';

export interface InputSlice {
  setInputValue: (value: string) => void;
  clearInput: () => void;
  setSending: (isSending: boolean) => void;
  addAttachment: (file: FileAttachment) => void;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;
}

export const createInputSlice: StateCreator<ChatStoreState, [], [], InputSlice> = (set) => ({
  input: { value: '', isSending: false, attachments: [] },

  setInputValue: (value: string) => set((state) => ({ input: { ...state.input, value } })),
  clearInput: () => set((state) => ({ input: { ...state.input, value: '' } })),
  setSending: (isSending: boolean) => set((state) => ({ input: { ...state.input, isSending } })),
  addAttachment: (file: FileAttachment) => set((state) => ({ input: { ...state.input, attachments: [...state.input.attachments, file] } })),
  removeAttachment: (id: string) => set((state) => ({ input: { ...state.input, attachments: state.input.attachments.filter((f) => f.id !== id) } })),
  clearAttachments: () => set((state) => ({ input: { ...state.input, attachments: [] } })),
});
