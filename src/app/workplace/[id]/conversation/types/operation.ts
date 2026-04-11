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

/**
 * Message Operation State
 *
 * Represents the current operation state for a specific message.
 * These states indicate what actions are currently being performed on the message.
 */
export interface MessageOperationState {
  /**
   * Message is continuing generation
   */
  isContinuing: boolean;

  /**
   * Message is being created (sendMessage or createAssistantMessage)
   */
  isCreating: boolean;

  /**
   * Message is being generated (streaming response)
   */
  isGenerating: boolean;

  /**
   * Message is in reasoning/thinking state
   */
  isInReasoning: boolean;

  /**
   * Message generation was interrupted by user
   */
  isInterrupted: boolean;

  /**
   * Message has any operation in progress
   */
  isProcessing: boolean;

  /**
   * Message is being regenerated
   */
  isRegenerating: boolean;
}

/**
 * Tool Operation State
 *
 * Represents the current operation state for a specific tool call.
 */
export interface ToolOperationState {
  /**
   * Tool API is currently being invoked
   */
  isInvoking: boolean;

  /**
   * Tool call is currently streaming
   */
  isStreaming: boolean;
}

/**
 * Operation State
 *
 * External operation state passed into ConversationProvider.
 * This state is managed by the global ChatStore and passed down for reactivity.
 *
 * Design Principles:
 * - Operations are managed globally (supports multiple agents/topics running in parallel)
 * - ConversationStore only reads this state, never modifies it
 * - State is passed externally to ensure proper React reactivity
 */
export interface OperationState {
  /**
   * Get the operation state for a specific message
   */
  getMessageOperationState: (messageId: string) => MessageOperationState;

  /**
   * Get the operation state for a specific tool call
   * @param messageId - The message ID containing the tool call
   * @param index - The index of the tool call within the message
   * @param toolCallId - The tool call ID (optional, for looking up tool message)
   */
  getToolOperationState: (
    messageId: string,
    index: number,
    toolCallId?: string,
  ) => ToolOperationState;

  /**
   * Check if AI is currently generating in this conversation context
   */
  isAIGenerating: boolean;

  /**
   * Check if input should be in loading state (from sendMessage through AI generation)
   */
  isInputLoading: boolean;

  /**
   * Send message error for this context (if any)
   */
  sendMessageError?: string;
}

/**
 * Default empty message operation state
 */
export const DEFAULT_MESSAGE_OPERATION_STATE: MessageOperationState = {
  isContinuing: false,
  isCreating: false,
  isGenerating: false,
  isInReasoning: false,
  isInterrupted: false,
  isProcessing: false,
  isRegenerating: false,
};

/**
 * Default empty tool operation state
 */
export const DEFAULT_TOOL_OPERATION_STATE: ToolOperationState = {
  isInvoking: false,
  isStreaming: false,
};

/**
 * Default empty operation state
 */
export const DEFAULT_OPERATION_STATE: OperationState = {
  getMessageOperationState: () => DEFAULT_MESSAGE_OPERATION_STATE,
  getToolOperationState: () => DEFAULT_TOOL_OPERATION_STATE,
  isAIGenerating: false,
  isInputLoading: false,
  sendMessageError: undefined,
};
