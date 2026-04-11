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

import { type ThreadStatus } from '@lobechat/types';
import { useEffect, useState } from 'react';

import { useChatStore } from '@/store/chat';

import { isProcessingStatus } from './utils';

interface UseTaskPollingParams {
  messageId: string;
  status: ThreadStatus | undefined;
  threadId: string | undefined;
}

export const useTaskPolling = ({ messageId, threadId, status }: UseTaskPollingParams) => {
  const isProcessing = isProcessingStatus(status);
  const [hasFetched, setHasFetched] = useState(false);

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

  // Enable polling when:
  // 1. Has threadId
  // 2. Not already being polled by an active operation
  // 3. Either hasn't fetched yet (initial fetch) or is still processing (continuous polling)
  const shouldPoll = !!threadId && !hasActiveOperationPolling && (!hasFetched || isProcessing);
  const { data } = useEnablePollingTaskStatus(threadId, messageId, shouldPoll);

  // Mark as fetched when we get data
  useEffect(() => {
    if (data?.taskDetail && !hasFetched) {
      setHasFetched(true);
    }
  }, [data?.taskDetail, hasFetched]);

  return { isProcessing };
};
