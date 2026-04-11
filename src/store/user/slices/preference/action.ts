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
import { type StoreSetter } from '@/store/types';
import { type UserStore } from '@/store/user';
import { type UserGuide, type UserLab, type UserPreference } from '@/types/user';
import { merge } from '@/utils/merge';
import { setNamespace } from '@/utils/storeDebug';

const n = setNamespace('preference');

type Setter = StoreSetter<UserStore>;
export const createPreferenceSlice = (set: Setter, get: () => UserStore, _api?: unknown) =>
  new PreferenceActionImpl(set, get, _api);

export class PreferenceActionImpl {
  readonly #get: () => UserStore;
  readonly #set: Setter;

  constructor(set: Setter, get: () => UserStore, _api?: unknown) {
    void _api;
    this.#set = set;
    this.#get = get;
  }

  updateGuideState = async (guide: Partial<UserGuide>, action?: any): Promise<void> => {
    const { updatePreference } = this.#get();
    const nextGuide = merge(this.#get().preference.guide, guide);
    await updatePreference({ guide: nextGuide }, action);
  };

  updateLab = async (lab: Partial<UserLab>, action?: any): Promise<void> => {
    const { updatePreference } = this.#get();
    const nextLab = merge(this.#get().preference.lab, lab);
    await updatePreference({ lab: nextLab }, action || n('updateLab'));
  };

  updatePreference = async (preference: Partial<UserPreference>, action?: any): Promise<void> => {
    const nextPreference = merge(this.#get().preference, preference);

    this.#set({ preference: nextPreference }, false, action || n('updatePreference'));

    await userService.updatePreference(nextPreference);
  };
}

export type PreferenceAction = Pick<PreferenceActionImpl, keyof PreferenceActionImpl>;
