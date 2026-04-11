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

import { type AgentOnboardingState } from './slices/agentOnboarding/initialState';
import { initialAgentOnboardingState } from './slices/agentOnboarding/initialState';
import { type UserAuthState } from './slices/auth/initialState';
import { initialAuthState } from './slices/auth/initialState';
import { type CommonState } from './slices/common/initialState';
import { initialCommonState } from './slices/common/initialState';
import { type OnboardingState } from './slices/onboarding/initialState';
import { initialOnboardingState } from './slices/onboarding/initialState';
import { type UserPreferenceState } from './slices/preference/initialState';
import { initialPreferenceState } from './slices/preference/initialState';
import { type UserSettingsState } from './slices/settings/initialState';
import { initialSettingsState } from './slices/settings/initialState';

export type UserState = UserSettingsState &
  UserPreferenceState &
  UserAuthState &
  CommonState &
  AgentOnboardingState &
  OnboardingState;

export const initialState: UserState = {
  ...initialSettingsState,
  ...initialPreferenceState,
  ...initialAuthState,
  ...initialCommonState,
  ...initialAgentOnboardingState,
  ...initialOnboardingState,
};
