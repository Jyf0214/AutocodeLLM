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

import { createStaticStyles, cx } from 'antd-style';
import { memo } from 'react';

import { LOADING_FLAT } from '@/const/message';
import MarkdownMessage from '@/features/Conversation/Markdown';
import ContentLoading from '@/features/Conversation/Messages/components/ContentLoading';

import { normalizeThinkTags, processWithArtifact } from '../../../utils/markdown';
import { useMarkdown } from '../useMarkdown';

const styles = createStaticStyles(({ css, cssVar }) => {
  return {
    pWithTool: css`
      color: ${cssVar.colorTextTertiary};
    `,
  };
});
interface ContentBlockProps {
  content: string;
  hasTools?: boolean;
  id: string;
  isFirstBlock?: boolean;
}

const MessageContent = memo<ContentBlockProps>(({ content, hasTools, id, isFirstBlock }) => {
  const message = normalizeThinkTags(processWithArtifact(content));
  const markdownProps = useMarkdown(id);

  if (!content && !hasTools) return <ContentLoading id={id} />;

  if (content === LOADING_FLAT) {
    return <ContentLoading id={id} />;
  }

  const isSingleLine = (message || '').split('\n').length <= 2;
  const isToolSingleLine = hasTools && isSingleLine;

  return (
    content && (
      <MarkdownMessage
        {...markdownProps}
        animated={isFirstBlock ? false : markdownProps.animated}
        className={cx(isToolSingleLine && styles.pWithTool)}
      >
        {message}
      </MarkdownMessage>
    )
  );
});

export default MessageContent;
