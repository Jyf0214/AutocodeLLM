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

import { t } from 'i18next';

import { DEFAULT_AVATAR } from '@/const/meta';
import { type SessionStore } from '@/store/session';
import { type MetaData } from '@/types/meta';
import { merge } from '@/utils/merge';

import { sessionSelectors } from './list';

// ==========   Meta   ============== //

/**
 * Get group chat meta data
 * Note: For agent-related meta, use agentSelectors from @/store/agent/selectors instead
 */
const currentGroupMeta = (s: SessionStore): MetaData => {
  const defaultMeta = {
    description: t('group.desc', { ns: 'chat' }),
    title: t('group.title', { ns: 'chat' }),
  };

  const session = sessionSelectors.currentSession(s);

  return merge(defaultMeta, session?.meta);
};

const getAvatar = (s: MetaData) => s.avatar || DEFAULT_AVATAR;
const getTitle = (s: MetaData) => s.title || t('defaultSession', { ns: 'common' });
// New session do not show 'noDescription'
export const getDescription = (s: MetaData) => s.description;

export const sessionMetaSelectors = {
  currentGroupMeta,
  getAvatar,
  getDescription,
  getTitle,
};
