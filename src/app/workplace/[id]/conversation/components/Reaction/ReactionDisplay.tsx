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

import type { EmojiReaction } from '@lobechat/types';
import { Flexbox } from '@lobehub/ui';
import { createStaticStyles, cx } from 'antd-style';
import { memo } from 'react';

import ReactionPicker from './ReactionPicker';

const styles = createStaticStyles(({ css, cssVar }) => ({
  active: css`
    background: ${cssVar.colorFillTertiary};
  `,
  container: css`
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  `,
  count: css`
    font-size: 12px;
    color: ${cssVar.colorTextSecondary};
  `,
  reactionTag: css`
    cursor: pointer;

    display: inline-flex;
    gap: 4px;
    align-items: center;

    height: 28px;
    padding-block: 0;
    padding-inline: 10px;
    border-radius: 14px;

    font-size: 14px;
    line-height: 1;

    background: ${cssVar.colorFillSecondary};

    transition: all 0.2s;

    &:hover {
      background: ${cssVar.colorFillTertiary};
    }
  `,
}));

interface ReactionDisplayProps {
  /**
   * Whether the current user has reacted (used for single-user mode)
   */
  isActive?: (emoji: string) => boolean;
  /**
   * The message ID for adding reactions via the inline picker
   */
  messageId?: string;
  /**
   * Callback when a reaction is clicked
   */
  onReactionClick?: (emoji: string) => void;
  /**
   * The reactions to display
   */
  reactions: EmojiReaction[];
}

const ReactionDisplay = memo<ReactionDisplayProps>(
  ({ reactions, onReactionClick, messageId, isActive }) => {
    if (reactions.length === 0) return null;

    return (
      <Flexbox horizontal align={'center'} className={styles.container}>
        {reactions.map((reaction) => (
          <div
            className={cx(styles.reactionTag, isActive?.(reaction.emoji) && styles.active)}
            key={reaction.emoji}
            onClick={() => onReactionClick?.(reaction.emoji)}
          >
            <span>{reaction.emoji}</span>
            {reaction.count > 1 && <span className={styles.count}>{reaction.count}</span>}
          </div>
        ))}
        {messageId && <ReactionPicker messageId={messageId} />}
      </Flexbox>
    );
  },
);

ReactionDisplay.displayName = 'ReactionDisplay';

export default ReactionDisplay;
