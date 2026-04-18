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

import { ErrorBoundary } from '@lobehub/ui';
import { type ComponentType, memo, type ReactNode, useCallback } from 'react';

import AlertFallback from './AlertFallback';
import SilentFallback from './SilentFallback';

export type ErrorBoundaryVariant = 'alert' | 'silent';

interface FallbackRenderProps {
  error: unknown;
  resetErrorBoundary: (...args: unknown[]) => void;
}

interface SafeBoundaryProps {
  alertTitle?: string;
  children: ReactNode;
  minHeight?: number;
  onError?: (error: unknown, info: { componentStack?: string | null }) => void;
  resetKeys?: unknown[];
  variant?: ErrorBoundaryVariant;
}

const SafeBoundary = memo<SafeBoundaryProps>(
  ({ children, variant = 'silent', alertTitle, minHeight, resetKeys, onError }) => {
    const fallbackRender = useCallback(
      (props: FallbackRenderProps) => {
        const error = props.error instanceof Error ? props.error : new Error(String(props.error));
        if (variant === 'alert') {
          return (
            <AlertFallback
              error={error}
              resetErrorBoundary={props.resetErrorBoundary}
              title={alertTitle}
            />
          );
        }
        return <SilentFallback minHeight={minHeight} />;
      },
      [variant, alertTitle, minHeight],
    );

    return (
      <ErrorBoundary fallbackRender={fallbackRender} resetKeys={resetKeys} onError={onError}>
        {children}
      </ErrorBoundary>
    );
  },
);

SafeBoundary.displayName = 'SafeBoundary';

export function withErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  options?: { alertTitle?: string; minHeight?: number; variant?: ErrorBoundaryVariant },
): ComponentType<P> {
  const Wrapped = (props: P) => (
    <SafeBoundary
      alertTitle={options?.alertTitle}
      minHeight={options?.minHeight}
      variant={options?.variant}
    >
      <Component {...props} />
    </SafeBoundary>
  );

  Wrapped.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;
  return Wrapped;
}

export { AlertFallback, SafeBoundary, SilentFallback };
export default SafeBoundary;
