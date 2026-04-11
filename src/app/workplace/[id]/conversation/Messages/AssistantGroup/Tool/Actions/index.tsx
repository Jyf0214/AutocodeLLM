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

import { ActionIcon } from '@lobehub/ui';
import { LayoutPanelTop, LogsIcon, LucideBug, LucideBugOff, Trash2 } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useConversationStore } from '../../../../store';
import Settings from './Settings';

interface ActionsProps {
  assistantMessageId: string;
  canToggleCustomToolRender?: boolean;
  identifier: string;
  setShowCustomToolRender?: (show: boolean) => void;
  setShowDebug?: (show: boolean) => void;
  showCustomToolRender?: boolean;
  showDebug?: boolean;
}

const Actions = memo<ActionsProps>(
  ({
    assistantMessageId,
    canToggleCustomToolRender,
    identifier,
    setShowCustomToolRender,
    setShowDebug,
    showCustomToolRender,
    showDebug,
  }) => {
    const { t } = useTranslation('plugin');
    const deleteAssistantMessage = useConversationStore((s) => s.deleteAssistantMessage);

    return (
      <>
        {canToggleCustomToolRender && (
          <ActionIcon
            icon={showCustomToolRender ? LogsIcon : LayoutPanelTop}
            size={'small'}
            title={showCustomToolRender ? t('inspector.args') : t('inspector.pluginRender')}
            onClick={() => {
              setShowCustomToolRender?.(!showCustomToolRender);
            }}
          />
        )}
        <ActionIcon
          active={showDebug}
          icon={showDebug ? LucideBugOff : LucideBug}
          size={'small'}
          title={t(showDebug ? 'debug.off' : 'debug.on')}
          onClick={() => setShowDebug?.(!showDebug)}
        />
        <Settings id={identifier} />
        <ActionIcon
          danger
          icon={Trash2}
          size={'small'}
          title={t('inspector.delete')}
          onClick={() => {
            deleteAssistantMessage(assistantMessageId);
          }}
        />
      </>
    );
  },
);

Actions.displayName = 'ToolActions';

export default Actions;
