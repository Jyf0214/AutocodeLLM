/**
 * 本文件是 AutocodeLLM 项目的原始实现
 *
 * AutocodeLLM 项目许可证：
 * Apache License, Version 2.0
 * Copyright (c) 2026 Jyf0214
 */

import type { StateCreator } from 'zustand/vanilla';
import type { ChatStoreState, ErrorDialogState } from '../../types';

export interface UISlice {
  toggleAgentPanel: (s?: boolean) => void;
  setScrollToBottom: (v: boolean) => void;
  setLoadingMessages: (v: boolean) => void;
  showErrorDialog: (s: ErrorDialogState) => void;
  hideErrorDialog: () => void;
}

export const createUISlice: StateCreator<ChatStoreState, [], [], UISlice> = (set) => ({
  ui: { showAgentPanel: false, scrollToBottom: true, loadingMessages: false, errorDialog: null },
  toggleAgentPanel: (s) => set((st) => ({ ui: { ...st.ui, showAgentPanel: s !== undefined ? s : !st.ui.showAgentPanel } })),
  setScrollToBottom: (v) => set((s) => ({ ui: { ...s.ui, scrollToBottom: v } })),
  setLoadingMessages: (v) => set((s) => ({ ui: { ...s.ui, loadingMessages: v } })),
  showErrorDialog: (d) => set((s) => ({ ui: { ...s.ui, errorDialog: d } })),
  hideErrorDialog: () => set((s) => ({ ui: { ...s.ui, errorDialog: null } })),
});
