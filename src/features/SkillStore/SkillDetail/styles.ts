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

export const ICON_SIZE = 56;

export const styles = createStaticStyles(({ css, cssVar }) => ({
  authorLink: css`
    cursor: pointer;

    display: inline-flex;
    gap: 4px;
    align-items: center;

    color: ${cssVar.colorPrimary};

    &:hover {
      text-decoration: underline;
    }
  `,
  code: css`
    font-family: ${cssVar.fontFamilyCode};
  `,
  detailItem: css`
    display: flex;
    flex-direction: column;
    gap: 4px;
  `,
  detailLabel: css`
    font-size: 12px;
    color: ${cssVar.colorTextTertiary};
  `,
  header: css`
    display: flex;
    gap: 16px;
    align-items: center;
    border-radius: 12px;

    /* background: ${cssVar.colorFillTertiary}; */
  `,
  icon: css`
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;

    width: ${ICON_SIZE}px;
    height: ${ICON_SIZE}px;
  `,
  introduction: css`
    font-size: 14px;
    line-height: 1.8;
    color: ${cssVar.colorText};
  `,
  nav: css`
    border-block-end: 1px solid ${cssVar.colorBorder};
  `,
  sectionTitle: css`
    font-size: 14px;
    font-weight: 600;
    color: ${cssVar.colorText};
  `,
  title: css`
    font-size: 18px;
    font-weight: 600;
    color: ${cssVar.colorText};
  `,
  trustWarning: css`
    font-size: 12px;
    line-height: 1.6;
    color: ${cssVar.colorTextTertiary};
  `,
}));
