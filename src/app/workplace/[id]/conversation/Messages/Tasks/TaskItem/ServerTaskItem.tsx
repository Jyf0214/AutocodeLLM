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

import { AccordionItem, Block } from '@lobehub/ui';
import { memo, useMemo, useState } from 'react';

import { type UIChatMessage } from '@/types/index';
import { ThreadStatus } from '@/types/index';

import { TaskContent } from '../shared';
import { type TaskMetrics } from './TaskTitle';
import TaskTitle from './TaskTitle';

interface ServerTaskItemProps {
  item: UIChatMessage;
}

const ServerTaskItem = memo<ServerTaskItemProps>(({ item }) => {
  const { id, metadata, taskDetail, tasks } = item;
  const [expanded, setExpanded] = useState(false);

  const title = taskDetail?.title || metadata?.taskTitle;
  const status = taskDetail?.status;
  const threadId = taskDetail?.threadId;

  const isCompleted = status === ThreadStatus.Completed;
  const isError = status === ThreadStatus.Failed || status === ThreadStatus.Cancel;

  // Build metrics for TaskTitle (only for completed/error states)
  const metrics: TaskMetrics | undefined = useMemo(() => {
    if (isCompleted || isError) {
      return {
        duration: taskDetail?.duration,
        steps: taskDetail?.totalSteps,
        toolCalls: taskDetail?.totalToolCalls,
      };
    }
    return undefined;
  }, [
    isCompleted,
    isError,
    taskDetail?.duration,
    taskDetail?.totalSteps,
    taskDetail?.totalToolCalls,
  ]);

  return (
    <AccordionItem
      expand={expanded}
      itemKey={id}
      paddingBlock={4}
      paddingInline={4}
      title={<TaskTitle metrics={metrics} status={status} title={title} />}
      onExpandChange={setExpanded}
    >
      <Block gap={16} padding={12} style={{ marginBlock: 8 }} variant={'outlined'}>
        {expanded && (
          <TaskContent
            id={id}
            isError={isError}
            messages={tasks}
            status={status}
            taskDetail={taskDetail}
            threadId={threadId}
          />
        )}
      </Block>
    </AccordionItem>
  );
}, Object.is);

ServerTaskItem.displayName = 'ServerTaskItem';

export default ServerTaskItem;
