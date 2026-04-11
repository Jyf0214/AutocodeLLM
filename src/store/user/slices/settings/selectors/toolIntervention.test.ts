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

import { toolInterventionSelectors } from './toolIntervention';

describe('toolInterventionSelectors', () => {
  describe('approvalMode', () => {
    it('should return "manual" by default when no config exists', () => {
      const s: UserState = merge(initialState, {
        settings: {},
      });

      const result = toolInterventionSelectors.approvalMode(s as UserStore);

      expect(result).toBe('manual');
    });

    it('should return "auto-run" when configured', () => {
      const s: UserState = merge(initialState, {
        settings: {
          tool: {
            humanIntervention: {
              approvalMode: 'auto-run',
            },
          },
        },
      });

      const result = toolInterventionSelectors.approvalMode(s as UserStore);

      expect(result).toBe('auto-run');
    });

    it('should return "allow-list" when configured', () => {
      const s: UserState = merge(initialState, {
        settings: {
          tool: {
            humanIntervention: {
              approvalMode: 'allow-list',
            },
          },
        },
      });

      const result = toolInterventionSelectors.approvalMode(s as UserStore);

      expect(result).toBe('allow-list');
    });

    it('should return "manual" when configured', () => {
      const s: UserState = merge(initialState, {
        settings: {
          tool: {
            humanIntervention: {
              approvalMode: 'manual',
            },
          },
        },
      });

      const result = toolInterventionSelectors.approvalMode(s as UserStore);

      expect(result).toBe('manual');
    });

    it('should fallback to "auto-run" when approvalMode is "headless"', () => {
      const s: UserState = merge(initialState, {
        settings: {
          tool: {
            humanIntervention: {
              approvalMode: 'headless' as any,
            },
          },
        },
      });

      const result = toolInterventionSelectors.approvalMode(s as UserStore);

      // headless is for backend async tasks only, UI should show auto-run
      expect(result).toBe('auto-run');
    });
  });

  describe('allowList', () => {
    it('should return empty array by default', () => {
      const s: UserState = merge(initialState, {
        settings: {},
      });

      const result = toolInterventionSelectors.allowList(s as UserStore);

      expect(result).toEqual([]);
    });

    it('should return configured allowList', () => {
      const allowList = ['bash/bash', 'web-search/search'];
      const s: UserState = merge(initialState, {
        settings: {
          tool: {
            humanIntervention: {
              allowList,
            },
          },
        },
      });

      const result = toolInterventionSelectors.allowList(s as UserStore);

      expect(result).toEqual(allowList);
    });
  });

  describe('config', () => {
    it('should return empty object by default', () => {
      const s: UserState = merge(initialState, {
        settings: {},
      });

      const result = toolInterventionSelectors.config(s as UserStore);

      expect(result).toEqual({});
    });

    it('should return full humanIntervention config', () => {
      const config = {
        approvalMode: 'allow-list' as const,
        allowList: ['bash/bash'],
      };
      const s: UserState = merge(initialState, {
        settings: {
          tool: {
            humanIntervention: config,
          },
        },
      });

      const result = toolInterventionSelectors.config(s as UserStore);

      expect(result).toEqual(config);
    });
  });
});
