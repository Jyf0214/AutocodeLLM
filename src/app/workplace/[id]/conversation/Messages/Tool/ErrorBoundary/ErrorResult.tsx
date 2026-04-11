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

'use client';

import { Alert, Highlighter } from '@lobehub/ui';
import { type ErrorInfo } from 'react';
import { memo } from 'react';

interface ErrorDisplayProps {
  apiName?: string;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  identifier?: string;
}

/**
 * Error display component using @lobehub/ui Alert
 */
export const ErrorDisplay = memo<ErrorDisplayProps>(({ error, identifier, apiName }) => {
  const title = identifier ? `${identifier}${apiName ? ` / ${apiName}` : ''}` : 'Tool Render Error';

  return (
    <Alert
      showIcon
      extraIsolate={false}
      message={error?.message || 'An unknown error occurred'}
      title={title}
      type="secondary"
      extra={
        error?.stack ? (
          <Highlighter actionIconSize="small" language="plaintext" padding={8} variant="borderless">
            {error.stack}
          </Highlighter>
        ) : undefined
      }
      style={{
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
      }}
    />
  );
});

ErrorDisplay.displayName = 'ToolErrorDisplay';
