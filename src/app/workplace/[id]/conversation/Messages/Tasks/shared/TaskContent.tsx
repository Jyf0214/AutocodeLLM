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

import { type TaskDetail, type ThreadStatus, type UIChatMessage } from '@lobechat/types';
import { Flexbox, Text } from '@lobehub/ui';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import BubblesLoading from '@/components/BubblesLoading';

import ErrorState from './ErrorState';
import InitializingState from './InitializingState';
import TaskMessages from './TaskMessages';
import { useTaskPolling } from './useTaskPolling';

export interface TaskContentProps {
  id: string;
  isError: boolean;
  messages: UIChatMessage[] | undefined;
  status: ThreadStatus | undefined;
  taskDetail: TaskDetail | undefined;
  threadId: string | undefined;
}

const TaskContent = memo<TaskContentProps>(
  ({ id, threadId, status, messages, taskDetail, isError }) => {
    const { t } = useTranslation('chat');
    const { isProcessing } = useTaskPolling({
      messageId: id,
      status,
      threadId,
    });

    // No messages yet
    if (!messages || messages.length === 0) {
      // Still processing: show full initializing state
      if (isProcessing) {
        return <InitializingState />;
      }

      // Already completed but loading messages: show simple loading
      return (
        <Flexbox horizontal align="center" gap={4}>
          <BubblesLoading />
          <Text type="secondary">{t('task.status.fetchingDetails')}</Text>
        </Flexbox>
      );
    }

    return (
      <>
        <TaskMessages
          duration={taskDetail?.duration}
          isProcessing={isProcessing}
          messages={messages}
          startTime={taskDetail?.startedAt ? new Date(taskDetail.startedAt).getTime() : undefined}
          totalCost={taskDetail?.totalCost}
        />
        {/* Error states: Failed, Cancel */}
        {isError && taskDetail && <ErrorState taskDetail={taskDetail} />}
      </>
    );
  },
);

TaskContent.displayName = 'TaskContent';

export default TaskContent;
