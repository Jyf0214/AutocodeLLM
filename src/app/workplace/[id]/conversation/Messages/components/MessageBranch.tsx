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

import { Center, Flexbox, Icon } from '@lobehub/ui';
import { createStaticStyles, cssVar, cx } from 'antd-style';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { memo } from 'react';

import { useConversationStore } from '../../store';

const prefixCls = 'ant';

const styles = createStaticStyles(({ css }) => ({
  button: css`
    cursor: pointer;

    display: flex;
    align-items: center;
    justify-content: center;

    width: 20px;
    height: 20px;
    border-radius: 4px;

    color: ${cssVar.colorTextSecondary};

    transition: all 0.2s ease;

    &:hover:not(.${prefixCls}-disabled) {
      color: ${cssVar.colorText};
      background: ${cssVar.colorFillSecondary};
    }

    &.${prefixCls}-disabled {
      cursor: not-allowed;
      opacity: 0.4;
    }
  `,
  container: css`
    user-select: none;

    display: inline-flex;
    gap: 4px;
    align-items: center;

    height: 20px;
    padding-inline: 4px;
    border-radius: ${cssVar.borderRadiusSM};
  `,
  text: css`
    min-width: 24px;
    height: 20px;

    font-size: 12px;
    font-variant-numeric: tabular-nums;
    color: ${cssVar.colorTextSecondary};
    text-align: center;
  `,
}));

interface MessageBranchProps {
  activeBranchIndex: number;
  count: number;
  messageId: string;
}

const MessageBranch = memo<MessageBranchProps>(({ activeBranchIndex, count, messageId }) => {
  const switchMessageBranch = useConversationStore((s) => s.switchMessageBranch);

  const handlePrevious = () => {
    if (activeBranchIndex > 0) {
      switchMessageBranch(messageId, activeBranchIndex - 1);
    }
  };

  const handleNext = () => {
    if (activeBranchIndex < count - 1) {
      switchMessageBranch(messageId, activeBranchIndex + 1);
    }
  };

  const canGoPrevious = activeBranchIndex > 0;
  const canGoNext = activeBranchIndex < count - 1;

  return (
    <Flexbox horizontal className={styles.container}>
      <div
        className={cx(styles.button, !canGoPrevious && `${prefixCls}-disabled`)}
        role="button"
        tabIndex={canGoPrevious ? 0 : -1}
        onClick={handlePrevious}
      >
        <Icon icon={ChevronLeft} size={16} />
      </div>
      <Center className={styles.text}>
        {activeBranchIndex + 1}/{count}
      </Center>
      <div
        className={cx(styles.button, !canGoNext && `${prefixCls}-disabled`)}
        role="button"
        tabIndex={canGoNext ? 0 : -1}
        onClick={handleNext}
      >
        <Icon icon={ChevronRight} size={16} />
      </div>
    </Flexbox>
  );
});

export default MessageBranch;
