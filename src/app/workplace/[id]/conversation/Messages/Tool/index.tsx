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

import { type UIChatMessage } from '@lobechat/types';
import { Alert, Button, Flexbox } from '@lobehub/ui';
import isEqual from 'fast-deep-equal';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { dataSelectors, useConversationStore } from '../../store';
import Tool from './Tool';

interface ToolMessageProps {
  disableEditing?: boolean;
  id: string;
  index: number;
}

const ToolMessage = memo<ToolMessageProps>(({ disableEditing, id, index }) => {
  const { t } = useTranslation('plugin');
  const item = useConversationStore(dataSelectors.getDbMessageById(id), isEqual) as UIChatMessage;
  const deleteToolMessage = useConversationStore((s) => s.deleteToolMessage);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteToolMessage(id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flexbox gap={4} paddingBlock={12}>
      {!disableEditing && (
        <Alert
          title={t('inspector.orphanedToolCall')}
          type={'secondary'}
          action={
            <Button loading={loading} size={'small'} type={'primary'} onClick={handleDelete}>
              {t('inspector.delete')}
            </Button>
          }
        />
      )}
      {item.plugin && (
        <Tool
          {...item.plugin}
          disableEditing={disableEditing}
          index={index}
          messageId={id}
          toolCallId={item.tool_call_id!}
        />
      )}
    </Flexbox>
  );
}, isEqual);

export default ToolMessage;
