/**
 * 本文件是 AutocodeLLM 项目的原始实现
 *
 * AutocodeLLM 项目许可证:
 * Apache License, Version 2.0
 * Copyright (c) 2026 Jyf0214
 */

import type {
  AgentRuntimeContext,
  AgentState,
  ConversationContext,
  UIChatMessage,
} from '@lobechat/types';
import { useChatStore as originalChatStore } from '@/store/chat/store';

import type { ChatMessage, ModelConfig } from '../types';

/**
 * 流式更新回调
 */
export interface StreamingCallbacks {
  /** 内容更新 */
  onContentUpdate?: (content: string, isComplete?: boolean) => void;
  /** 推理内容更新 */
  onReasoningUpdate?: (reasoning: string) => void;
  /** 工具调用更新 */
  onToolCallsUpdate?: (tools: any[]) => void;
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
 * 执行参数
 */
export interface ExecuteParams {
  userInput: string;
  model: ModelConfig;
  workspaceId: string;
  messages: ChatMessage[];
  parentId?: string;
  callbacks?: StreamingCallbacks;
}

/**
 * Agent执行器适配器
 * 提供两种方式:
 * 1. simpleExecute - 通过API端点的简化执行
 * 2. fullExecute - 直接调用internal_execAgentRuntime的完整执行
 */
export class AgentExecutorAdapter {
  /**
   * 简化的Agent执行方法(通过API端点)
   * 适用于快速集成，无需复杂的store适配
   */
  static async simpleExecute(params: {
    userInput: string;
    model: ModelConfig;
    onContentUpdate?: (content: string) => void;
    onComplete?: () => void;
    onError?: (error: Error) => void;
  }): Promise<void> {
    const { userInput, model, onContentUpdate, onComplete, onError } = params;

    try {
      // 调用现有的API端点
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 处理流式响应
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
        
        if (onContentUpdate) {
          onContentUpdate(content);
        }
      }

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('[AgentExecutorAdapter] Simple execute failed:', error);
      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  /**
   * 完整的Agent执行方法(直接调用internal_execAgentRuntime)
   * 需要正确的store上下文和完整的接口适配
   */
  static async fullExecute(params: ExecuteParams): Promise<ExecutionResult> {
    const { userInput, model, messages, workspaceId, callbacks } = params;

    try {
      // 1. 触发onStart回调
      callbacks?.onStart?.();

      // 2. 转换消息格式
      const uiMessages = this.convertToUIMessages(messages, userInput);

      // 3. 构建ConversationContext
      const conversationContext: ConversationContext = {
        agentId: workspaceId,
        topicId: null,
        threadId: undefined,
      };

      // 4. 使用原店ChatStore执行
      return await this.executeWithOriginalStore({
        messages: uiMessages,
        context: conversationContext,
        model,
        callbacks,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      callbacks?.onError?.(err);
      throw err;
    }
  }

  /**
   * 使用原店ChatStore执行Agent
   * 这是完整集成的关键方法
   */
  private static async executeWithOriginalStore(params: {
    messages: UIChatMessage[];
    context: ConversationContext;
    model: ModelConfig;
    callbacks?: StreamingCallbacks;
  }): Promise<ExecutionResult> {
    const { messages, context, callbacks } = params;

    // 获取最后一条用户消息
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMessage) {
      throw new Error('No user message found');
    }

    // 创建一个Promise来追踪执行结果
    return new Promise((resolve, reject) => {
      try {
        // 注意:这里需要调用originalChatStore的internal_execAgentRuntime
        // 但该方法是私有的,需要通过公开API调用
        
        // 当前方案:使用chat service直接调用
        this.executeViaChatService({
          messages,
          context,
          callbacks,
          resolve,
          reject,
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 通过chatService直接执行
   * 绕过store,直接调用底层服务
   */
  private static async executeViaChatService(params: {
    messages: UIChatMessage[];
    context: ConversationContext;
    callbacks?: StreamingCallbacks;
    resolve: (result: ExecutionResult) => void;
    reject: (error: Error) => void;
  }): Promise<void> {
    const { messages, callbacks, resolve, reject } = params;

    try {
      // 这里需要:
      // 1. 调用 chatService.createAssistantMessageStream
      // 2. 使用 StreamingHandler 处理流式数据
      // 3. 回调通知状态变化
      
      // 由于chatService需要完整的store上下文
      // 我们暂时使用API端点方案作为过渡
      
      // TODO: 实现直接的chatService调用
      // 需要解决:
      // - resolveAgentConfig
      // - createAgentExecutors
      // - Operation管理
      
      reject(new Error('完整集成待实现: 需要chatService适配'));
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * 转换新的ChatMessage格式为旧的UIChatMessage格式
   */
  private static convertToUIMessages(
    messages: ChatMessage[],
    userInput: string
  ): UIChatMessage[] {
    const uiMessages: UIChatMessage[] = messages.map((msg) => ({
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
    })) as UIChatMessage[];

    // 如果最后一条不是用户消息,添加当前输入
    const lastMsg = uiMessages[uiMessages.length - 1];
    if (!lastMsg || lastMsg.role !== 'user') {
      uiMessages.push({
        id: `user-${Date.now()}`,
        role: 'user',
        content: userInput,
        createAt: Date.now(),
        updateAt: Date.now(),
      } as UIChatMessage);
    }

    return uiMessages;
  }

  /**
   * 创建节流函数
   * 用于优化流式更新频率
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    let lastArgs: Parameters<T>;
    let lastCall: NodeJS.Timeout;

    return function (...args: Parameters<T>) {
      lastArgs = args;
      
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
          // 如果节流期间有新调用,立即执行
          if (lastArgs) {
            func(...lastArgs);
            lastArgs = undefined as any;
          }
        }, limit);
      }
    };
  }
}
