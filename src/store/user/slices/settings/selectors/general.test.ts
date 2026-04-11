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

import { type UserStore } from '@/store/user';
import { type UserState } from '@/store/user/initialState';
import { initialState } from '@/store/user/initialState';
import { merge } from '@/utils/merge';

import { userGeneralSettingsSelectors } from './general';

describe('settingsSelectors', () => {
  describe('generalConfig', () => {
    it('should return general settings', () => {
      const s: UserState = merge(initialState, {
        settings: {
          general: { fontSize: 12 },
        },
      });

      const result = userGeneralSettingsSelectors.config(s as UserStore);

      expect(result).toEqual({
        animationMode: 'agile',
        fontSize: 12,
        highlighterTheme: 'lobe-theme',
        isDevMode: false,
        isLiteMode: false,
        mermaidTheme: 'lobe-theme',
        telemetry: true,
        transitionMode: 'fadeIn',
      });
    });
  });

  describe('fontSize', () => {
    it('should return the fontSize', () => {
      const s: UserState = merge(initialState, {
        settings: {
          general: { fontSize: 12 },
        },
      });

      const result = userGeneralSettingsSelectors.fontSize(s as UserStore);

      expect(result).toBe(12);
    });
  });

  describe('currentResponseLanguage', () => {
    it('should prefer the saved response language', () => {
      const s: UserState = merge(initialState, {
        settings: {
          general: { responseLanguage: 'zh-CN' },
        },
      });

      const result = userGeneralSettingsSelectors.currentResponseLanguage(s as UserStore);

      expect(result).toBe('zh-CN');
    });

    it('should fallback to the normalized browser language', () => {
      const originalLanguage = navigator.language;
      Object.defineProperty(window.navigator, 'language', { configurable: true, value: 'fr' });

      const s: UserState = merge(initialState, {
        settings: {
          general: {},
        },
      });

      const result = userGeneralSettingsSelectors.currentResponseLanguage(s as UserStore);

      expect(result).toBe('fr-FR');

      Object.defineProperty(window.navigator, 'language', {
        configurable: true,
        value: originalLanguage,
      });
    });
  });

  describe('neutralColor', () => {
    it('should return undefined if general settings not exists', () => {
      const s: UserState = merge(initialState, {
        settings: {
          general: undefined,
        },
      });

      const result = userGeneralSettingsSelectors.neutralColor(s as UserStore);

      expect(result).toBeUndefined();
    });

    it('should return undefined if neutralColor not set', () => {
      const s: UserState = merge(initialState, {
        settings: {
          general: {},
        },
      });

      const result = userGeneralSettingsSelectors.neutralColor(s as UserStore);

      expect(result).toBeUndefined();
    });

    it('should return the neutralColor', () => {
      const s: UserState = merge(initialState, {
        settings: {
          general: { neutralColor: '#000000' },
        },
      });

      const result = userGeneralSettingsSelectors.neutralColor(s as UserStore);

      expect(result).toBe('#000000');
    });
  });

  describe('primaryColor', () => {
    it('should return undefined if general settings not exists', () => {
      const s: UserState = merge(initialState, {
        settings: {
          general: undefined,
        },
      });

      const result = userGeneralSettingsSelectors.primaryColor(s as UserStore);

      expect(result).toBeUndefined();
    });

    it('should return undefined if primaryColor not set', () => {
      const s: UserState = merge(initialState, {
        settings: {
          general: {},
        },
      });

      const result = userGeneralSettingsSelectors.primaryColor(s as UserStore);

      expect(result).toBeUndefined();
    });

    it('should return the primaryColor', () => {
      const s: UserState = merge(initialState, {
        settings: {
          general: { primaryColor: '#ffffff' },
        },
      });

      const result = userGeneralSettingsSelectors.primaryColor(s as UserStore);

      expect(result).toBe('#ffffff');
    });
  });

  it('should return the highlighterTheme', () => {
    const s: UserState = merge(initialState, {
      settings: {
        general: { highlighterTheme: 'lobe-theme' },
      },
    });

    const result = userGeneralSettingsSelectors.highlighterTheme(s as UserStore);

    expect(result).toBe('lobe-theme');
  });

  it('should return the mermaidTheme', () => {
    const s: UserState = merge(initialState, {
      settings: {
        general: { mermaidTheme: 'lobe-theme' },
      },
    });

    const result = userGeneralSettingsSelectors.mermaidTheme(s as UserStore);

    expect(result).toBe('lobe-theme');
  });
});
