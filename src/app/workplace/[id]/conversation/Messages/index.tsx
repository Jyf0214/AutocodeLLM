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

import { isDesktop } from '@lobechat/const';
import { Flexbox } from '@lobehub/ui';
import { createStaticStyles, cx } from 'antd-style';
import isEqual from 'fast-deep-equal';
import { type MouseEvent, type ReactNode } from 'react';
import { memo, Suspense, useCallback } from 'react';

import BubblesLoading from '@/components/BubblesLoading';
import SafeBoundary from '@/components/ErrorBoundary';

import History from '../components/History';
import { useChatItemContextMenu } from '../hooks/useChatItemContextMenu';
import { dataSelectors, messageStateSelectors, useConversationStore } from '../store';
import AgentCouncilMessage from './AgentCouncil';
import AssistantMessage from './Assistant';
import AssistantGroupMessage from './AssistantGroup';
import CompressedGroupMessage from './CompressedGroup';
import GroupTasksMessage from './GroupTasks';
import SupervisorMessage from './Supervisor';
import TaskMessage from './Task';
import TasksMessage from './Tasks';
import ToolMessage from './Tool';
import UserMessage from './User';

const prefixCls = 'ant';

const styles = createStaticStyles(({ css }) => ({
  loading: css`
    opacity: 0.6;
  `,
  message: css`
    position: relative;
    // prevent the textarea too long
    .${prefixCls}-input {
      max-height: 900px;
    }
  `,
}));

export interface MessageItemProps {
  className?: string;
  disableEditing?: boolean;
  enableHistoryDivider?: boolean;
  endRender?: ReactNode;
  id: string;
  index: number;
  inPortalThread?: boolean;
  isLatestItem?: boolean;
}

const MessageItem = memo<MessageItemProps>(
  ({
    className,
    enableHistoryDivider,
    id,
    endRender,
    disableEditing,
    inPortalThread = false,
    index,
    isLatestItem,
  }) => {
    const topic = useConversationStore((s) => s.context.topicId);

    // Get message from ConversationStore
    const message = useConversationStore(dataSelectors.getDisplayMessageById(id), isEqual);
    const role = message?.role;

    const [editing, isMessageCreating] = useConversationStore((s) => [
      messageStateSelectors.isMessageEditing(id)(s),
      messageStateSelectors.isMessageCreating(id)(s),
    ]);

    const { handleContextMenu } = useChatItemContextMenu({
      editing,
      id,
      inPortalThread,
      topic,
    });

    const onContextMenu = useCallback(
      async (event: MouseEvent<HTMLDivElement>) => {
        if (!role || (role !== 'user' && role !== 'assistant' && role !== 'assistantGroup')) return;

        if (!message) return;

        if (isDesktop) {
          const { electronSystemService } = await import('@/services/electron/system');

          // Get selected text for context menu features like Look Up and Search
          const selection = window.getSelection();
          const selectionText = selection?.toString() || '';

          electronSystemService.showContextMenu('chat', {
            content: message.content,
            hasError: !!message.error,
            messageId: id,
            // For assistantGroup, we treat it as assistant for context menu purposes
            role: message.role === 'assistantGroup' ? 'assistant' : message.role,
            selectionText,
          });

          return;
        }

        handleContextMenu(event);
      },
      [handleContextMenu, id, role, message],
    );

    const renderContent = useCallback(() => {
      switch (role) {
        case 'user': {
          return <UserMessage disableEditing={disableEditing} id={id} index={index} />;
        }

        case 'assistant': {
          return (
            <AssistantMessage
              disableEditing={disableEditing}
              id={id}
              index={index}
              isLatestItem={isLatestItem}
            />
          );
        }

        case 'assistantGroup': {
          return (
            <AssistantGroupMessage
              disableEditing={disableEditing}
              id={id}
              index={index}
              isLatestItem={isLatestItem}
            />
          );
        }

        case 'supervisor': {
          return (
            <SupervisorMessage
              disableEditing={disableEditing}
              id={id}
              index={index}
              isLatestItem={isLatestItem}
            />
          );
        }

        case 'task': {
          return (
            <TaskMessage
              disableEditing={disableEditing}
              id={id}
              index={index}
              isLatestItem={isLatestItem}
            />
          );
        }
        case 'tasks': {
          return <TasksMessage id={id} index={index} />;
        }

        case 'groupTasks': {
          return <GroupTasksMessage id={id} index={index} />;
        }

        case 'agentCouncil': {
          return <AgentCouncilMessage id={id} index={index} />;
        }

        case 'compressedGroup': {
          return <CompressedGroupMessage id={id} index={index} />;
        }

        case 'tool': {
          return <ToolMessage disableEditing={disableEditing} id={id} index={index} />;
        }
      }

      return null;
    }, [role, disableEditing, id, index, isLatestItem]);

    if (!role) return;

    return (
      <>
        {enableHistoryDivider && <History />}
        <Flexbox
          className={cx(styles.message, className, isMessageCreating && styles.loading)}
          data-index={index}
          onContextMenu={onContextMenu}
        >
          <SafeBoundary variant="alert">
            <Suspense fallback={<BubblesLoading />}>{renderContent()}</Suspense>
          </SafeBoundary>
          {endRender}
        </Flexbox>
      </>
    );
  },
  isEqual,
);

MessageItem.displayName = 'MessageItem';

export default MessageItem;
