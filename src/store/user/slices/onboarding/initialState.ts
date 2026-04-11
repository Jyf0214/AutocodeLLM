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

import { type UserOnboarding } from '@/types/user';

export interface OnboardingState {
  /**
   * Whether the step update queue is currently being processed.
   */
  isProcessingStepQueue: boolean;
  /**
   * Local step for optimistic UI updates.
   * When set, takes precedence over server state for immediate UI feedback.
   */
  localOnboardingStep?: number;
  onboarding?: UserOnboarding;
  /**
   * Queue for managing server updates with max length 2.
   * - Position 0: Currently executing task
   * - Position 1: Pending task (replaced if new task arrives while queue is full)
   */
  stepUpdateQueue: number[];
}

export const initialOnboardingState: OnboardingState = {
  isProcessingStepQueue: false,
  localOnboardingStep: undefined,
  onboarding: undefined,
  stepUpdateQueue: [],
};
