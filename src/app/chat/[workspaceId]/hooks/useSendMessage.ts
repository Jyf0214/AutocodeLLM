/**
 * 本文件是 AutocodeLLM 项目的原始实现
 *
 * AutocodeLLM 项目许可证：
 * Apache License, Version 2.0
 * Copyright (c) 2026 Jyf0214
 */

import { useCallback } from 'react';
import { message } from 'antd';
import { useChatStore } from '../store';
import type { ChatStore, ModelConfig } from '../store/types';

/**
 * 发送消息Hook
 */
export function useSendMessage() {
  const runSingleAgent = useChatStore((state: ChatStore) => state.runSingleAgent);
  const agents = useChatStore((state: ChatStore) => state.agents);
  const input = useChatStore((state: ChatStore) => state.input);
  const models = useChatStore((state: ChatStore) => state.models);
  const setInputValue = useChatStore((state: ChatStore) => state.setInputValue);

  /**
   * 发送消息
   */
  const send = useCallback(
    async (content: string, model?: ModelConfig) => {
      const trimmed = content.trim();
      if (!trimmed) {
        return false;
      }

      const selectedModel = model ?? models.selected;
      if (!selectedModel) {
        message.warning('请先选择模型');
        return false;
      }

      if (agents.status === 'running') {
        message.warning('Agent正在执行中');
        return false;
      }

      try {
        await runSingleAgent({
          message: trimmed,
          model: selectedModel,
        });

        setInputValue('');

        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '发送消息失败';
        message.error(errorMessage);
        return false;
      }
    },
    [agents.status, models.selected, runSingleAgent, setInputValue]
  );

  /**
   * 取消发送
   */
  const cancel = useCallback(() => {
    message.info('取消功能待实现');
  }, []);

  return {
    send,
    cancel,
    isSending: agents.status === 'running',
    canSend: input.value.trim().length > 0 && models.selected !== null && agents.status !== 'running',
  };
}
