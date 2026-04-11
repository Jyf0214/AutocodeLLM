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

import { createStyles } from 'antd-style';

export const useStyles = createStyles(({ css, token }) => ({
  actions: css`
    padding-block: 8px;
    padding-inline: 16px;
    border-block-start: 1px solid ${token.colorBorderSecondary};
  `,
  container: css`
    overflow: hidden;
    display: flex;
    flex-direction: column;

    max-height: 50vh;
    margin-block-end: 12px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 10px;

    background: ${token.colorBgContainer};
  `,
  content: css`
    overflow-y: auto;
    flex: 1;

    min-height: 0;
    padding-block: 12px;
    padding-inline: 16px;
  `,
  tab: css`
    cursor: pointer;

    padding-block: 6px;
    padding-inline: 14px;
    border-block-end: 2px solid transparent;

    font-size: 12px;
    color: ${token.colorTextSecondary};
    white-space: nowrap;

    transition: all 0.2s;

    &:hover {
      color: ${token.colorText};
    }
  `,
  tabActive: css`
    border-block-end-color: ${token.colorPrimary};
    color: ${token.colorPrimary};
    background: ${token.colorPrimaryBg};
  `,
  tabBar: css`
    overflow-x: auto;
    display: flex;
    align-items: center;
    border-block-end: 1px solid ${token.colorBorderSecondary};
  `,
  tabCounter: css`
    margin-inline-start: auto;
    padding-block: 6px;
    padding-inline: 14px;

    font-size: 11px;
    color: ${token.colorTextTertiary};
    white-space: nowrap;
  `,
}));
