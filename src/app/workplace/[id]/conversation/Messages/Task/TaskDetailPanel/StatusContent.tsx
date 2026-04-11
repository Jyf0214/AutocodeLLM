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

import { memo } from 'react';

import { useChatStore } from '@/store/chat';
import { type TaskDetail } from '@/types/index';
import { ThreadStatus } from '@/types/index';

import {
  ErrorState,
  InitializingState,
  isProcessingStatus,
  TaskMessages,
} from '../../Tasks/shared';

interface StatusContentProps {
  content?: string;
  messageId: string;
  taskDetail?: TaskDetail;
}

const StatusContent = memo<StatusContentProps>(({ taskDetail, messageId }) => {
  const status = taskDetail?.status;
  const threadId = taskDetail?.threadId;
  const isProcessing = isProcessingStatus(status);

  // Get polling hook - poll for task status to get messages
  const [useEnablePollingTaskStatus, operations] = useChatStore((s) => [
    s.useEnablePollingTaskStatus,
    s.operations,
  ]);

  // Check if exec_async_task is already polling for this message
  const hasActiveOperationPolling = Object.values(operations).some(
    (op) =>
      op.status === 'running' &&
      op.type === 'execAgentRuntime' &&
      op.context?.messageId === messageId,
  );

  // Enable polling when task has threadId and no active operation is polling
  // For completed tasks, this will fetch messages once (no refreshInterval needed)
  const shouldPoll = !!threadId && !hasActiveOperationPolling;
  const { data } = useEnablePollingTaskStatus(threadId, messageId, shouldPoll);

  const messages = data?.messages;

  // Initializing state: no status yet (task just created, waiting for backend)
  if (!status) {
    return <InitializingState />;
  }

  // Processing or Completed state with messages
  if (messages && messages.length > 0) {
    return (
      <>
        <TaskMessages
          duration={taskDetail?.duration}
          isProcessing={isProcessing}
          messages={messages}
          startTime={taskDetail?.startedAt ? new Date(taskDetail.startedAt).getTime() : undefined}
          totalCost={taskDetail?.totalCost}
        />
        {
          // Error states: Failed, Cancel
          (status === ThreadStatus.Failed || status === ThreadStatus.Cancel) && (
            <ErrorState taskDetail={taskDetail!} />
          )
        }
      </>
    );
  }

  // Still loading messages
  return <InitializingState />;
});

StatusContent.displayName = 'StatusContent';

export default StatusContent;
