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

import { deserializeParts } from '@lobechat/utils';
import { type MarkdownProps } from '@lobehub/ui';
import { memo } from 'react';

import { LOADING_FLAT } from '@/const/message';
import MarkdownMessage from '@/features/Conversation/Markdown';

import { normalizeThinkTags, processWithArtifact } from '../../utils/markdown';
import ContentLoading from './ContentLoading';
import { RichContentRenderer } from './RichContentRenderer';

const DisplayContent = memo<{
  addIdOnDOM?: boolean;
  content: string;
  generating?: boolean;
  hasImages?: boolean;
  id: string;
  isMultimodal?: boolean;
  isToolCallGenerating?: boolean;
  markdownProps?: Omit<MarkdownProps, 'className' | 'style' | 'children'>;
  tempDisplayContent?: string;
}>(
  ({
    markdownProps,
    content,
    generating,
    isToolCallGenerating,
    hasImages,
    isMultimodal,
    tempDisplayContent,
    id,
  }) => {
    const message = normalizeThinkTags(processWithArtifact(content));
    if (isToolCallGenerating) return;

    if (content === LOADING_FLAT) return generating ? <ContentLoading id={id} /> : null;
    if (!content && !hasImages) return <ContentLoading id={id} />;

    const contentParts = isMultimodal ? deserializeParts(tempDisplayContent || content) : null;

    return contentParts ? (
      <RichContentRenderer parts={contentParts} />
    ) : (
      <MarkdownMessage {...markdownProps}>{message}</MarkdownMessage>
    );
  },
);

export default DisplayContent;
