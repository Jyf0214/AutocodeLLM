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

'use client';

import { createModal, LOBE_THEME_APP_ID } from '@lobehub/ui';
import { t } from 'i18next';

import { isDesktop } from '@/const/version';
import { MarketAuthProvider } from '@/layout/AuthProvider/MarketAuth';

import { SkillStoreContent } from './SkillStoreContent';

export const createSkillStoreModal = () =>
  createModal({
    allowFullscreen: true,
    children: (
      <MarketAuthProvider isDesktop={isDesktop}>
        <SkillStoreContent />
      </MarketAuthProvider>
    ),
    destroyOnHidden: false,
    footer: null,
    // Render the antd Modal inside appElement instead of document.body,
    // so the modal and DropdownMenu portals share the same stacking context
    getContainer: () => document.getElementById(LOBE_THEME_APP_ID) || document.body,
    styles: {
      body: { overflow: 'hidden', padding: 0 },
    },
    title: t('skillStore.title', { ns: 'setting' }),
    width: 'min(80%, 800px)',
  });
