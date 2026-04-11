/**
 * 本代码来源于 LobeChat 项目（https://github.com/lobehub/lobe-chat）
 *
 * LobeChat 许可证信息：
 * LobeHub Community License（基于 Apache License 2.0）
 * Copyright (c) 2024-2026 LobeHub LLC. All rights reserved.
 * 详细信息：http://www.apache.org/licenses/LICENSE-2.0
 *
 * 修改声明：
 * 本文件已从 LobeChat 源代码进行修改以适配 AutocodeLLM 项目。
 * 修改内容包括：目录结构调整、依赖适配、API 接口兼容等。
 *
 * AutocodeLLM 项目许可证：
 * Apache License, Version 2.0
 * Copyright (c) 2026 Jyf0214
 *
 * 双重许可：本文件同时受上述两个许可证约束。
 * 商业使用需分别获得对应授权。
 */

import { type ChatStoreState } from '@/store/chat';

import { type PortalViewData } from '../initialState';
import { PortalViewType } from '../initialState';

// Helper to get current view
const getCurrentView = (s: ChatStoreState): PortalViewData | null => {
  const { portalStack } = s;
  return portalStack.at(-1) ?? null;
};

// Check if current view is Thread
const showThread = (s: ChatStoreState) => {
  const view = getCurrentView(s);
  if (view?.type === PortalViewType.Thread) {
    return true;
  }
  // Also check legacy threadStartMessageId for backward compatibility during transition
  return !!s.threadStartMessageId;
};

const newThreadMode = (s: ChatStoreState) => s.newThreadMode;

// Get current thread data from stack
const currentThreadView = (s: ChatStoreState) => {
  const view = getCurrentView(s);
  if (view?.type === PortalViewType.Thread) {
    return view;
  }
  return null;
};

// Get thread ID - from stack or legacy field
const portalThreadId = (s: ChatStoreState): string | undefined => {
  const threadView = currentThreadView(s);
  return threadView?.threadId ?? s.portalThreadId;
};

// Get start message ID - from stack or legacy field
const threadStartMessageId = (s: ChatStoreState): string | undefined => {
  const threadView = currentThreadView(s);
  return threadView?.startMessageId ?? s.threadStartMessageId ?? undefined;
};

const portalCurrentThread = (s: ChatStoreState) => {
  const threadId = portalThreadId(s);
  if (!threadId || !s.activeTopicId) return;

  return (s.threadMaps[s.activeTopicId] || []).find((t) => t.id === threadId);
};

export const portalThreadSelectors = {
  currentThreadView,
  newThreadMode,
  portalCurrentThread,
  portalThreadId,
  showThread,
  threadStartMessageId,
};
