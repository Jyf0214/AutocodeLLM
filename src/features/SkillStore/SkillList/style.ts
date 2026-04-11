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

import { createStaticStyles, responsive } from 'antd-style';

export const gridStyles = createStaticStyles(({ css }) => ({
  grid: css`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;

    padding-block-end: 16px;
    padding-inline: 16px;

    ${responsive.sm} {
      grid-template-columns: 1fr;
    }
  `,
}));

export const virtuosoGridStyles = createStaticStyles(({ css }) => ({
  item: css`
    width: calc(50% - 6px);

    ${responsive.sm} {
      width: 100%;
    }
  `,
  list: css`
    display: flex;
    flex-wrap: wrap;
    gap: 12px;

    padding-block-end: 16px;
    padding-inline: 16px;
  `,
}));

export const itemStyles = createStaticStyles(({ css, cssVar }) => ({
  container: css`
    position: relative;
    overflow: hidden;
    flex: 1;
    min-width: 0;
  `,
  description: css`
    overflow: hidden;

    font-size: 12px;
    color: ${cssVar.colorTextSecondary};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  title: css`
    overflow: hidden;

    font-size: 14px;
    font-weight: 500;
    color: ${cssVar.colorText};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
}));
