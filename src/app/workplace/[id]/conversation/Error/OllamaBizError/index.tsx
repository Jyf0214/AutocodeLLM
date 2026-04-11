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

import { type ChatMessageError } from '@lobechat/types';
import { type AlertProps } from '@lobehub/ui';
import { Skeleton } from '@lobehub/ui';
import { memo } from 'react';

import ErrorContent from '@/features/Conversation/ChatItem/components/ErrorContent';
import dynamic from '@/libs/next/dynamic';

const loading = () => <Skeleton active style={{ width: 300 }} />;

const SetupGuide = dynamic(() => import('../OllamaSetupGuide'), { loading, ssr: false });

const InvalidModel = dynamic(() => import('./InvalidOllamaModel'), { loading, ssr: false });

interface OllamaError {
  code: string | null;
  message: string;
  param?: any;
  type: string;
}

interface OllamaErrorResponse {
  error: OllamaError;
}

// eslint-disable-next-line regexp/no-dupe-characters-character-class, regexp/no-obscure-range
const UNRESOLVED_MODEL_REGEXP = /model "([\w+,-_]+)" not found/;

interface OllamaBizErrorProps {
  alertError?: AlertProps;
  error?: ChatMessageError | null;
  id: string;
}

const OllamaBizError = memo<OllamaBizErrorProps>(({ alertError, error, id }) => {
  const errorBody: OllamaErrorResponse = (error as any)?.body;

  const errorMessage = errorBody.error?.message;

  // error of not pull the model
  const unresolvedModel = errorMessage?.match(UNRESOLVED_MODEL_REGEXP)?.[1];
  if (unresolvedModel) {
    return <InvalidModel id={id} model={unresolvedModel} />;
  }

  // error of not enable model or not set the CORS rules
  if (errorMessage?.includes('Failed to fetch')) {
    return <SetupGuide id={id} />;
  }

  return <ErrorContent error={alertError} id={id} />;
});

export default OllamaBizError;
