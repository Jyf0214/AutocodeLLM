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

import { type ActionIconGroupItemType } from '@lobehub/ui';
import { copyToClipboard } from '@lobehub/ui';
import { App } from 'antd';
import { css, cx } from 'antd-style';
import {
  Copy,
  Edit,
  LanguagesIcon,
  ListChevronsDownUp,
  ListChevronsUpDown,
  ListRestart,
  Play,
  RotateCcw,
  Share2,
  Trash,
} from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { localeOptions } from '@/locales/resources';
import { type UIChatMessage } from '@/types/index';

import { messageStateSelectors, useConversationStore } from '../../../store';

const translateStyle = css`
  .ant-dropdown-menu-sub {
    overflow-y: scroll;
    max-height: 400px;
  }
`;

export interface ActionItem extends ActionIconGroupItemType {
  children?: Array<{ handleClick?: () => void; key: string; label: string }>;
  handleClick?: () => void | Promise<void>;
}

export interface AssistantActions {
  collapse: ActionItem;
  copy: ActionItem;
  del: ActionItem;
  delAndRegenerate: ActionItem;
  divider: { type: 'divider' };
  edit: ActionItem;
  expand: ActionItem;
  regenerate: ActionItem;
  share: ActionItem;
  translate: ActionItem;
  tts: ActionItem;
}

interface UseAssistantActionsParams {
  data: UIChatMessage;
  id: string;
  index: number;
  onOpenShareModal?: () => void;
}

export const useAssistantActions = ({
  id,
  data,
  onOpenShareModal,
}: UseAssistantActionsParams): AssistantActions => {
  const { t } = useTranslation(['common', 'chat']);
  const { message } = App.useApp();

  // Get state from ConversationStore
  const isCollapsed = useConversationStore(messageStateSelectors.isMessageCollapsed(id));
  const isRegenerating = useConversationStore(messageStateSelectors.isMessageRegenerating(id));

  // Get actions from ConversationStore
  const [
    toggleMessageEditing,
    toggleMessageCollapsed,
    deleteMessage,
    regenerateAssistantMessage,
    translateMessage,
    ttsMessage,
    delAndRegenerateMessage,
  ] = useConversationStore((s) => [
    s.toggleMessageEditing,
    s.toggleMessageCollapsed,
    s.deleteMessage,
    s.regenerateAssistantMessage,
    s.translateMessage,
    s.ttsMessage,
    s.delAndRegenerateMessage,
  ]);

  return useMemo<AssistantActions>(
    () => ({
      collapse: {
        handleClick: () => toggleMessageCollapsed(id),
        icon: ListChevronsDownUp,
        key: 'collapse',
        label: t('messageAction.collapse', { ns: 'chat' }),
      },
      copy: {
        handleClick: async () => {
          await copyToClipboard(data.content);
          message.success(t('copySuccess'));
        },
        icon: Copy,
        key: 'copy',
        label: t('copy'),
      },
      del: {
        danger: true,
        handleClick: () => deleteMessage(id),
        icon: Trash,
        key: 'del',
        label: t('delete'),
      },
      delAndRegenerate: {
        disabled: isRegenerating,
        handleClick: () => delAndRegenerateMessage(id),
        icon: ListRestart,
        key: 'delAndRegenerate',
        label: t('messageAction.delAndRegenerate', { ns: 'chat' }),
      },
      divider: {
        type: 'divider',
      },
      edit: {
        handleClick: () => {
          toggleMessageEditing(id, true);
        },
        icon: Edit,
        key: 'edit',
        label: t('edit'),
      },
      expand: {
        handleClick: () => toggleMessageCollapsed(id),
        icon: ListChevronsUpDown,
        key: 'expand',
        label: t('messageAction.expand', { ns: 'chat' }),
      },
      regenerate: {
        disabled: isRegenerating,
        handleClick: () => {
          regenerateAssistantMessage(id);
          if (data.error) deleteMessage(id);
        },
        icon: RotateCcw,
        key: 'regenerate',
        label: t('regenerate'),
        spin: isRegenerating || undefined,
      },
      share: {
        handleClick: onOpenShareModal,
        icon: Share2,
        key: 'share',
        label: t('share'),
      },
      translate: {
        children: localeOptions.map((i) => ({
          key: i.value,
          label: t(`lang.${i.value}`),
          onClick: () => translateMessage(id, i.value),
        })),
        icon: LanguagesIcon,
        key: 'translate',
        label: t('translate.action', { ns: 'chat' }),
        popupClassName: cx(translateStyle),
      },
      tts: {
        handleClick: () => ttsMessage(id),
        icon: Play,
        key: 'tts',
        label: t('tts.action', { ns: 'chat' }),
      },
    }),
    [
      t,
      id,
      data.content,
      data.error,
      isRegenerating,
      isCollapsed,
      toggleMessageEditing,
      deleteMessage,
      regenerateAssistantMessage,
      translateMessage,
      ttsMessage,
      delAndRegenerateMessage,
      toggleMessageCollapsed,
      onOpenShareModal,
      message,
    ],
  );
};
