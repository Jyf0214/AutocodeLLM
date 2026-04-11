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

import { describe, expect, it } from 'vitest';

import { type UserStore } from '@/store/user';

import { initialPreferenceState } from './initialState';
import { preferenceSelectors } from './selectors';

describe('preferenceSelectors', () => {
  let store: UserStore;

  beforeEach(() => {
    store = {
      ...initialPreferenceState,
    } as unknown as UserStore;
  });

  describe('useCmdEnterToSend', () => {
    it('should return the value of useCmdEnterToSend preference', () => {
      store.preference.useCmdEnterToSend = true;
      expect(preferenceSelectors.useCmdEnterToSend(store)).toBe(true);

      store.preference.useCmdEnterToSend = false;
      expect(preferenceSelectors.useCmdEnterToSend(store)).toBe(false);
    });

    it('should return false if useCmdEnterToSend preference is undefined', () => {
      store.preference.useCmdEnterToSend = undefined;
      expect(preferenceSelectors.useCmdEnterToSend(store)).toBe(false);
    });
  });

  describe('hideSyncAlert', () => {
    it('should return the value of hideSyncAlert preference', () => {
      store.preference.hideSyncAlert = true;
      expect(preferenceSelectors.hideSyncAlert(store)).toBe(true);

      store.preference.hideSyncAlert = false;
      expect(preferenceSelectors.hideSyncAlert(store)).toBe(false);

      store.preference.hideSyncAlert = undefined;
      expect(preferenceSelectors.hideSyncAlert(store)).toBeUndefined();
    });
  });

  describe('hideSettingsMoveGuide', () => {
    it('should return the value of moveSettingsToAvatar guide preference', () => {
      store.preference.guide = { moveSettingsToAvatar: true };
      expect(preferenceSelectors.hideSettingsMoveGuide(store)).toBe(true);

      store.preference.guide = { moveSettingsToAvatar: false };
      expect(preferenceSelectors.hideSettingsMoveGuide(store)).toBe(false);
    });

    it('should return undefined if guide preference is undefined', () => {
      store.preference.guide = undefined;
      expect(preferenceSelectors.hideSettingsMoveGuide(store)).toBeUndefined();
    });
  });

  describe('isPreferenceInit', () => {
    it('should return the value of isPreferenceInit state', () => {
      store.isUserStateInit = true;
      expect(preferenceSelectors.isPreferenceInit(store)).toBe(true);

      store.isUserStateInit = false;
      expect(preferenceSelectors.isPreferenceInit(store)).toBe(false);
    });
  });
});
