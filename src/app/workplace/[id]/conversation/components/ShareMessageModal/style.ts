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

import { lobeStaticStylish } from '@lobehub/ui';
import { createStaticStyles, cx , responsive } from 'antd-style';

export const styles = createStaticStyles(({ css, cssVar }) => ({
  body: css`
    ${responsive.sm} {
      padding-block-end: 68px;
    }
  `,
  footer: css`
    ${responsive.sm} {
      position: absolute;
      inset-block-end: 0;
      inset-inline: 0;

      width: 100%;
      margin: 0;
      padding: 16px;

      background: ${cssVar.colorBgContainer};
    }
  `,
  preview: cx(
    lobeStaticStylish.noScrollbar,
    css`
      overflow: hidden scroll;

      width: 100%;
      max-height: 70dvh;
      border: 1px solid ${cssVar.colorBorder};
      border-radius: ${cssVar.borderRadiusLG};

      background: ${cssVar.colorBgLayout};

      * {
        pointer-events: none;

        ::-webkit-scrollbar {
          width: 0 !important;
          height: 0 !important;
        }
      }

      ${responsive.sm} {
        max-height: 40dvh;
      }
    `,
  ),
  sidebar: css`
    flex: none;
    width: max(240px, 25%);
    ${responsive.sm} {
      flex: 1;
      width: unset;
      margin-inline: -16px;
    }
  `,
}));
