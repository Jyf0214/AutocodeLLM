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

import { DEFAULT_AVATAR } from '@/const/meta';
import { type MetaData } from '@/types/meta';

import { sessionMetaSelectors } from './meta';

vi.mock('i18next', () => ({
  t: vi.fn((key) => key), // Simplified mock return value
}));

/**
 * Note: Agent-related meta selectors (currentAgentMeta, currentAgentTitle, currentAgentDescription, etc.)
 * have been moved to agentSelectors in @/store/agent/selectors.
 * See agentSelectors tests for those.
 */
describe('sessionMetaSelectors', () => {
  describe('getAvatar', () => {
    it('should return the avatar from the meta data', () => {
      const meta: MetaData = { avatar: 'custom-avatar.png' };
      const avatar = sessionMetaSelectors.getAvatar(meta);
      expect(avatar).toBe(meta.avatar);
    });

    it('should return the default avatar if none is defined in the meta data', () => {
      const meta: MetaData = {};
      const avatar = sessionMetaSelectors.getAvatar(meta);
      expect(avatar).toBe(DEFAULT_AVATAR);
    });
  });

  describe('getTitle', () => {
    it('should return the title from the meta data', () => {
      const meta: MetaData = { title: 'Custom Title' };
      const title = sessionMetaSelectors.getTitle(meta);
      expect(title).toBe(meta.title);
    });

    it('should return the default title if none is defined in the meta data', () => {
      const meta: MetaData = {};
      const title = sessionMetaSelectors.getTitle(meta);
      expect(title).toBe('defaultSession'); // Assuming translation returns this key
    });
  });

  describe('getDescription', () => {
    it('should return the description from the meta data', () => {
      const meta: MetaData = { description: 'Custom Description' };
      const description = sessionMetaSelectors.getDescription(meta);
      expect(description).toBe(meta.description);
    });

    it('should return the default description if none is defined in the meta data', () => {
      const meta: MetaData = {};
      const description = sessionMetaSelectors.getDescription(meta);
      expect(description).toBe(undefined); // Assuming translation returns this key
    });
  });
});
