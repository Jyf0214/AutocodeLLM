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

import { createStaticStyles, keyframes } from 'antd-style';
import { memo } from 'react';

const smallLoaderAnim = keyframes`
  100% {
    transform: rotate(1turn);
  }
`;

const styles = createStaticStyles(({ css, cssVar }) => ({
  background: css`
    position: absolute;
    inset: 0;

    aspect-ratio: 1;
    width: 100%;
    border-radius: 50%;

    background: ${cssVar.colorFill};

    mask: radial-gradient(
      farthest-side,
      #0000 calc(100% - var(--circle-loader-border-width, 2.5px)),
      #000 0
    );
  `,
  container: css`
    position: relative;
    width: 13px;
    height: 13px;
  `,

  loader: css`
    position: absolute;
    inset: 0;

    aspect-ratio: 1;
    width: 100%;
    border-radius: 50%;

    background:
      radial-gradient(farthest-side, ${cssVar.colorTextSecondary} 94%, #0000) top/
        var(--circle-loader-border-width, 2.5px) var(--circle-loader-border-width, 2.5px) no-repeat,
      conic-gradient(#0000 50%, ${cssVar.colorTextSecondary});

    mask: radial-gradient(
      farthest-side,
      #0000 calc(100% - var(--circle-loader-border-width, 2.5px)),
      #000 0
    );

    animation: ${smallLoaderAnim} 1s infinite linear;
  `,
}));

const CircleLoader = memo(() => {
  return (
    <div className={styles.container}>
      <div className={styles.loader} />
      <div className={styles.background} />
    </div>
  );
});

export default CircleLoader;
