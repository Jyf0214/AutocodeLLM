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
import { cx } from 'antd-style';
import { type CSSProperties, type ReactNode } from 'react';
import { memo, useMemo } from 'react';

import { MAX_SIZE_DESKTOP, MIN_IMAGE_SIZE, styles } from './style';

interface GridProps {
  children: ReactNode;
  className?: string;
  col?: number;
  gap?: number;
  max?: number;
  min?: number;
  style?: CSSProperties;
}

const Grid = memo<GridProps>(
  ({
    gap = 4,
    col = 3,
    max = MAX_SIZE_DESKTOP,
    min = MIN_IMAGE_SIZE,
    children,
    className,
    style,
  }) => {
    const cssVariables = useMemo<Record<string, string>>(
      () => ({
        '--galley-grid-col': `${col}`,
        '--galley-grid-gap': `${gap}px`,
        '--galley-grid-max': `${max}px`,
        '--galley-grid-min': `${min}px`,
      }),
      [col, gap, max, min],
    );

    return (
      <Flexbox
        horizontal
        className={cx(styles.container, className)}
        gap={gap}
        style={{
          ...cssVariables,
          ...style,
        }}
      >
        {children}
      </Flexbox>
    );
  },
);

export default Grid;
