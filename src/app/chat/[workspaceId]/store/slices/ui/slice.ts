/**
 * 本文件是 AutocodeLLM 项目的原始实现
 *
 * AutocodeLLM 项目许可证：
 * Apache License, Version 2.0
 * Copyright (c) 2026 Jyf0214
 */

import type { StateCreator } from 'zustand';
import type { ChatStoreState, ErrorDialogState } from '../../types';

export interface UISlice {
  toggleAgentPanel: (show?: boolean) => void;
  setScrollToBottom: (scroll: boolean) => void;
  setLoadingMessages: (loading: boolean) => void;
  showErrorDialog: (state: ErrorDialogState) => void;
  hideErrorDialog: () => void;
}

type C = StateCreator<ChatStoreState, [['zustand/devtools', never]], [], UISlice>;

export const createUISlice: C = (set) => ({
  ui: { showAgentPanel: false, scrollToBottom: true, loadingMessages: false, errorDialog: null },
  toggleAgentPanel: (show?: boolean) => set((s) => ({ ui: { ...s.ui, showAgentPanel: show !== undefined ? show : !s.ui.showAgentPanel } })),
  setScrollToBottom: (scroll: boolean) => set((s) => ({ ui: { ...s.ui, scrollToBottom: scroll } })),
  setLoadingMessages: (loading: boolean) => set((s) => ({ ui: { ...s.ui, loadingMessages: loading } })),
  showErrorDialog: (dialogState: ErrorDialogState) => set((s) => ({ ui: { ...s.ui, errorDialog: dialogState } })),
  hideErrorDialog: () => set((s) => ({ ui: { ...s.ui, errorDialog: null } })),
});
