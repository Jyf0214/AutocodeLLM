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

import { createStaticStyles } from 'antd-style';

export const styles = createStaticStyles(({ css, cssVar }) => ({
  container: css`
    pointer-events: auto;
    user-select: none;
    overflow: hidden;
    padding: 0 !important;
  `,
  detailPopup: css`
    user-select: none;
    overscroll-behavior: contain;
    width: 400px;
  `,
  dropdownMenu: css`
    user-select: none;

    [role='menuitem'] {
      margin-block: 1px;
      margin-inline: 4px;
      padding-block: 8px;
      padding-inline: 8px;
      border-radius: ${cssVar.borderRadiusSM};
    }
  `,
  groupHeader: css`
    width: 100%;
    color: ${cssVar.colorTextSecondary};
  `,
  list: css`
    position: relative;
    overflow: hidden auto;
    overscroll-behavior: contain;
    width: 100%;
  `,
  menuItem: css`
    cursor: pointer;

    position: relative;

    gap: 8px;
    align-items: center;

    margin-block: 1px;
    margin-inline: 4px;
    padding-block: 8px;
    padding-inline: 8px;
    border-radius: ${cssVar.borderRadiusSM};
  `,
  menuItemActive: css`
    background: ${cssVar.colorFillTertiary};
  `,
  footer: css`
    border-block-start: 1px solid ${cssVar.colorBorderSecondary};
  `,
  toolbar: css`
    border-block-end: 1px solid ${cssVar.colorBorderSecondary};
  `,
  trigger: css`
    display: inline-flex;
    outline: none;

    /* SVG icons (from @lobehub/icons IconAvatar) can receive focus when dropdown closes,
       causing an unwanted blue outline ring */
    svg:focus {
      outline: none;
    }
  `,
}));
