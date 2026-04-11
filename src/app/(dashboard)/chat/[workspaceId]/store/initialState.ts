/**
 * 本文件是 AutocodeLLM 项目的原始实现
 *
 * AutocodeLLM 项目许可证：
 * Apache License, Version 2.0
 * Copyright (c) 2026 Jyf0214
 */

import type { ChatStoreState } from './types';

/**
 * 初始状态
 */
export const initialState: ChatStoreState = {
  // 聊天核心
  workspaceId: '',
  workspace: null,
  messages: [],
  messageMap: new Map(),
  isLoading: false,
  error: null,
  
  // Agent
  agents: {
    activeAgents: [],
    status: 'idle',
  },
  
  // 模型
  models: {
    selected: null,
    available: [],
    loading: false,
  },
  
  // 输入
  input: {
    value: '',
    isSending: false,
    attachments: [],
  },
  
  // UI
  ui: {
    showAgentPanel: false,
    scrollToBottom: true,
    loadingMessages: false,
    errorDialog: null,
  },
};
