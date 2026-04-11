/**
 * 本文件是 AutocodeLLM 项目的原始实现
 *
 * AutocodeLLM 项目许可证：
 * Apache License, Version 2.0
 * Copyright (c) 2026 Jyf0214
 */

import { useCallback, useRef } from 'react';
import { message } from 'antd';
import { useChatStore } from '../store';
import type { ModelConfig } from '../store/types';

/**
 * 发送消息 Hook
 */
export function useSendMessage() {
  const storeRef = useRef(useChatStore.getState());

  /**
   * 发送消息
   */
  const send = useCallback(
    async (content: string, model?: ModelConfig) => {
      const store = storeRef.current;
      const trimmed = content.trim();
      if (!trimmed) return false;

      const selectedModel = model ?? store.models.selected;
      if (!selectedModel) {
        message.warning('请先选择模型');
        return false;
      }

      if (store.agents.status === 'running') {
        message.warning('Agent正在执行中');
        return false;
      }

      try {
        await store.runSingleAgent({ message: trimmed, model: selectedModel });
        store.setInputValue('');
        return true;
      } catch (error) {
        message.error(error instanceof Error ? error.message : '发送消息失败');
        return false;
      }
    },
    []
  );

  const cancel = useCallback(() => {
    message.info('取消功能待实现');
  }, []);

  const store = useChatStore();
  return {
    send,
    cancel,
    isSending: store.agents.status === 'running',
    canSend: store.input.value.trim().length > 0 && store.models.selected !== null && store.agents.status !== 'running',
  };
}
