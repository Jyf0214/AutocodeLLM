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

import { getBuiltinInspector } from '@lobechat/builtin-tools/inspectors';
import type { ToolIntervention } from '@lobechat/types';
import { safeParseJSON, safeParsePartialJSON } from '@lobechat/utils';
import { Flexbox } from '@lobehub/ui';
import { memo } from 'react';

import SafeBoundary from '@/components/ErrorBoundary';
import { LOADING_FLAT } from '@/const/message';

import ExecutionTime from './ExecutionTime';
import StatusIndicator from './StatusIndicator';
import ToolTitle from './ToolTitle';

interface InspectorProps {
  apiName: string;
  arguments?: string;
  identifier: string;
  intervention?: ToolIntervention;
  /**
   * Whether the tool arguments are currently streaming
   */
  isArgumentsStreaming?: boolean;
  result?: { content: string | null; error?: any; state?: any };
}

const Inspectors = memo<InspectorProps>(
  ({ identifier, apiName, arguments: argsStr, result, intervention, isArgumentsStreaming }) => {
    const hasError = !!result?.error;
    const hasSuccessResult = !!result?.content && result.content !== LOADING_FLAT;
    const hasResult = hasSuccessResult || hasError;

    const isPending = intervention?.status === 'pending';
    const isAborted = intervention?.status === 'aborted';
    const isRejected = intervention?.status === 'rejected';

    // Distinguish between arguments streaming and tool executing
    const isToolExecuting =
      !hasResult && !isPending && !isAborted && !isRejected && !isArgumentsStreaming;
    const isTitleLoading = isArgumentsStreaming || isToolExecuting;

    // Check for custom inspector renderer
    const CustomInspector = getBuiltinInspector(identifier, apiName);

    if (CustomInspector) {
      const args = safeParseJSON(argsStr);
      const partialJson = safeParsePartialJSON(argsStr);
      return (
        <Flexbox allowShrink horizontal align={'center'} gap={6}>
          <StatusIndicator intervention={intervention} result={result} />
          <SafeBoundary minHeight={22} resetKeys={[argsStr, result]}>
            <CustomInspector
              apiName={apiName}
              args={args || {}}
              identifier={identifier}
              isArgumentsStreaming={isArgumentsStreaming}
              isLoading={isTitleLoading}
              partialArgs={partialJson}
              pluginState={result?.state}
              result={result}
            />
          </SafeBoundary>
          <ExecutionTime isExecuting={isToolExecuting} />
        </Flexbox>
      );
    }

    const args = safeParseJSON(argsStr);
    const partialJson = safeParsePartialJSON(argsStr);

    return (
      <Flexbox horizontal align={'center'} gap={6}>
        <StatusIndicator intervention={intervention} result={result} />
        <ToolTitle
          apiName={apiName}
          args={args || undefined}
          identifier={identifier}
          isAborted={isAborted}
          isLoading={isTitleLoading}
          partialArgs={partialJson || undefined}
        />
        <ExecutionTime isExecuting={isToolExecuting} />
      </Flexbox>
    );
  },
);

export default Inspectors;
