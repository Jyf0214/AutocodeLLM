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

import { type UIChatMessage } from '@lobechat/types';
import { Flexbox, Tag } from '@lobehub/ui';
import isEqual from 'fast-deep-equal';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { ChatItem } from '@/features/Conversation/ChatItem';
import TaskAvatar from '@/features/Conversation/Messages/Tasks/shared/TaskAvatar';

import { useAgentMeta } from '../../hooks';
import { dataSelectors, useConversationStore } from '../../store';
import { AssistantActionsBar } from '../Task/Actions';
import TaskItem from './TaskItem';

interface TasksMessageProps {
  id: string;
  index: number;
}

const TasksMessage = memo<TasksMessageProps>(({ id, index }) => {
  const { t } = useTranslation('chat');
  const item = useConversationStore(dataSelectors.getDisplayMessageById(id), isEqual)!;
  const actionsConfig = useConversationStore((s) => s.actionsBar?.assistant);
  const tasks = (item as UIChatMessage)?.tasks?.filter(Boolean) as UIChatMessage[] | undefined;

  // Use first task's agentId for avatar, or fallback to undefined
  const firstTaskAgentId = tasks?.[0]?.agentId;
  const avatar = useAgentMeta(firstTaskAgentId);

  if (!tasks || tasks.length === 0) {
    return null;
  }

  const { createdAt } = item;

  return (
    <ChatItem
      showTitle
      aboveMessage={null}
      avatar={avatar}
      customAvatarRender={(_, node) => <TaskAvatar>{node}</TaskAvatar>}
      id={id}
      message=""
      placement="left"
      time={createdAt}
      titleAddon={<Tag>{t('task.batchTasks', { count: tasks.length })}</Tag>}
      actions={
        <AssistantActionsBar actionsConfig={actionsConfig} data={item} id={id} index={index} />
      }
    >
      <Flexbox gap={8} width={'100%'}>
        {tasks.map((task) => (
          <TaskItem item={task} key={task.id} />
        ))}
      </Flexbox>
    </ChatItem>
  );
}, isEqual);

TasksMessage.displayName = 'TasksMessage';

export default TasksMessage;
