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
import { css, cx } from 'antd-style';
import {
  ArrowDownFromLine,
  Copy,
  DownloadIcon,
  Edit,
  LanguagesIcon,
  ListChevronsDownUp,
  ListChevronsUpDown,
  ListRestart,
  Play,
  RotateCcw,
  Share2,
  Split,
  Trash,
} from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { localeOptions } from '@/locales/resources';

const translateStyle = css`
  .ant-dropdown-menu-sub {
    overflow-y: scroll;
    max-height: 400px;
  }
`;

interface ChatListActionsBar {
  branching: ActionIconGroupItemType;
  collapse: ActionIconGroupItemType;
  continueGeneration: ActionIconGroupItemType;
  copy: ActionIconGroupItemType;
  del: ActionIconGroupItemType;
  delAndRegenerate: ActionIconGroupItemType;
  divider: { type: 'divider' };
  edit: ActionIconGroupItemType;
  expand: ActionIconGroupItemType;
  export: ActionIconGroupItemType;
  regenerate: ActionIconGroupItemType;
  share: ActionIconGroupItemType;
  translate: ActionIconGroupItemType;
  tts: ActionIconGroupItemType;
}

export const useChatListActionsBar = ({
  hasThread,
  isContinuing,
  isRegenerating,
}: {
  hasThread?: boolean;
  isContinuing?: boolean;
  isRegenerating?: boolean;
} = {}): ChatListActionsBar => {
  const { t } = useTranslation(['common', 'chat']);

  return useMemo<ChatListActionsBar>(
    () => ({
      branching: {
        icon: Split,
        key: 'branching',
        label: t('branching'),
      },
      collapse: {
        icon: ListChevronsDownUp,
        key: 'collapse',
        label: t('messageAction.collapse', { ns: 'chat' }),
      },
      continueGeneration: {
        disabled: isContinuing,
        icon: ArrowDownFromLine,
        key: 'continueGeneration',
        label: t('messageAction.continueGeneration', { ns: 'chat' }),
        spin: isContinuing,
      },
      copy: {
        icon: Copy,
        key: 'copy',
        label: t('copy'),
      },
      del: {
        danger: true,
        disabled: hasThread,
        icon: Trash,
        key: 'del',
        label: hasThread ? t('messageAction.deleteDisabledByThreads', { ns: 'chat' }) : t('delete'),
      },
      delAndRegenerate: {
        disabled: hasThread || isRegenerating,
        icon: ListRestart,
        key: 'delAndRegenerate',
        label: t('messageAction.delAndRegenerate', {
          ns: 'chat',
        }),
      },
      divider: {
        type: 'divider',
      },
      edit: {
        icon: Edit,
        key: 'edit',
        label: t('edit'),
      },
      expand: {
        icon: ListChevronsUpDown,
        key: 'expand',
        label: t('messageAction.expand', { ns: 'chat' }),
      },
      export: {
        icon: DownloadIcon,
        key: 'export',
        label: '导出为 PDF',
      },
      regenerate: {
        disabled: isRegenerating,
        icon: RotateCcw,
        key: 'regenerate',
        label: t('regenerate'),
        spin: isRegenerating,
      },
      share: {
        icon: Share2,
        key: 'share',
        label: t('share'),
      },
      translate: {
        children: localeOptions.map((i) => ({
          key: i.value,
          label: t(`lang.${i.value}`),
        })),
        icon: LanguagesIcon,
        key: 'translate',
        label: t('translate.action', { ns: 'chat' }),
        popupClassName: cx(translateStyle),
      },
      tts: {
        icon: Play,
        key: 'tts',
        label: t('tts.action', { ns: 'chat' }),
      },
    }),
    [hasThread, isContinuing, isRegenerating],
  );
};
