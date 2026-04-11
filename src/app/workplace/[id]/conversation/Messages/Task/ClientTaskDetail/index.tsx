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

import { type TaskDetail } from '@lobechat/types';
import { ThreadStatus } from '@lobechat/types';
import { memo, useMemo } from 'react';

import BubblesLoading from '@/components/BubblesLoading';
import { useChatStore } from '@/store/chat';
import { displayMessageSelectors } from '@/store/chat/selectors';
import { messageMapKey } from '@/store/chat/utils/messageMapKey';

import { TaskMessages } from '../../Tasks/shared';
import InitializingState from './InitializingState';

interface ClientTaskDetailProps {
  /** Agent ID from the task message (use task's agentId, not activeAgentId) */
  agentId?: string;
  content?: string;
  /** Group ID from the task message (use task's groupId, not activeGroupId) */
  groupId?: string;
  messageId: string;
  taskDetail?: TaskDetail;
}

const ClientTaskDetail = memo<ClientTaskDetailProps>(
  ({ agentId: propAgentId, groupId, taskDetail }) => {
    const threadId = taskDetail?.threadId;
    const isExecuting = taskDetail?.status === ThreadStatus.Processing;

    // Use task message's agentId to query with the correct SubAgent ID that created the thread
    // Fall back to activeAgentId if task message doesn't have agentId (shouldn't happen normally)
    const [activeAgentId, activeTopicId, useFetchMessages] = useChatStore((s) => [
      s.activeAgentId,
      s.activeTopicId,
      s.useFetchMessages,
    ]);

    const agentId = propAgentId || activeAgentId;

    const threadContext = useMemo(
      () => ({
        agentId,
        groupId,
        scope: 'thread' as const,
        threadId,
        topicId: activeTopicId,
      }),
      [agentId, groupId, activeTopicId, threadId],
    );

    const threadMessageKey = useMemo(
      () => (threadId ? messageMapKey(threadContext) : null),
      [threadId],
    );

    // Fetch thread messages (skip when executing - messages come from real-time updates)
    useFetchMessages(threadContext, isExecuting);

    // Get thread messages from store using selector
    const threadMessages = useChatStore((s) =>
      threadMessageKey
        ? displayMessageSelectors.getDisplayMessagesByKey(threadMessageKey)(s)
        : undefined,
    );

    if (!threadMessages) return <BubblesLoading />;

    // Find the assistantGroup message which contains the children blocks
    const assistantGroupMessage = threadMessages.find((item) => item.role === 'assistantGroup');
    const childrenCount = assistantGroupMessage?.children?.length ?? 0;

    // Get model/provider from assistantGroup message
    const model = assistantGroupMessage?.model;
    const provider = assistantGroupMessage?.provider;

    // Initializing state: no status yet (task just created, waiting for client execution)
    if (threadMessages.length === 0 || !assistantGroupMessage?.children || childrenCount === 0) {
      return <InitializingState />;
    }

    return (
      <TaskMessages
        duration={taskDetail?.duration}
        isProcessing={isExecuting}
        messages={threadMessages}
        model={model ?? undefined}
        provider={provider ?? undefined}
        startTime={assistantGroupMessage.createdAt}
        totalCost={taskDetail?.totalCost}
      />
    );
  },
);

ClientTaskDetail.displayName = 'ClientTaskDetail';

export default ClientTaskDetail;
