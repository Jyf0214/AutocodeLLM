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

import { type StateCreator } from 'zustand/vanilla';

import { type ChatStore } from '@/store/chat/store';
import { flattenActions } from '@/store/utils/flattenActions';

import { type MessageInternalsAction } from './internals';
import { MessageInternalsActionImpl } from './internals';
import { type MessageOptimisticUpdateAction } from './optimisticUpdate';
import { MessageOptimisticUpdateActionImpl } from './optimisticUpdate';
import { type MessagePublicApiAction } from './publicApi';
import { MessagePublicApiActionImpl } from './publicApi';
import { type MessageQueryAction } from './query';
import { MessageQueryActionImpl } from './query';
import { type MessageRuntimeStateAction } from './runtimeState';
import { MessageRuntimeStateActionImpl } from './runtimeState';

export type ChatMessageAction = MessagePublicApiAction &
  MessageOptimisticUpdateAction &
  MessageQueryAction &
  MessageRuntimeStateAction &
  MessageInternalsAction;

/**
 * Combined message action interface
 * Aggregates all message-related actions
 */

export const chatMessage: StateCreator<
  ChatStore,
  [['zustand/devtools', never]],
  [],
  ChatMessageAction
> = (
  ...params: Parameters<
    StateCreator<ChatStore, [['zustand/devtools', never]], [], ChatMessageAction>
  >
) =>
  flattenActions<ChatMessageAction>([
    new MessagePublicApiActionImpl(...params),
    new MessageOptimisticUpdateActionImpl(...params),
    new MessageQueryActionImpl(...params),
    new MessageRuntimeStateActionImpl(...params),
    new MessageInternalsActionImpl(...params),
  ]);
