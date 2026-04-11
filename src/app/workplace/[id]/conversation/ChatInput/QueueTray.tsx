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

import { ActionIcon, Flexbox, Icon } from '@lobehub/ui';
import { createStaticStyles } from 'antd-style';
import { ListEnd, Pencil, Trash2 } from 'lucide-react';
import { memo, useCallback, useMemo } from 'react';

import { useChatStore } from '@/store/chat';
import { operationSelectors } from '@/store/chat/selectors';
import { messageMapKey } from '@/store/chat/utils/messageMapKey';

import { useConversationStore } from '../store';

const styles = createStaticStyles(({ css, cssVar }) => ({
  container: css`
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-block-end: none;
    border-radius: 12px 12px 0 0;
    background: ${cssVar.colorBgContainer};
  `,
  icon: css`
    flex-shrink: 0;
    color: ${cssVar.colorTextDescription};
  `,
  item: css`
    padding-block: 6px 4px;
    padding-inline: 12px 8px;
  `,
  itemDivider: css`
    border-block-start: 1px solid ${cssVar.colorBorderSecondary};
  `,
  text: css`
    overflow: hidden;

    font-size: 13px;
    line-height: 1.4;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
}));

const QueueTray = memo(() => {
  const context = useConversationStore((s) => s.context);

  const contextKey = useMemo(
    () =>
      messageMapKey({
        agentId: context.agentId,
        groupId: context.groupId,
        topicId: context.topicId,
      }),
    [context.agentId, context.groupId, context.topicId],
  );

  const queuedMessages = useChatStore((s) => operationSelectors.getQueuedMessages(context)(s));
  const removeQueuedMessage = useChatStore((s) => s.removeQueuedMessage);
  const editor = useConversationStore((s) => s.editor);

  const handleEdit = useCallback(
    (msgId: string, content: string) => {
      removeQueuedMessage(contextKey, msgId);
      editor?.setDocument('markdown', content);
      editor?.focus();
    },
    [contextKey, editor, removeQueuedMessage],
  );

  if (queuedMessages.length === 0) return null;

  return (
    <Flexbox className={styles.container} gap={0}>
      {queuedMessages.map((msg, index) => (
        <Flexbox
          horizontal
          align="center"
          className={index > 0 ? `${styles.item} ${styles.itemDivider}` : styles.item}
          gap={8}
          key={msg.id}
        >
          <Icon className={styles.icon} icon={ListEnd} size={14} />
          <Flexbox className={styles.text} flex={1}>
            {msg.content}
          </Flexbox>
          <ActionIcon icon={Pencil} size="small" onClick={() => handleEdit(msg.id, msg.content)} />
          <ActionIcon
            icon={Trash2}
            size="small"
            onClick={() => removeQueuedMessage(contextKey, msg.id)}
          />
        </Flexbox>
      ))}
    </Flexbox>
  );
});

QueueTray.displayName = 'QueueTray';

export default QueueTray;
