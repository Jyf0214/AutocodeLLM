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
import { createStaticStyles } from 'antd-style';
import isEqual from 'fast-deep-equal';
import { memo, useMemo } from 'react';

import { LOADING_FLAT } from '@/const/message';
import { type AssistantContentBlock } from '@/types/index';

import { messageStateSelectors, useConversationStore } from '../../../store';
import { MessageAggregationContext } from '../../Contexts/MessageAggregationContext';
import { CollapsedMessage } from './CollapsedMessage';
import GroupItem from './GroupItem';

const styles = createStaticStyles(({ css }) => {
  return {
    container: css`
      &:has(.tool-blocks) {
        width: 100%;
      }
    `,
  };
});

interface GroupChildrenProps {
  blocks: AssistantContentBlock[];
  content?: string;
  contentId?: string;
  disableEditing?: boolean;
  id: string;
  messageIndex: number;
}

const isEmptyBlock = (block: AssistantContentBlock) =>
  (!block.content || block.content === LOADING_FLAT) &&
  (!block.tools || block.tools.length === 0) &&
  !block.error &&
  !block.reasoning;

const Group = memo<GroupChildrenProps>(
  ({ blocks, contentId, disableEditing, messageIndex, id, content }) => {
    const [isCollapsed, isGenerating] = useConversationStore((s) => [
      messageStateSelectors.isMessageCollapsed(id)(s),
      messageStateSelectors.isMessageGenerating(id)(s),
    ]);
    const contextValue = useMemo(() => ({ assistantGroupId: id }), [id]);

    if (isCollapsed) {
      return (
        content && (
          <Flexbox>
            <CollapsedMessage content={content} id={id} />
          </Flexbox>
        )
      );
    }
    return (
      <MessageAggregationContext value={contextValue}>
        <Flexbox className={styles.container} gap={8}>
          {blocks.map((item, index) => {
            if (!isGenerating && isEmptyBlock(item)) return null;

            return (
              <GroupItem
                {...item}
                assistantId={id}
                contentId={contentId}
                disableEditing={disableEditing}
                isFirstBlock={index === 0}
                key={id + '.' + item.id}
                messageIndex={messageIndex}
              />
            );
          })}
        </Flexbox>
      </MessageAggregationContext>
    );
  },
  isEqual,
);

export default Group;
