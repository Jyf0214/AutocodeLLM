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

import { CURRENT_ONBOARDING_VERSION } from '@lobechat/const';
import { MAX_ONBOARDING_STEPS } from '@lobechat/types';

import { type UserStore } from '../../store';
import { agentOnboardingSelectors } from '../agentOnboarding/selectors';

/**
 * Returns the current step for UI display.
 * Prioritizes local optimistic state over server state for immediate feedback.
 * Clamps the value to valid range [1, MAX_ONBOARDING_STEPS].
 */
const currentStep = (s: UserStore) => {
  const step = s.localOnboardingStep ?? s.onboarding?.currentStep ?? 1;
  return Math.max(1, Math.min(step, MAX_ONBOARDING_STEPS));
};

const version = (s: UserStore) => s.onboarding?.version ?? CURRENT_ONBOARDING_VERSION;

const finishedAt = (s: UserStore) => s.onboarding?.finishedAt;

const isFinished = (s: UserStore) => !!s.onboarding?.finishedAt;

/**
 * Check if user needs to go through onboarding.
 */
const needsOnboarding = (s: Pick<UserStore, 'agentOnboarding' | 'onboarding'>) => {
  if (agentOnboardingSelectors.isFinished(s)) return false;

  return (
    !s.onboarding?.finishedAt ||
    (s.onboarding?.version && s.onboarding.version < CURRENT_ONBOARDING_VERSION)
  );
};

export const onboardingSelectors = {
  currentStep,
  finishedAt,
  isFinished,
  needsOnboarding,
  version,
};
