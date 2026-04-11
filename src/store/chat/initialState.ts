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

// sort-imports-ignore
import { type ChatAIAgentState } from './slices/aiAgent/initialState';
import { initialAiAgentState } from './slices/aiAgent/initialState';
import { type ChatAIChatState } from './slices/aiChat/initialState';
import { initialAiChatState } from './slices/aiChat/initialState';
import { type ChatToolState } from './slices/builtinTool/initialState';
import { initialToolState } from './slices/builtinTool/initialState';
import { type ChatMessageState } from './slices/message/initialState';
import { initialMessageState } from './slices/message/initialState';
import { type ChatOperationState } from './slices/operation/initialState';
import { initialOperationState } from './slices/operation/initialState';
import { type ChatPortalState } from './slices/portal/initialState';
import { initialChatPortalState } from './slices/portal/initialState';
import { type ChatThreadState } from './slices/thread/initialState';
import { initialThreadState } from './slices/thread/initialState';
import { type ChatTopicState } from './slices/topic/initialState';
import { initialTopicState } from './slices/topic/initialState';

export type ChatStoreState = ChatTopicState &
  ChatMessageState &
  ChatAIChatState &
  ChatToolState &
  ChatThreadState &
  ChatPortalState &
  ChatAIAgentState &
  ChatOperationState;

export const initialState: ChatStoreState = {
  ...initialMessageState,
  ...initialAiChatState,
  ...initialTopicState,
  ...initialToolState,
  ...initialThreadState,
  ...initialChatPortalState,
  ...initialOperationState,
  ...initialAiAgentState,

  // cloud
};
