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

import { userService } from '@/services/user';
import type { StoreSetter } from '@/store/types';
import type { UserStore } from '@/store/user';
import type { UserAgentOnboarding } from '@/types/user';

type Setter = StoreSetter<UserStore>;

export const createAgentOnboardingSlice = (set: Setter, get: () => UserStore, _api?: unknown) =>
  new AgentOnboardingActionImpl(set, get, _api);

export class AgentOnboardingActionImpl {
  readonly #get: () => UserStore;
  readonly #set: Setter;

  constructor(set: Setter, get: () => UserStore, _api?: unknown) {
    void _api;
    this.#set = set;
    this.#get = get;
  }

  resetAgentOnboarding = async (): Promise<void> => {
    const agentOnboarding = await userService.resetAgentOnboarding();

    this.#set({ agentOnboarding }, false, 'resetAgentOnboarding');
    await this.#get().refreshUserState();
  };

  updateAgentOnboarding = async (agentOnboarding: UserAgentOnboarding): Promise<void> => {
    await userService.updateAgentOnboarding(agentOnboarding);
    await this.#get().refreshUserState();
  };
}

export type AgentOnboardingAction = Pick<
  AgentOnboardingActionImpl,
  keyof AgentOnboardingActionImpl
>;
