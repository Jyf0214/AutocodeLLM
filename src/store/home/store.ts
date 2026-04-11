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

import { subscribeWithSelector } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';
import { type StateCreator } from 'zustand/vanilla';

import { isDev } from '@/utils/env';

import { createDevtools } from '../middleware/createDevtools';
import { expose } from '../middleware/expose';
import { flattenActions } from '../utils/flattenActions';
import { type ResetableStore, ResetableStoreAction } from '../utils/resetableStore';
import { type HomeStoreState } from './initialState';
import { initialState } from './initialState';
import { type AgentListAction } from './slices/agentList/action';
import { createAgentListSlice } from './slices/agentList/action';
import { type GroupAction } from './slices/group/action';
import { createGroupSlice } from './slices/group/action';
import { type HomeInputAction } from './slices/homeInput/action';
import { createHomeInputSlice } from './slices/homeInput/action';
import { type RecentAction } from './slices/recent/action';
import { createRecentSlice } from './slices/recent/action';
import { type SidebarUIAction } from './slices/sidebarUI/action';
import { createSidebarUISlice } from './slices/sidebarUI/action';

//  ===============  Aggregate createStoreFn ============ //

export interface HomeStore
  extends
    AgentListAction,
    GroupAction,
    RecentAction,
    HomeInputAction,
    SidebarUIAction,
    ResetableStore,
    HomeStoreState {}

type HomeStoreAction = AgentListAction &
  GroupAction &
  RecentAction &
  HomeInputAction &
  SidebarUIAction &
  ResetableStore;

class HomeStoreResetAction extends ResetableStoreAction<HomeStore> {
  protected readonly resetActionName = 'resetHomeStore';
}

const createStore: StateCreator<HomeStore, [['zustand/devtools', never]]> = (
  ...parameters: Parameters<StateCreator<HomeStore, [['zustand/devtools', never]]>>
) => ({
  ...initialState,
  ...flattenActions<HomeStoreAction>([
    createAgentListSlice(...parameters),
    createGroupSlice(...parameters),
    createRecentSlice(...parameters),
    createHomeInputSlice(...parameters),
    createSidebarUISlice(...parameters),
    new HomeStoreResetAction(...parameters),
  ]),
});

//  ===============  Implement useStore ============ //
const devtools = createDevtools('home');

export const useHomeStore = createWithEqualityFn<HomeStore>()(
  subscribeWithSelector(
    devtools(createStore, {
      name: 'LobeChat_Home' + (isDev ? '_DEV' : ''),
    }),
  ),
  shallow,
);

expose('home', useHomeStore);

export const getHomeStoreState = () => useHomeStore.getState();
