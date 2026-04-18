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

import { Markdown, ScrollShadow } from '@lobehub/ui';
import { createStaticStyles } from 'antd-style';
import { type RefObject } from 'react';
import { memo, useEffect } from 'react';

import { useAutoScroll } from '@/hooks/useAutoScroll';

const styles = createStaticStyles(({ css }) => ({
  container: css`
    padding-block: 12px;
    padding-inline: 16px;
    border-radius: 8px;
    font-size: 14px;
  `,
}));

interface StreamingMarkdownProps {
  children?: string;
  maxHeight?: number;
}

const StreamingMarkdown = memo<StreamingMarkdownProps>(({ children, maxHeight = 400 }) => {
  const { ref, handleScroll, resetScrollLock } = useAutoScroll<HTMLDivElement>({
    deps: [children],
  });

  // Reset scroll lock when content is cleared (new stream starts)
  useEffect(() => {
    if (!children) {
      resetScrollLock();
    }
  }, [children, resetScrollLock]);

  if (!children) return null;

  return (
    <ScrollShadow
      className={styles.container}
      offset={12}
      ref={ref as RefObject<HTMLDivElement>}
      size={12}
      style={{ maxHeight }}
      onScroll={handleScroll}
    >
      <Markdown animated style={{ overflow: 'unset' }} variant={'chat'}>
        {children}
      </Markdown>
    </ScrollShadow>
  );
});

StreamingMarkdown.displayName = 'StreamingMarkdown';

export default StreamingMarkdown;
