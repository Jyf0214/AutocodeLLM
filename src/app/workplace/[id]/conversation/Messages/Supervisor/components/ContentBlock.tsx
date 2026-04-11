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

import { Flexbox } from '@lobehub/ui';
import { memo } from 'react';

import { LOADING_FLAT } from '@/const/message';
import { useErrorContent } from '@/features/Conversation/Error';
import { type AssistantContentBlock } from '@/types/index';

import ErrorContent from '../../../ChatItem/components/ErrorContent';
import { messageStateSelectors, useConversationStore } from '../../../store';
import MessageContent from '../../AssistantGroup/components/MessageContent';
import { Tools } from '../../AssistantGroup/Tools';
import Reasoning from '../../components/Reasoning';

interface ContentBlockProps extends AssistantContentBlock {
  disableEditing?: boolean;
}

const ContentBlock = memo<ContentBlockProps>(
  ({ id, tools, content, reasoning, error, disableEditing }) => {
    const errorContent = useErrorContent(error);
    const isReasoning = useConversationStore(messageStateSelectors.isMessageInReasoning(id));
    const hasTools = tools && tools.length > 0;
    const showReasoning =
      (!!reasoning && reasoning.content?.trim() !== '') || (!reasoning && isReasoning);

    if (error && (content === LOADING_FLAT || !content))
      return <ErrorContent error={errorContent} id={id} />;

    return (
      <Flexbox gap={8} id={id}>
        {showReasoning && <Reasoning {...reasoning} id={id} />}

        {/* Content - markdown text */}
        <MessageContent content={content} hasTools={hasTools} id={id} />

        {/* Tools */}
        {hasTools && <Tools disableEditing={disableEditing} messageId={id} tools={tools} />}
      </Flexbox>
    );
  },
);

export default ContentBlock;
