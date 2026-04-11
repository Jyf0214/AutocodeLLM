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
  badge: css`
    padding-block: 4px;
    padding-inline: 6px;
    border-radius: 2222px;

    font-size: 12px;
    line-height: 12px;
    color: ${cssVar.colorTextSecondary};

    background: ${cssVar.colorFillSecondary};
  `,

  container: css`
    cursor: pointer;

    width: fit-content;
    padding-block: 6px;
    padding-inline: 8px;
    padding-inline-end: 12px;
    border-radius: 8px;

    color: ${cssVar.colorText};

    background: color-mix(in srgb, ${cssVar.colorBgElevated} 90%, white);
    box-shadow: ${cssVar.boxShadowTertiary};

    transition: all 0.2s;

    &:hover {
      box-shadow: ${cssVar.boxShadowSecondary};
    }
  `,
  containerDark: css`
    &:hover {
      background: color-mix(in srgb, ${cssVar.colorBgElevated} 85%, white);
    }
  `,
  containerLight: css`
    &:hover {
      background: '';
    }
  `,
  filename: css`
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;

    font-size: 12px;
    text-overflow: ellipsis;
  `,

  mobile: css`
    width: 100%;
  `,
}));
