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

import isEqual from 'fast-deep-equal';
import { type PartialDeep } from 'type-fest';

import { MESSAGE_CANCEL_FLAT } from '@/const/message';
import { shareService } from '@/services/share';
import { userService } from '@/services/user';
import { type StoreSetter } from '@/store/types';
import { type UserStore } from '@/store/user';
import { type LobeAgentSettings } from '@/types/session';
import {
  type SystemAgentItem,
  type UserGeneralConfig,
  type UserKeyVaults,
  type UserSettings,
  type UserSystemAgentConfigKey,
} from '@/types/user/settings';
import { difference } from '@/utils/difference';
import { merge } from '@/utils/merge';

type Setter = StoreSetter<UserStore>;
export const createSettingsSlice = (set: Setter, get: () => UserStore, _api?: unknown) =>
  new UserSettingsActionImpl(set, get, _api);

export class UserSettingsActionImpl {
  readonly #get: () => UserStore;
  readonly #set: Setter;

  constructor(set: Setter, get: () => UserStore, _api?: unknown) {
    void _api;
    this.#set = set;
    this.#get = get;
  }

  addToolToAllowList = async (toolKey: string): Promise<void> => {
    const currentAllowList = this.#get().settings.tool?.humanIntervention?.allowList || [];

    if (currentAllowList.includes(toolKey)) return;

    await this.#get().setSettings({
      tool: {
        humanIntervention: {
          allowList: [...currentAllowList, toolKey],
        },
      },
    });
  };

  importAppSettings = async (importAppSettings: UserSettings): Promise<void> => {
    const { setSettings } = this.#get();

    await setSettings(importAppSettings);
  };

  importUrlShareSettings = async (settingsParams: string | null): Promise<void> => {
    if (settingsParams) {
      const importSettings = shareService.decodeShareSettings(settingsParams);
      if (importSettings?.message || !importSettings?.data) {
        // handle some error
        return;
      }

      await this.#get().setSettings(importSettings.data);
    }
  };

  internal_createSignal = (): AbortController => {
    const abortController = this.#get().updateSettingsSignal;
    if (abortController && !abortController.signal.aborted)
      abortController.abort(MESSAGE_CANCEL_FLAT);

    const newSignal = new AbortController();

    this.#set({ updateSettingsSignal: newSignal }, false, 'signalForUpdateSettings');

    return newSignal;
  };

  resetSettings = async (): Promise<void> => {
    await userService.resetUserSettings();
    await this.#get().refreshUserState();
  };

  setSettings = async (settings: PartialDeep<UserSettings>): Promise<void> => {
    const { settings: prevSetting, defaultSettings } = this.#get();

    const nextSettings = merge(prevSetting, settings);

    if (isEqual(prevSetting, nextSettings)) return;

    const diffs = difference(nextSettings, defaultSettings);
    const isEmptyObjectDiff = (value: unknown): boolean =>
      !!value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value as object).length === 0;

    // When user resets a field to default value, we need to explicitly include it in diffs
    // to override the previously saved non-default value in the backend
    const changedFields = difference(nextSettings, prevSetting);
    for (const key of Object.keys(changedFields)) {
      // Only handle fields that were previously set by user (exist in prevSetting)
      const keyDiff = (diffs as any)[key];
      if (key in prevSetting && (!(key in diffs) || isEmptyObjectDiff(keyDiff))) {
        (diffs as any)[key] = (changedFields as any)[key];
      }
    }

    this.#set({ settings: diffs }, false, 'optimistic_updateSettings');

    const abortController = this.#get().internal_createSignal();
    await userService.updateUserSettings(diffs, abortController.signal);
    await this.#get().refreshUserState();
  };

  updateDefaultAgent = async (defaultAgent: PartialDeep<LobeAgentSettings>): Promise<void> => {
    await this.#get().setSettings({ defaultAgent });
  };

  updateGeneralConfig = async (general: Partial<UserGeneralConfig>): Promise<void> => {
    await this.#get().setSettings({ general });
  };

  updateHumanIntervention = async (config: {
    allowList?: string[];
    approvalMode?: 'auto-run' | 'allow-list' | 'manual';
  }): Promise<void> => {
    const current = this.#get().settings.tool?.humanIntervention || {};
    await this.#get().setSettings({
      tool: {
        humanIntervention: { ...current, ...config },
      },
    });
  };

  updateKeyVaults = async (keyVaults: Partial<UserKeyVaults>): Promise<void> => {
    await this.#get().setSettings({ keyVaults });
  };

  updateSystemAgent = async (
    key: UserSystemAgentConfigKey,
    value: Partial<SystemAgentItem>,
  ): Promise<void> => {
    await this.#get().setSettings({
      systemAgent: { [key]: { ...value } },
    });
  };
}

export type UserSettingsAction = Pick<UserSettingsActionImpl, keyof UserSettingsActionImpl>;
