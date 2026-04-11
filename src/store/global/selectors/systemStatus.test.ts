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

import { describe, expect, it, vi } from 'vitest';

import { merge } from '@/utils/merge';

import { type GlobalState } from '../initialState';
import { INITIAL_STATUS, initialState } from '../initialState';
import { systemStatusSelectors } from './systemStatus';

// Mock version constants
vi.mock('@/const/version', () => ({
  isServerMode: false,
  isUsePgliteDB: true,
}));

describe('systemStatusSelectors', () => {
  describe('sessionGroupKeys', () => {
    it('should return expandSessionGroupKeys from status', () => {
      const s: GlobalState = merge(initialState, {
        status: {
          expandSessionGroupKeys: ['group1', 'group2'],
        },
      });
      expect(systemStatusSelectors.sessionGroupKeys(s)).toEqual(['group1', 'group2']);
    });

    it('should return initial value if not set', () => {
      const s: GlobalState = merge(initialState, {
        status: {
          expandSessionGroupKeys: undefined,
        },
      });
      expect(systemStatusSelectors.sessionGroupKeys(s)).toEqual(
        INITIAL_STATUS.expandSessionGroupKeys,
      );
    });
  });

  describe('basic selectors', () => {
    const s: GlobalState = merge(initialState, {
      status: {
        showSystemRole: true,
        mobileShowTopic: true,
        mobileShowPortal: true,
        showRightPanel: true,
        showLeftPanel: true,
        showFilePanel: true,
        hidePWAInstaller: true,
        isShowCredit: true,
        zenMode: false,
        leftPanelWidth: 300,
        portalWidth: 500,
        filePanelWidth: 400,
        inputHeight: 150,
        threadInputHeight: 100,
      },
    });

    it('should return correct values for basic selectors', () => {
      expect(systemStatusSelectors.showSystemRole(s)).toBe(true);
      expect(systemStatusSelectors.mobileShowTopic(s)).toBe(true);
      expect(systemStatusSelectors.mobileShowPortal(s)).toBe(true);
      expect(systemStatusSelectors.showRightPanel(s)).toBe(true);
      expect(systemStatusSelectors.showLeftPanel(s)).toBe(true);
      expect(systemStatusSelectors.showFilePanel(s)).toBe(true);
      expect(systemStatusSelectors.hidePWAInstaller(s)).toBe(true);
      expect(systemStatusSelectors.isShowCredit(s)).toBe(true);
      expect(systemStatusSelectors.showChatHeader(s)).toBe(true);
      expect(systemStatusSelectors.inZenMode(s)).toBe(false);
      expect(systemStatusSelectors.leftPanelWidth(s)).toBe(300);
      expect(systemStatusSelectors.portalWidth(s)).toBe(500);
      expect(systemStatusSelectors.filePanelWidth(s)).toBe(400);
      expect(systemStatusSelectors.wideScreen(s)).toBe(false);
    });

    it('should handle zen mode effects', () => {
      const zenState = merge(s, {
        status: { zenMode: true },
      });
      expect(systemStatusSelectors.showRightPanel(zenState)).toBe(false);
      expect(systemStatusSelectors.showLeftPanel(zenState)).toBe(false);
      expect(systemStatusSelectors.showChatHeader(zenState)).toBe(false);
    });

    it('should return default portal width if not set', () => {
      const noPortalWidth = merge(initialState, {
        status: { portalWidth: undefined },
      });
      expect(systemStatusSelectors.portalWidth(noPortalWidth)).toBe(400);
    });
  });
});
