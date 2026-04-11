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
import type { ModelConfig } from '../store';

/**
 * 发送消息Hook
 */
export function useSendMessage() {
  const {
    runSingleAgent,
    agents,
    input,
    models,
    setInputValue,
  } = useChatStore();

  /**
   * 发送消息
   */
  const send = useCallback(
    async (content: string, model?: ModelConfig) => {
      const trimmed = content.trim();
      if (!trimmed) {
        return;
      }

      const selectedModel = model || models.selected;
      if (!selectedModel) {
        message.warning('请先选择模型');
        return;
      }

      if (agents.status === 'running') {
        message.warning('Agent正在执行中');
        return;
      }

      try {
        // 执行Agent
        await runSingleAgent({
          message: trimmed,
          model: selectedModel,
        });

        // 清空输入
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
    // TODO: 实现取消逻辑
    message.info('取消功能待实现');
  }, []);

  return {
    send,
    cancel,
    isSending: agents.status === 'running',
    canSend: input.value.trim().length > 0 && models.selected !== null && agents.status !== 'running',
  };
}
