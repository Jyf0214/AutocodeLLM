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

import { type ConversationContext, type ConversationHooks } from '../types';
import { type State } from './initialState';
import { initialState } from './initialState';
import { type DataAction } from './slices/data/action';
import { dataSlice } from './slices/data/action';
import { type GenerationAction } from './slices/generation/action';
import { generationSlice } from './slices/generation/action';
import { type InputAction } from './slices/input/action';
import { inputSlice } from './slices/input/action';
import { type MessageAction } from './slices/message/action';
import { messageSlice } from './slices/message/action';
import { type MessageEditingAction } from './slices/messageState/action';
import { messageEditingSlice } from './slices/messageState/action';
import { type ToolAction } from './slices/tool/action';
import { toolSlice } from './slices/tool/action';
import { type VirtuaListAction } from './slices/virtuaList/action';
import { virtuaListSlice } from './slices/virtuaList/action';

// ===== Combined Store Type =====

export type Store = State &
  DataAction &
  GenerationAction &
  InputAction &
  MessageAction &
  MessageEditingAction &
  ToolAction &
  VirtuaListAction;

// Alias for backward compatibility
export type ConversationStore = Store;

// ===== Store Creator =====

export interface CreateStoreParams {
  context: ConversationContext;
  hooks?: ConversationHooks;
  skipFetch?: boolean;
}

type CreateStore = (
  params: CreateStoreParams,
) => StateCreator<Store, [['zustand/devtools', never]]>;

export const createStoreAction: CreateStore =
  ({ context, hooks = {}, skipFetch }) =>
  (...params) => ({
    ...initialState,
    context,
    hooks,
    skipFetch,
    // ===== Slices =====
    ...dataSlice(...params),
    ...generationSlice(...params),
    ...inputSlice(...params),
    ...messageSlice(...params),
    ...messageEditingSlice(...params),
    ...toolSlice(...params),
    ...virtuaListSlice(...params),
  });
