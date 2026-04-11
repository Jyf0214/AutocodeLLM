/**
 * 本文件是 AutocodeLLM 项目的原始实现
 *
 * AutocodeLLM 项目许可证：
 * Apache License, Version 2.0
 * Copyright (c) 2026 Jyf0214
 */

import type { StateCreator } from 'zustand';
import type { ChatStoreState, FileAttachment } from '../../types';

export interface InputSlice {
  setInputValue: (value: string) => void;
  clearInput: () => void;
  setSending: (isSending: boolean) => void;
  addAttachment: (file: FileAttachment) => void;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;
}

type C = StateCreator<ChatStoreState, [['zustand/devtools', never]], [], InputSlice>;

export const createInputSlice: C = (set) => ({
  input: { value: '', isSending: false, attachments: [] },
  setInputValue: (value: string) => set((s) => ({ input: { ...s.input, value } })),
  clearInput: () => set((s) => ({ input: { ...s.input, value: '' } })),
  setSending: (isSending: boolean) => set((s) => ({ input: { ...s.input, isSending } })),
  addAttachment: (file: FileAttachment) => set((s) => ({ input: { ...s.input, attachments: [...s.input.attachments, file] } })),
  removeAttachment: (id: string) => set((s) => ({ input: { ...s.input, attachments: s.input.attachments.filter((f) => f.id !== id) } })),
  clearAttachments: () => set((s) => ({ input: { ...s.input, attachments: [] } })),
});
