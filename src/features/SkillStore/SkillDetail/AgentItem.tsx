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

'use client';

import { Avatar, Block, Flexbox } from '@lobehub/ui';
import { memo } from 'react';

import { itemStyles } from './style';

interface AgentItemProps {
  avatar?: string;
  backgroundColor?: string;
  description?: string;
  identifier?: string;
  title?: string;
}

const AgentItem = memo<AgentItemProps>(
  ({ avatar, title, description, identifier, backgroundColor }) => {
    const styles = itemStyles;

    if (!identifier || !title) return null;

    return (
      <a
        href={`/community/agent/${identifier}`}
        rel="noopener noreferrer"
        style={{ display: 'block', height: '100%' }}
        target="_blank"
      >
        <Block
          clickable
          horizontal
          align={'center'}
          className={styles.container}
          gap={12}
          paddingBlock={12}
          paddingInline={12}
          style={{ cursor: 'pointer', height: '100%' }}
          variant={'outlined'}
        >
          <Avatar
            avatar={avatar}
            background={backgroundColor || 'transparent'}
            shape={'square'}
            size={40}
            style={{ flex: 'none' }}
          />
          <Flexbox flex={1} gap={4} style={{ minWidth: 0, overflow: 'hidden' }}>
            <span className={styles.title}>{title}</span>
            {description && <span className={styles.description}>{description}</span>}
          </Flexbox>
        </Block>
      </a>
    );
  },
);

export default AgentItem;
