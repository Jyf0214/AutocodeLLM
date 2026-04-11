/**
 * 本文件是 AutocodeLLM 项目的原始实现
 *
 * AutocodeLLM 项目许可证：
 * Apache License, Version 2.0
 * Copyright (c) 2026 Jyf0214
 */

import type { StateCreator } from 'zustand/vanilla';
import type { ChatStoreState, FileAttachment } from '../../types';

export interface InputSlice {
  setInputValue: (v: string) => void;
  clearInput: () => void;
  setSending: (v: boolean) => void;
  addAttachment: (f: FileAttachment) => void;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;
}

export const createInputSlice: StateCreator<ChatStoreState, [], [], InputSlice> = (set) => ({
  input: { value: '', isSending: false, attachments: [] },
  setInputValue: (v) => set((s) => ({ input: { ...s.input, value: v } })),
  clearInput: () => set((s) => ({ input: { ...s.input, value: '' } })),
  setSending: (v) => set((s) => ({ input: { ...s.input, isSending: v } })),
  addAttachment: (f) => set((s) => ({ input: { ...s.input, attachments: [...s.input.attachments, f] } })),
  removeAttachment: (id) => set((s) => ({ input: { ...s.input, attachments: s.input.attachments.filter((x) => x.id !== id) } })),
  clearAttachments: () => set((s) => ({ input: { ...s.input, attachments: [] } })),
});
