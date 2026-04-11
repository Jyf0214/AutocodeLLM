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

import { LOADING_FLAT } from '@lobechat/const';
import { Tag } from '@lobehub/ui';
import isEqual from 'fast-deep-equal';
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { ChatItem } from '@/features/Conversation/ChatItem';
import TaskAvatar from '@/features/Conversation/Messages/Tasks/shared/TaskAvatar';
import { useOpenChatSettings } from '@/hooks/useInterceptingRoutes';
import { useAgentStore } from '@/store/agent';
import { builtinAgentSelectors } from '@/store/agent/selectors';
import { useGlobalStore } from '@/store/global';

import ErrorMessageExtra, { useErrorContent } from '../../Error';
import { useAgentMeta, useDoubleClickEdit } from '../../hooks';
import { dataSelectors, messageStateSelectors, useConversationStore } from '../../store';
import { normalizeThinkTags, processWithArtifact } from '../../utils/markdown';
import { AssistantActionsBar } from './Actions';
import ClientTaskDetail from './ClientTaskDetail';
import TaskDetailPanel from './TaskDetailPanel';

interface TaskMessageProps {
  disableEditing?: boolean;
  id: string;
  index: number;
  isLatestItem?: boolean;
}

const TaskMessage = memo<TaskMessageProps>(({ id, index, disableEditing }) => {
  const { t } = useTranslation('chat');

  // Get message and actionsConfig from ConversationStore
  const item = useConversationStore(dataSelectors.getDisplayMessageById(id), isEqual)!;
  const actionsConfig = useConversationStore((s) => s.actionsBar?.assistant);

  const { agentId, groupId, error, role, content, createdAt, metadata, taskDetail } = item;

  const avatar = useAgentMeta(agentId);

  // Get editing and generating state from ConversationStore
  const editing = useConversationStore(messageStateSelectors.isMessageEditing(id));
  const generating = useConversationStore(messageStateSelectors.isMessageGenerating(id));

  const errorContent = useErrorContent(error);

  // remove line breaks in artifact tag to make the ast transform easier
  const message = !editing ? normalizeThinkTags(processWithArtifact(content)) : content;

  const isInbox = useAgentStore(builtinAgentSelectors.isInboxAgent);
  const [toggleSystemRole] = useGlobalStore((s) => [s.toggleSystemRole]);
  const openChatSettings = useOpenChatSettings();

  const onAvatarClick = useCallback(() => {
    if (!isInbox) {
      toggleSystemRole(true);
    } else {
      openChatSettings();
    }
  }, [isInbox]);

  const onDoubleClick = useDoubleClickEdit({ disableEditing, error, id, role });

  // Use taskTitle from metadata if available, otherwise fall back to avatar title
  const title = metadata?.taskTitle || avatar?.title;

  return (
    <ChatItem
      showTitle
      aboveMessage={null}
      avatar={{ ...avatar, title }}
      customAvatarRender={(_, node) => <TaskAvatar>{node}</TaskAvatar>}
      customErrorRender={(error) => <ErrorMessageExtra data={item} error={error} />}
      editing={editing}
      id={id}
      loading={generating}
      message={message}
      placement={'left'}
      time={createdAt}
      titleAddon={<Tag>{t('task.subtask')}</Tag>}
      actions={
        <AssistantActionsBar actionsConfig={actionsConfig} data={item} id={id} index={index} />
      }
      error={
        errorContent && error && (message === LOADING_FLAT || !message) ? errorContent : undefined
      }
      onAvatarClick={onAvatarClick}
      onDoubleClick={onDoubleClick}
    >
      {taskDetail?.clientMode ? (
        <ClientTaskDetail
          agentId={agentId !== 'supervisor' ? agentId : undefined}
          groupId={groupId}
          messageId={id}
          taskDetail={taskDetail}
        />
      ) : (
        <TaskDetailPanel
          content={content}
          instruction={metadata?.instruction}
          messageId={id}
          taskDetail={taskDetail}
        />
      )}
    </ChatItem>
  );
}, isEqual);

TaskMessage.displayName = 'AssistantMessage';

export default TaskMessage;
