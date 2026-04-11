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
 * Agent执行器适配器
 * 将新的chat模块消息格式转换为旧的UIChatMessage格式
 * 并调用现有的streamingExecutor
 */
export class AgentExecutorAdapter {
  /**
   * 执行单Agent对话
   * 
   * @param params 执行参数
   * @returns 执行结果
   */
  static async executeAgentResponse(params: {
    userInput: string;
    model: ModelConfig;
    workspaceId: string;
    messages: ChatMessage[];
    parentId?: string;
  }): Promise<{
    success: boolean;
    assistantMessageId?: string;
    error?: string;
  }> {
    const { userInput, model, messages, workspaceId } = params;

    try {
      // 1. 转换消息格式
      const uiMessages = this.convertToUIMessages(messages, userInput);

      // 2. 构建ConversationContext
      const conversationContext: ConversationContext = {
        agentId: workspaceId, // 使用workspaceId作为agentId
        topicId: null,
        threadId: undefined,
      };

      // 3. 使用原店的ChatStore执行Agent
      const store = originalChatStore.getState();
      
      // 注意:这里需要适配新的store到旧的ChatStore接口
      // 由于接口差异,我们需要创建一个桥接层
      return await this.executeWithBridgedStore({
        messages: uiMessages,
        context: conversationContext,
        model,
        workspaceId,
      });
    } catch (error) {
      console.error('[AgentExecutorAdapter] Execution failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 转换新的ChatMessage格式为旧的UIChatMessage格式
   */
  private static convertToUIMessages(
    messages: ChatMessage[],
    userInput: string
  ): UIChatMessage[] {
    return messages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      createAt: msg.createdAt,
      updateAt: msg.updatedAt,
      // 保留其他必要字段
      meta: msg.meta,
      model: msg.model,
      provider: msg.provider,
      tools: msg.tools,
      error: msg.error,
      reasoning: msg.reasoning,
      usage: msg.usage,
    })) as UIChatMessage[];
  }

  /**
   * 使用桥接Store执行Agent
   * 由于新的chat store和旧的ChatStore接口不同,需要桥接
   */
  private static async executeWithBridgedStore(params: {
    messages: UIChatMessage[];
    context: ConversationContext;
    model: ModelConfig;
    workspaceId: string;
  }): Promise<{
    success: boolean;
    assistantMessageId?: string;
    error?: string;
  }> {
    const { messages, context, model } = params;

    try {
      // 获取最后一条用户消息ID
      const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
      if (!lastUserMessage) {
        throw new Error('No user message found');
      }

      // 创建assistant占位消息
      const assistantMessageId = `assistant-${Date.now()}`;

      // 直接调用原店的internal_execAgentRuntime
      // 注意:这需要正确的store上下文
      const store = originalChatStore;
      
      // 由于接口复杂度,我们采用简化方案:
      // 1. 使用原店store创建消息
      // 2. 调用其execAgentRuntime
      // 3. 监听消息更新来同步到新store
      
      // TODO: 实现完整的桥接逻辑
      // 当前先返回模拟实现,后续需要:
      // 1. 导入streamingExecutor
      // 2. 创建正确的context
      // 3. 调用internal_execAgentRuntime

      return {
        success: true,
        assistantMessageId,
      };
    } catch (error) {
      console.error('[AgentExecutorAdapter] Bridged execution failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 简化的Agent执行方法(用于测试)
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
      // 这里应该调用chatService.createAssistantMessageStream
      // 但需要正确的store上下文
      
      // 临时实现:使用fetch调用API
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
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // 解析SSE或流式数据
        // 这里需要根据实际API响应格式调整
        if (onContentUpdate) {
          onContentUpdate(buffer);
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
}
