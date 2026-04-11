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

import { ENABLE_BUSINESS_FEATURES } from '@lobechat/business-const';
import { type ILobeAgentRuntimeErrorType } from '@lobechat/model-runtime';
import { AgentRuntimeErrorType } from '@lobechat/model-runtime';
import { type ChatMessageError, type ErrorType, type IToolErrorType } from '@lobechat/types';
import { ChatErrorType } from '@lobechat/types';
import { type AlertProps } from '@lobehub/ui';
import { Block, Highlighter, Skeleton } from '@lobehub/ui';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import useBusinessErrorAlertConfig from '@/business/client/hooks/useBusinessErrorAlertConfig';
import useBusinessErrorContent from '@/business/client/hooks/useBusinessErrorContent';
import useRenderBusinessChatErrorMessageExtra from '@/business/client/hooks/useRenderBusinessChatErrorMessageExtra';
import ErrorContent from '@/features/Conversation/ChatItem/components/ErrorContent';
import { useProviderName } from '@/hooks/useProviderName';
import dynamic from '@/libs/next/dynamic';

import ChatInvalidAPIKey from './ChatInvalidApiKey';

interface ErrorMessageData {
  error?: ChatMessageError | null;
  id: string;
}

const loading = () => (
  <Block
    align={'center'}
    padding={16}
    variant={'outlined'}
    style={{
      overflow: 'hidden',
      position: 'relative',
      width: '100%',
    }}
  >
    <Skeleton.Button active block />
  </Block>
);

const ExceededContextWindowError = dynamic(() => import('./ExceededContextWindowError'), {
  loading,
  ssr: false,
});

const OllamaBizError = dynamic(() => import('./OllamaBizError'), { loading, ssr: false });

const OllamaSetupGuide = dynamic(() => import('./OllamaSetupGuide'), {
  loading,
  ssr: false,
});

// Config for the errorMessage display
const getErrorAlertConfig = (
  errorType?: IToolErrorType | ILobeAgentRuntimeErrorType | ErrorType,
): AlertProps | undefined => {
  // OpenAIBizError / ZhipuBizError / GoogleBizError / ...
  if (typeof errorType === 'string' && (errorType.includes('Biz') || errorType.includes('Invalid')))
    return {
      type: 'secondary',
    };

  switch (errorType) {
    case ChatErrorType.SystemTimeNotMatchError:
    case AgentRuntimeErrorType.PermissionDenied:
    case AgentRuntimeErrorType.InsufficientQuota:
    case AgentRuntimeErrorType.ModelNotFound:
    case AgentRuntimeErrorType.QuotaLimitReached:
    case AgentRuntimeErrorType.ExceededContextWindow:
    case AgentRuntimeErrorType.LocationNotSupportError: {
      return {
        type: 'secondary',
      };
    }

    case AgentRuntimeErrorType.OllamaServiceUnavailable:
    case AgentRuntimeErrorType.NoOpenAIAPIKey:
    case AgentRuntimeErrorType.ComfyUIServiceUnavailable:
    case AgentRuntimeErrorType.InvalidComfyUIArgs: {
      return {
        type: 'secondary',
      };
    }

    default: {
      return undefined;
    }
  }
};

export const useErrorContent = (error: any) => {
  const { t } = useTranslation('error');
  const providerName = useProviderName(error?.body?.provider || '');
  const businessAlertConfig = useBusinessErrorAlertConfig(error?.type);
  const { errorType: businessErrorType, hideMessage } = useBusinessErrorContent(error?.type);

  return useMemo<AlertProps | undefined>(() => {
    if (!error) return;
    const messageError = error;

    // Use business alert config if provided, otherwise fall back to default
    const alertConfig = businessAlertConfig ?? getErrorAlertConfig(messageError.type);

    // Use business error type if provided, otherwise use original
    const finalErrorType = businessErrorType ?? messageError.type;

    return {
      message: hideMessage
        ? undefined
        : t(`response.${finalErrorType}` as any, { provider: providerName }),
      ...alertConfig,
    };
  }, [businessAlertConfig, businessErrorType, error, hideMessage, providerName, t]);
};

interface ErrorExtraProps {
  data: ErrorMessageData;
  error?: AlertProps;
}

const ErrorMessageExtra = memo<ErrorExtraProps>(({ error: alertError, data }) => {
  const error = data.error;
  const businessChatErrorMessageExtra = useRenderBusinessChatErrorMessageExtra(error, data.id);

  if (ENABLE_BUSINESS_FEATURES && businessChatErrorMessageExtra)
    return businessChatErrorMessageExtra;

  if (!error?.type) return;

  switch (error.type) {
    case AgentRuntimeErrorType.OllamaServiceUnavailable: {
      return <OllamaSetupGuide id={data.id} />;
    }

    case AgentRuntimeErrorType.OllamaBizError: {
      return <OllamaBizError {...data} />;
    }

    case AgentRuntimeErrorType.ExceededContextWindow: {
      return <ExceededContextWindowError id={data.id} />;
    }

    case AgentRuntimeErrorType.NoOpenAIAPIKey: {
      {
        return <ChatInvalidAPIKey id={data.id} provider={data.error?.body?.provider} />;
      }
    }
  }

  if (error.type.toString().includes('Invalid')) {
    return <ChatInvalidAPIKey id={data.id} provider={data.error?.body?.provider} />;
  }

  return (
    <ErrorContent
      id={data.id}
      error={{
        ...alertError,
        extra: data.error?.body ? (
          <Highlighter
            actionIconSize={'small'}
            language={'json'}
            padding={8}
            variant={'borderless'}
          >
            {JSON.stringify(data.error?.body, null, 2)}
          </Highlighter>
        ) : undefined,
      }}
    />
  );
});

export default ErrorMessageExtra;
