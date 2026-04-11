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

import { type ToolIntervention } from '@lobechat/types';
import { Block, Icon, Tooltip } from '@lobehub/ui';
import { cssVar } from 'antd-style';
import { Ban, Check, HandIcon, PauseIcon, X } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import NeuralNetworkLoading from '@/components/NeuralNetworkLoading';
import { LOADING_FLAT } from '@/const/message';

interface StatusIndicatorProps {
  intervention?: ToolIntervention;
  result?: { content: string | null; error?: any; state?: any };
}

const StatusIndicator = memo<StatusIndicatorProps>(({ intervention, result }) => {
  const { t } = useTranslation('chat');

  const hasError = !!result?.error;
  const hasSuccessResult = !!result?.content && result.content !== LOADING_FLAT;
  const hasResult = hasSuccessResult || hasError;
  const isPending = intervention?.status === 'pending';
  const isReject = intervention?.status === 'rejected';
  const isAbort = intervention?.status === 'aborted';

  let icon;

  if (isAbort) {
    icon = (
      <Tooltip title={t('tool.intervention.toolAbort')}>
        <Icon color={cssVar.colorTextTertiary} icon={PauseIcon} />
      </Tooltip>
    );
  } else if (isReject) {
    icon = (
      <Tooltip title={t('tool.intervention.toolRejected')}>
        <Icon color={cssVar.colorTextTertiary} icon={Ban} />
      </Tooltip>
    );
  } else if (hasError) {
    icon = <Icon color={cssVar.colorError} icon={X} />;
  } else if (isPending) {
    icon = <Icon color={cssVar.colorInfo} icon={HandIcon} />;
  } else if (hasResult) {
    icon = <Icon color={cssVar.colorSuccess} icon={Check} />;
  } else {
    icon = <NeuralNetworkLoading size={16} />;
  }

  return (
    <Block
      horizontal
      align={'center'}
      flex={'none'}
      gap={4}
      height={24}
      justify={'center'}
      variant={'outlined'}
      width={24}
      style={{
        fontSize: 12,
      }}
    >
      {icon}
    </Block>
  );
});

export default StatusIndicator;
