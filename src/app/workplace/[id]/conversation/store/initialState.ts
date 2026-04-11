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

import { type UIChatMessage } from '@lobechat/types';

import {
  type ActionsBarConfig,
  type ConversationContext,
  type ConversationHooks,
  type OperationState,
} from '../types';
import { DEFAULT_OPERATION_STATE } from '../types/operation';
import { type DataState } from './slices/data/initialState';
import { dataInitialState } from './slices/data/initialState';
import { type InputState } from './slices/input/initialState';
import { inputInitialState } from './slices/input/initialState';
import { type MessageStateState } from './slices/messageState/initialState';
import { messageStateInitialState } from './slices/messageState/initialState';
import { type VirtuaListState } from './slices/virtuaList/initialState';
import { virtuaListInitialState } from './slices/virtuaList/initialState';

export interface State extends DataState, InputState, MessageStateState, VirtuaListState {
  /**
   * Actions bar configuration by message type
   */
  actionsBar?: ActionsBarConfig;

  /**
   * Conversation context (data coordinates)
   */
  context: ConversationContext;

  /**
   * Lifecycle hooks for external behavior injection
   */
  hooks: ConversationHooks;

  /**
   * Callback when messages are fetched or changed internally
   * @param messages - The updated messages array
   * @param context - The context that this data belongs to (prevents race conditions)
   */
  onMessagesChange?: (messages: UIChatMessage[], context: ConversationContext) => void;

  /**
   * External operation state (from ChatStore)
   * Used for reactive updates of operation-related UI
   */
  operationState: OperationState;
}

export const initialState: State = {
  ...dataInitialState,
  ...inputInitialState,
  ...messageStateInitialState,
  ...virtuaListInitialState,

  actionsBar: undefined,
  context: {
    agentId: '',
    threadId: null,
    topicId: null,
  },
  hooks: {},
  onMessagesChange: undefined,
  operationState: DEFAULT_OPERATION_STATE,
};
