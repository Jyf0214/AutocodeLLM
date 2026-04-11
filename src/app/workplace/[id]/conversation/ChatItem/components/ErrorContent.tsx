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

import { Alert, Skeleton } from '@lobehub/ui';
import { Button } from 'antd';
import { RotateCcw } from 'lucide-react';
import { memo, Suspense } from 'react';
import { useTranslation } from 'react-i18next';

import { useConversationStore } from '@/features/Conversation';

import { type ChatItemProps } from '../type';

export interface ErrorContentProps {
  customErrorRender?: ChatItemProps['customErrorRender'];
  error: ChatItemProps['error'];
  id?: string;
  onRegenerate?: () => void;
}

const ErrorContent = memo<ErrorContentProps>(({ customErrorRender, error, id, onRegenerate }) => {
  const { t } = useTranslation('common');
  const [deleteMessage] = useConversationStore((s) => [s.deleteMessage]);

  if (!error) return;

  if (customErrorRender) {
    return (
      <Suspense fallback={<Skeleton.Button active block />}>{customErrorRender(error)}</Suspense>
    );
  }

  return (
    <Alert
      closable
      extraDefaultExpand
      showIcon
      extraIsolate={false}
      type={'secondary'}
      action={
        onRegenerate && (
          <Button
            color="default"
            icon={<RotateCcw size={14} />}
            size="small"
            variant="filled"
            onClick={onRegenerate}
          >
            {t('regenerate')}
          </Button>
        )
      }
      {...error}
      title={error.message}
      afterClose={() => {
        error?.afterClose?.();
        if (id) {
          deleteMessage(id);
        }
      }}
      style={{
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
        ...error.style,
      }}
    />
  );
});

export default ErrorContent;
