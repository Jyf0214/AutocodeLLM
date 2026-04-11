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

import { ProviderIcon } from '@lobehub/icons';
import { Button } from '@lobehub/ui';
import { ModelProvider } from 'model-bank';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import urlJoin from 'url-join';

import { useProviderName } from '@/hooks/useProviderName';
import { type GlobalLLMProviderKey } from '@/types/user/settings/modelProvider';

import { useConversationStore } from '../store';
import BaseErrorForm from './BaseErrorForm';

interface ChatInvalidAPIKeyProps {
  id: string;
  provider?: string;
}
const ChatInvalidAPIKey = memo<ChatInvalidAPIKeyProps>(({ id, provider }) => {
  const { t } = useTranslation(['modelProvider', 'error']);
  const navigate = useNavigate();
  const [deleteMessage] = useConversationStore((s) => [s.deleteMessage]);
  const providerName = useProviderName(provider as GlobalLLMProviderKey);

  return (
    <BaseErrorForm
      avatar={<ProviderIcon provider={provider} shape={'square'} size={40} />}
      title={t(`unlock.apiKey.title`, { name: providerName, ns: 'error' })}
      action={
        <Button
          type={'primary'}
          onClick={() => {
            navigate(urlJoin('/settings/provider', provider || 'all'));
            deleteMessage(id);
          }}
        >
          {t('unlock.goToSettings', { ns: 'error' })}
        </Button>
      }
      desc={
        provider === ModelProvider.Bedrock
          ? t('bedrock.unlock.description')
          : t(`unlock.apiKey.description`, {
              name: providerName,
              ns: 'error',
            })
      }
    />
  );
});

export default ChatInvalidAPIKey;
