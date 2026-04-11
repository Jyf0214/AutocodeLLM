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

import { Flexbox, Highlighter } from '@lobehub/ui';
import { memo, useCallback } from 'react';

import SafeBoundary from '@/components/ErrorBoundary';
import { LOADING_FLAT } from '@/const/message';
import { useErrorContent } from '@/features/Conversation/Error';
import { type AssistantContentBlock } from '@/types/index';

import ErrorContent from '../../../ChatItem/components/ErrorContent';
import { messageStateSelectors, useConversationStore } from '../../../store';
import ImageFileListViewer from '../../components/ImageFileListViewer';
import Reasoning from '../../components/Reasoning';
import { Tools } from '../Tools';
import MessageContent from './MessageContent';

interface ContentBlockProps extends AssistantContentBlock {
  assistantId: string;
  disableEditing?: boolean;
  isFirstBlock?: boolean;
}
const ContentBlock = memo<ContentBlockProps>(
  ({
    id,
    tools,
    content,
    imageList,
    reasoning,
    error,
    assistantId,
    disableEditing,
    isFirstBlock,
  }) => {
    const errorContent = useErrorContent(error);
    const showImageItems = !!imageList && imageList.length > 0;
    const [isReasoning, deleteMessage, continueGeneration] = useConversationStore((s) => [
      messageStateSelectors.isMessageInReasoning(id)(s),
      s.deleteDBMessage,
      s.continueGeneration,
    ]);
    const hasTools = tools && tools.length > 0;
    const showReasoning =
      (!!reasoning && reasoning.content?.trim() !== '') || (!reasoning && isReasoning);

    const handleRegenerate = useCallback(async () => {
      await deleteMessage(id);
      continueGeneration(assistantId);
    }, [id]);

    if (error && (content === LOADING_FLAT || !content)) {
      return (
        <ErrorContent
          id={id}
          error={
            errorContent && error && (content === LOADING_FLAT || !content)
              ? {
                  ...errorContent,
                  extra: error?.body && (
                    <Highlighter
                      actionIconSize={'small'}
                      language={'json'}
                      padding={8}
                      variant={'borderless'}
                    >
                      {JSON.stringify(error?.body, null, 2)}
                    </Highlighter>
                  ),
                }
              : undefined
          }
          onRegenerate={handleRegenerate}
        />
      );
    }

    return (
      <Flexbox gap={8} id={id}>
        {showReasoning && (
          <SafeBoundary>
            <Reasoning {...reasoning} id={id} />
          </SafeBoundary>
        )}

        <SafeBoundary variant="alert">
          <MessageContent
            content={content}
            hasTools={hasTools}
            id={id}
            isFirstBlock={isFirstBlock}
          />
        </SafeBoundary>

        {showImageItems && (
          <SafeBoundary>
            <ImageFileListViewer items={imageList} />
          </SafeBoundary>
        )}

        {hasTools && (
          <SafeBoundary>
            <Tools disableEditing={disableEditing} messageId={id} tools={tools} />
          </SafeBoundary>
        )}
      </Flexbox>
    );
  },
);

export default ContentBlock;
