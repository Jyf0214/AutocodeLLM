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

import { Icon } from '@lobehub/ui';
import { Button } from 'antd';
import { Minimize2 } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useChatStore } from '@/store/chat';

import { useConversationStore } from '../store';
import BaseErrorForm from './BaseErrorForm';

interface ExceededContextWindowErrorProps {
  id: string;
}

const ExceededContextWindowError = memo<ExceededContextWindowErrorProps>(({ id }) => {
  const { t } = useTranslation('error');
  const [loading, setLoading] = useState(false);

  const context = useConversationStore((s) => s.context);
  const regenerateUserMessage = useConversationStore((s) => s.regenerateUserMessage);
  const parentId = useConversationStore(
    (s) => s.displayMessages.find((m) => m.id === id)?.parentId,
  );

  const handleCompact = useCallback(async () => {
    if (!context.topicId || !parentId) return;

    setLoading(true);
    try {
      await useChatStore.getState().executeCompression(context, '');
      await regenerateUserMessage(parentId);
    } finally {
      setLoading(false);
    }
  }, [context, parentId, regenerateUserMessage]);

  return (
    <BaseErrorForm
      avatar={<Icon icon={Minimize2} size={24} />}
      desc={t('exceededContext.desc')}
      title={t('exceededContext.title')}
      action={
        <Button
          disabled={!context.topicId}
          loading={loading}
          type={'primary'}
          onClick={handleCompact}
        >
          {t('exceededContext.compact')}
        </Button>
      }
    />
  );
});

export default ExceededContextWindowError;
