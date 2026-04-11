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

import { getBuiltinStreaming } from '@lobechat/builtin-tools/streamings';
import { type ChatToolResult, type ToolIntervention } from '@lobechat/types';
import { safeParsePartialJSON } from '@lobechat/utils';
import { Flexbox } from '@lobehub/ui';
import { memo, Suspense } from 'react';

import AbortResponse from './AbortResponse';
import LoadingPlaceholder from './LoadingPlaceholder';
import RejectedResponse from './RejectedResponse';
import ToolRender from './Render';

interface RenderProps {
  apiName: string;
  arguments?: string;
  disableEditing?: boolean;
  identifier: string;
  intervention?: ToolIntervention;
  isArgumentsStreaming?: boolean;
  isToolCalling?: boolean;
  /**
   * ContentBlock ID (not the group message ID)
   */
  messageId: string;
  result?: ChatToolResult;
  showCustomToolRender?: boolean;
  toolCallId: string;
  toolMessageId?: string;
  type?: string;
}

/**
 * Tool Render for Group Messages
 *
 * In group messages, tool results are already embedded in the payload,
 * so we don't need to query them from the store or handle streaming.
 */
const Render = memo<RenderProps>(
  ({
    toolCallId,
    messageId,
    arguments: requestArgs,
    disableEditing,
    identifier,
    apiName,
    result,
    type,
    intervention,
    toolMessageId,
    isArgumentsStreaming,
    isToolCalling,
    showCustomToolRender,
  }) => {
    // Pending interventions are rendered in the bottom InterventionBar, not inline
    if (toolMessageId && intervention?.status === 'pending' && !disableEditing) {
      return null;
    }

    if (intervention?.status === 'rejected') {
      return <RejectedResponse reason={intervention.rejectedReason} />;
    }

    if (intervention?.status === 'aborted') {
      return <AbortResponse />;
    }

    // Handle arguments streaming state
    if (isArgumentsStreaming || !result) {
      // Check if there's a custom streaming renderer for this tool
      const StreamingRenderer = getBuiltinStreaming(identifier, apiName);

      if (StreamingRenderer) {
        const args = safeParsePartialJSON(requestArgs);

        return (
          <StreamingRenderer
            apiName={apiName}
            args={args}
            identifier={identifier}
            messageId={messageId}
            toolCallId={toolCallId}
          />
        );
      }

      // No custom streaming renderer, return null
      return null;
    }

    const placeholder = (
      <LoadingPlaceholder
        loading
        apiName={apiName}
        identifier={identifier}
        messageId={messageId}
        requestArgs={requestArgs}
        toolCallId={toolCallId}
      />
    );

    if (isToolCalling) return placeholder;

    return (
      <Suspense fallback={placeholder}>
        <Flexbox gap={8}>
          <ToolRender
            content={result.content || ''}
            messageId={toolMessageId}
            pluginState={result.state}
            showCustomToolRender={result.error ? false : showCustomToolRender}
            toolCallId={toolCallId}
            plugin={{
              apiName,
              arguments: requestArgs || '',
              identifier,
              type: type as any,
            }}
          />
        </Flexbox>
      </Suspense>
    );
  },
);

Render.displayName = 'GroupToolRender';

export default Render;
