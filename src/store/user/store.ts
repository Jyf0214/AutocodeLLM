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

import { createDevtools } from '../middleware/createDevtools';
import { expose } from '../middleware/expose';
import { flattenActions } from '../utils/flattenActions';
import { type UserState } from './initialState';
import { initialState } from './initialState';
import { type AgentOnboardingAction } from './slices/agentOnboarding/action';
import { createAgentOnboardingSlice } from './slices/agentOnboarding/action';
import { type UserAuthAction } from './slices/auth/action';
import { createAuthSlice } from './slices/auth/action';
import { type CommonAction } from './slices/common/action';
import { createCommonSlice } from './slices/common/action';
import { type OnboardingAction } from './slices/onboarding/action';
import { createOnboardingSlice } from './slices/onboarding/action';
import { type PreferenceAction } from './slices/preference/action';
import { createPreferenceSlice } from './slices/preference/action';
import { type UserSettingsAction } from './slices/settings/action';
import { createSettingsSlice } from './slices/settings/action';

//  ===============  Aggregate createStoreFn ============ //

export type UserStore = UserState &
  UserSettingsAction &
  PreferenceAction &
  UserAuthAction &
  CommonAction &
  AgentOnboardingAction &
  OnboardingAction;

type UserStoreAction = UserSettingsAction &
  PreferenceAction &
  UserAuthAction &
  CommonAction &
  AgentOnboardingAction &
  OnboardingAction;

const createStore: StateCreator<UserStore, [['zustand/devtools', never]]> = (
  ...parameters: Parameters<StateCreator<UserStore, [['zustand/devtools', never]]>>
) => ({
  ...initialState,
  ...flattenActions<UserStoreAction>([
    createSettingsSlice(...parameters),
    createPreferenceSlice(...parameters),
    createAuthSlice(...parameters),
    createCommonSlice(...parameters),
    createAgentOnboardingSlice(...parameters),
    createOnboardingSlice(...parameters),
  ]),
});

//  ===============  Implement useStore ============ //

const devtools = createDevtools('user');

export const useUserStore = createWithEqualityFn<UserStore>()(
  subscribeWithSelector(devtools(createStore)),
  shallow,
);

expose('user', useUserStore);

export const getUserStoreState = () => useUserStore.getState();
