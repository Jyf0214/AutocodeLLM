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

import { Accordion, AccordionItem, ScrollShadow } from '@lobehub/ui';
import { createStaticStyles } from 'antd-style';
import { type CSSProperties, type ReactNode, type RefObject } from 'react';
import { memo, useEffect, useState } from 'react';

import MarkdownMessage from '@/features/Conversation/Markdown';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { type ChatCitationItem } from '@/types/index';

import Title from './Title';

const styles = createStaticStyles(({ css, cssVar }) => ({
  contentScroll: css`
    max-height: min(40vh, 320px);
    padding-block-end: 8px;
    padding-inline: 8px;
    color: ${cssVar.colorTextDescription};

    article * {
      color: ${cssVar.colorTextDescription};
    }
  `,
}));

interface ThinkingProps {
  citations?: ChatCitationItem[];
  content?: string | ReactNode;
  duration?: number;
  style?: CSSProperties;
  thinking?: boolean;
  thinkingAnimated?: boolean;
}

const Thinking = memo<ThinkingProps>((props) => {
  const { content, duration, thinking, citations, thinkingAnimated } = props;
  const [showDetail, setShowDetail] = useState(false);

  const { ref, handleScroll } = useAutoScroll<HTMLDivElement>({
    deps: [content, showDetail],
    enabled: thinking && showDetail,
    threshold: 120,
  });

  useEffect(() => {
    setShowDetail(!!thinking);
  }, [thinking]);

  return (
    <Accordion
      expandedKeys={showDetail ? ['thinking'] : []}
      gap={8}
      onExpandedChange={(keys) => setShowDetail(keys.length > 0)}
    >
      <AccordionItem
        itemKey={'thinking'}
        paddingBlock={4}
        paddingInline={4}
        title={<Title duration={duration} showDetail={showDetail} thinking={thinking} />}
      >
        <ScrollShadow
          className={styles.contentScroll}
          offset={12}
          ref={ref as RefObject<HTMLDivElement>}
          size={12}
          onScroll={handleScroll}
        >
          {typeof content === 'string' ? (
            <MarkdownMessage
              animated={thinkingAnimated}
              citations={citations}
              variant={'chat'}
              style={{
                overflow: 'unset',
              }}
            >
              {content}
            </MarkdownMessage>
          ) : (
            content
          )}
        </ScrollShadow>
      </AccordionItem>
    </Accordion>
  );
});

export default Thinking;
