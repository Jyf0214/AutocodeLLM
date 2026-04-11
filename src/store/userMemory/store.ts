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

import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';
import { type StateCreator } from 'zustand/vanilla';

import { createDevtools } from '../middleware/createDevtools';
import { expose } from '../middleware/expose';
import { flattenActions } from '../utils/flattenActions';
import { type ResetableStore, ResetableStoreAction } from '../utils/resetableStore';
import { type UserMemoryStoreState } from './initialState';
import { initialState } from './initialState';
import { type ActivityAction } from './slices/activity';
import { createActivitySlice } from './slices/activity';
import { type AgentMemoryAction } from './slices/agent';
import { createAgentMemorySlice } from './slices/agent';
import { type BaseAction } from './slices/base';
import { createBaseSlice } from './slices/base';
import { type ContextAction } from './slices/context';
import { createContextSlice } from './slices/context';
import { type ExperienceAction } from './slices/experience';
import { createExperienceSlice } from './slices/experience';
import { type HomeAction } from './slices/home';
import { createHomeSlice } from './slices/home';
import { type IdentityAction } from './slices/identity';
import { createIdentitySlice } from './slices/identity';
import { type PreferenceAction } from './slices/preference';
import { createPreferenceSlice } from './slices/preference';

export type UserMemoryStore = UserMemoryStoreState &
  ActivityAction &
  AgentMemoryAction &
  BaseAction &
  ContextAction &
  ExperienceAction &
  HomeAction &
  IdentityAction &
  PreferenceAction &
  ResetableStore;

type UserMemoryStoreAction = ActivityAction &
  AgentMemoryAction &
  BaseAction &
  ContextAction &
  ExperienceAction &
  HomeAction &
  IdentityAction &
  PreferenceAction &
  ResetableStore;

class UserMemoryStoreResetAction extends ResetableStoreAction<UserMemoryStore> {
  protected readonly resetActionName = 'resetUserMemoryStore';
}

const createStore: StateCreator<UserMemoryStore, [['zustand/devtools', never]]> = (
  set: any,
  get: any,
  store: any,
) => ({
  ...initialState,
  ...flattenActions<UserMemoryStoreAction>([
    createActivitySlice(set, get, store),
    createAgentMemorySlice(set, get, store),
    createBaseSlice(set, get, store),
    createContextSlice(set, get, store),
    createExperienceSlice(set, get, store),
    createHomeSlice(set, get, store),
    createIdentitySlice(set, get, store),
    createPreferenceSlice(set, get, store),
    new UserMemoryStoreResetAction(set, get, store),
  ]),
});

const devtools = createDevtools('userMemory');

export const useUserMemoryStore = createWithEqualityFn<UserMemoryStore>()(
  devtools(createStore),
  shallow,
);

expose('userMemory', useUserMemoryStore);

export const getUserMemoryStoreState = () => useUserMemoryStore.getState();
