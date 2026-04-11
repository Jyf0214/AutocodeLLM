/**
 * 本文件是 AutocodeLLM 项目的原始实现
 *
 * AutocodeLLM 项目许可证：
 * Apache License, Version 2.0
 * Copyright (c) 2026 Jyf0214
 */

import type { StateCreator } from 'zustand';
import type { ChatStoreState, ErrorDialogState } from '../types';

/**
 * UI Slice - UI状态管理
 */
export interface UISlice {
  // Actions
  toggleAgentPanel: (show?: boolean) => void;
  setScrollToBottom: (scroll: boolean) => void;
  setLoadingMessages: (loading: boolean) => void;
  showErrorDialog: (state: ErrorDialogState) => void;
  hideErrorDialog: () => void;
}

/**
 * 创建UI Slice
 */
export const createUISlice: StateCreator<
  ChatStoreState,
  [['zustand/devtools', never]],
  [],
  UISlice
> = (set) => ({
  // 初始状态
  ui: {
    showAgentPanel: false,
    scrollToBottom: true,
    loadingMessages: false,
    errorDialog: null,
  },

  // Actions
  toggleAgentPanel: (show?: boolean) => {
    set((state) => ({
      ui: {
        ...state.ui,
        showAgentPanel: show !== undefined ? show : !state.ui.showAgentPanel,
      },
    }));
  },

  setScrollToBottom: (scroll: boolean) => {
    set((state) => ({
      ui: {
        ...state.ui,
        scrollToBottom: scroll,
      },
    }));
  },

  setLoadingMessages: (loading: boolean) => {
    set((state) => ({
      ui: {
        ...state.ui,
        loadingMessages: loading,
      },
    }));
  },

  showErrorDialog: (dialogState: ErrorDialogState) => {
    set((state) => ({
      ui: {
        ...state.ui,
        errorDialog: dialogState,
      },
    }));
  },

  hideErrorDialog: () => {
    set((state) => ({
      ui: {
        ...state.ui,
        errorDialog: null,
      },
    }));
  },
});
