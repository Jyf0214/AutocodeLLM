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
import { subscribeWithSelector } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';
import { type StateCreator } from 'zustand/vanilla';

import { createDevtools } from '../middleware/createDevtools';
import { expose } from '../middleware/expose';
import { flattenActions } from '../utils/flattenActions';
import { type ChatStoreState } from './initialState';
import { initialState } from './initialState';
import { type ChatAIAgentAction } from './slices/aiAgent/actions';
import { chatAiAgent } from './slices/aiAgent/actions';
import { type ChatAIChatAction } from './slices/aiChat/actions';
import { chatAiChat } from './slices/aiChat/actions';
import { type ChatBuiltinToolAction } from './slices/builtinTool/actions';
import { chatToolSlice } from './slices/builtinTool/actions';
import { type ChatMessageAction } from './slices/message/actions';
import { chatMessage } from './slices/message/actions';
import { type OperationActions } from './slices/operation/actions';
import { OperationActionsImpl } from './slices/operation/actions';
import { type ChatPluginAction } from './slices/plugin/actions';
import { chatPlugin } from './slices/plugin/actions';
import { type ChatPortalAction } from './slices/portal/action';
import { ChatPortalActionImpl } from './slices/portal/action';
import { type ChatThreadAction } from './slices/thread/action';
import { ChatThreadActionImpl } from './slices/thread/action';
import { type ChatTopicAction } from './slices/topic/action';
import { ChatTopicActionImpl } from './slices/topic/action';
import { type ChatTranslateAction } from './slices/translate/action';
import { ChatTranslateActionImpl } from './slices/translate/action';
import { type ChatTTSAction } from './slices/tts/action';
import { ChatTTSActionImpl } from './slices/tts/action';

export type ChatStoreAction = ChatMessageAction &
  ChatThreadAction &
  ChatAIChatAction &
  ChatTopicAction &
  ChatTranslateAction &
  ChatTTSAction &
  ChatPluginAction &
  ChatBuiltinToolAction &
  ChatPortalAction &
  OperationActions &
  ChatAIAgentAction;

export type ChatStore = ChatStoreAction & ChatStoreState;

//  ===============  Aggregate createStoreFn ============ //

const createStore: StateCreator<ChatStore, [['zustand/devtools', never]]> = (
  ...params: Parameters<StateCreator<ChatStore, [['zustand/devtools', never]]>>
) =>
  ({
    ...initialState,
    ...(flattenActions<ChatStoreAction>([
      chatMessage(...params),
      new ChatThreadActionImpl(...params),
      chatAiChat(...params),
      new ChatTopicActionImpl(...params),
      new ChatTranslateActionImpl(...params),
      new ChatTTSActionImpl(...params),
      chatToolSlice(...params),
      chatPlugin(...params),
      new ChatPortalActionImpl(...params),
      new OperationActionsImpl(...params),
      chatAiAgent(...params),
    ]) as ChatStoreAction),
    // cloud
  }) as ChatStore;

//  ===============  Implement useStore ============ //
const devtools = createDevtools('chat');

export const useChatStore = createWithEqualityFn<ChatStore>()(
  subscribeWithSelector(devtools(createStore)),
  shallow,
);

expose('chat', useChatStore);

export const getChatStoreState = () => useChatStore.getState();
