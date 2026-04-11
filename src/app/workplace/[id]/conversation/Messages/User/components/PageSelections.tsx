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
import { createStaticStyles } from 'antd-style';
import { memo } from 'react';

import { type PageSelection } from '@/types/index';

const styles = createStaticStyles(({ css, cssVar }) => ({
  container: css`
    cursor: pointer;
    position: relative;
    border-radius: 8px;

    :hover {
      background: ${cssVar.colorFillQuaternary};
    }
  `,
  content: css`
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;

    font-size: 12px;
    line-height: 1.5;
    color: ${cssVar.colorTextSecondary};
    white-space: pre-wrap;
  `,
  quote: css`
    inset-block-start: 2px;
    inset-inline-start: 0;

    font-family: Georgia, serif;
    font-size: 28px;
    line-height: 1;
    color: ${cssVar.colorTextQuaternary};
  `,
  wrapper: css``,
}));

interface PageSelectionsProps {
  selections: PageSelection[];
}

const PageSelections = memo<PageSelectionsProps>(({ selections }) => {
  if (!selections || selections.length === 0) return null;

  return (
    <Flexbox gap={8}>
      {selections.map((selection) => (
        <Flexbox className={styles.container} key={selection.id}>
          <Flexbox horizontal className={styles.wrapper} gap={4} padding={4}>
            {}
            <span className={styles.quote}>"</span>
            <div className={styles.content}>{selection.content}</div>
          </Flexbox>
        </Flexbox>
      ))}
    </Flexbox>
  );
});

export default PageSelections;
