/**
 * 本文件是 AutocodeLLM 项目的原始实现
 *
 * AutocodeLLM 项目许可证：
 * Apache License, Version 2.0
 * Copyright (c) 2026 Jyf0214
 */

import type { ChatMessage, ModelConfig } from '../store/types';

/**
 * 流式更新回调
 */
export interface StreamingCallbacks {
  /** 内容更新 */
  onContentUpdate?: (content: string, isComplete?: boolean) => void;
  /** 推理内容更新 */
  onReasoningUpdate?: (reasoning: string) => void;
  /** 工具调用更新 */
  onToolCallsUpdate?: (tools: unknown[]) => void;
  /** 执行完成 */
  onComplete?: (result: ExecutionResult) => void;
  /** 执行错误 */
  onError?: (error: Error) => void;
  /** 执行开始 */
  onStart?: () => void;
}

/**
 * 执行结果
 */
export interface ExecutionResult {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  cost?: number;
  finishType?: string;
  traceId?: string;
}

/**
 * 简化的Agent执行方法(通过API端点)
 */
export async function simpleExecute(params: {
  userInput: string;
  model: ModelConfig;
  onContentUpdate?: (content: string) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}): Promise<void> {
  const { userInput, model, onContentUpdate, onComplete, onError } = params;

  try {
    const response = await fetch('/api/workspaces/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: userInput }],
        model: model.name,
        provider: model.providerId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${String(response.status)}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let content = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      content += chunk;
      
      onContentUpdate?.(content);
    }

    onComplete?.();
  } catch (error) {
    console.error('[AgentExecutorAdapter] Simple execute failed:', error);
    onError?.(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * 转换新的ChatMessage格式为旧的UIChatMessage格式
 */
export function convertToUIMessages(
  messages: ChatMessage[],
  userInput: string
): Record<string, unknown>[] {
  const uiMessages: Record<string, unknown>[] = messages.map((msg) => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    createAt: msg.createdAt,
    updateAt: msg.updatedAt,
    meta: msg.meta,
    model: msg.model,
    provider: msg.provider,
    tools: msg.tools,
    error: msg.error,
    reasoning: msg.reasoning,
    usage: msg.usage,
  }));

  const lastMsg = uiMessages[uiMessages.length - 1];
  if (!lastMsg || lastMsg.role !== 'user') {
    uiMessages.push({
      id: `user-${String(Date.now())}`,
      role: 'user',
      content: userInput,
      createAt: Date.now(),
      updateAt: Date.now(),
    });
  }

  return uiMessages;
}

/**
 * 创建节流函数
 * 用于优化流式更新频率
 */
export function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastArgs: Parameters<T> | undefined;

  return function (...args: Parameters<T>) {
    lastArgs = args;
    
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          func(...lastArgs);
          lastArgs = undefined;
        }
      }, limit);
    }
  };
}

// 导出以便兼容
export const AgentExecutorAdapter = {
  simpleExecute,
  convertToUIMessages,
  throttle,
};
