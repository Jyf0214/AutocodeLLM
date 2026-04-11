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

import { createModal } from '@lobehub/ui';
import { t } from 'i18next';
import { type Klavis } from 'klavis';

import { BuiltinAgentSkillDetailContent } from './BuiltinAgentSkillDetailContent';
import { BuiltinSkillDetailContent } from './BuiltinSkillDetailContent';
import { KlavisSkillDetailContent } from './KlavisSkillDetailContent';
import { LobehubSkillDetailContent } from './LobehubSkillDetailContent';

export interface CreateBuiltinAgentSkillDetailModalOptions {
  identifier: string;
}

export const createBuiltinAgentSkillDetailModal = ({
  identifier,
}: CreateBuiltinAgentSkillDetailModalOptions) =>
  createModal({
    children: <BuiltinAgentSkillDetailContent identifier={identifier} />,
    destroyOnHidden: true,
    footer: null,
    title: t('dev.title.skillDetails', { ns: 'plugin' }),
    width: 800,
  });

export interface CreateBuiltinSkillDetailModalOptions {
  identifier: string;
}

export const createBuiltinSkillDetailModal = ({
  identifier,
}: CreateBuiltinSkillDetailModalOptions) =>
  createModal({
    children: <BuiltinSkillDetailContent identifier={identifier} />,
    destroyOnHidden: true,
    footer: null,
    title: t('dev.title.skillDetails', { ns: 'plugin' }),
    width: 800,
  });

export interface CreateKlavisSkillDetailModalOptions {
  identifier: string;
  serverName: Klavis.McpServerName;
}

export const createKlavisSkillDetailModal = ({
  identifier,
  serverName,
}: CreateKlavisSkillDetailModalOptions) =>
  createModal({
    children: <KlavisSkillDetailContent identifier={identifier} serverName={serverName} />,
    destroyOnHidden: true,
    footer: null,
    title: t('dev.title.skillDetails', { ns: 'plugin' }),
    width: 800,
  });

export interface CreateLobehubSkillDetailModalOptions {
  identifier: string;
}

export const createLobehubSkillDetailModal = ({
  identifier,
}: CreateLobehubSkillDetailModalOptions) =>
  createModal({
    children: <LobehubSkillDetailContent identifier={identifier} />,
    destroyOnHidden: true,
    footer: null,
    title: t('dev.title.skillDetails', { ns: 'plugin' }),
    width: 800,
  });
