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

import { Skeleton } from '@lobehub/ui';
import { createStaticStyles } from 'antd-style';
import { memo } from 'react';

const styles = createStaticStyles(({ css, cssVar }) => ({
  card: css`
    padding: 12px;
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: ${cssVar.borderRadiusLG};
    background: ${cssVar.colorBgContainer};
  `,
  grid: css`
    display: grid;
    gap: 16px;
    padding-block: 12px;
  `,
}));

interface MasonrySkeletonProps {
  columnCount: number;
}

const MasonrySkeleton = memo<MasonrySkeletonProps>(({ columnCount }) => {
  // Generate varying heights for more natural masonry look
  const heights = [160, 180, 170, 160, 190, 170, 160, 180];

  // Calculate number of items based on column count (max 2 columns for modal)
  const itemCount = Math.min(columnCount * 3, 8);

  return (
    <div
      className={styles.grid}
      style={{
        gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
      }}
    >
      {Array.from({ length: itemCount }).map((_, index) => (
        <div className={styles.card} key={index}>
          <Skeleton
            active
            avatar={{ shape: 'square', size: 48 }}
            paragraph={{
              rows: 3,
              width: ['100%', '90%', '70%'],
            }}
            style={{
              height: heights[index % heights.length],
            }}
            title={{
              width: '80%',
            }}
          />
        </div>
      ))}
    </div>
  );
});

MasonrySkeleton.displayName = 'MasonrySkeleton';

export default MasonrySkeleton;
