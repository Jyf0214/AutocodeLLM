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

import { type ConversationContext as BaseConversationContext } from '@lobechat/types';

/**
 * Extended Conversation Context
 *
 * Extends the base ConversationContext with optional metadata.
 * Used to locate messages in the session → topic → thread hierarchy.
 *
 * Design Principles:
 * - ❌ No `mode` field (avoid hardcoded types)
 * - ✅ Only data coordinates (sessionId/topicId/threadId)
 * - ✅ Scenario is naturally determined by coordinate combination
 */
export interface ConversationContext extends BaseConversationContext {
  /**
   * Metadata (optional, for extension)
   *
   * Can be used to store additional context-specific data:
   * - knowledgeBaseId: For knowledge base chat
   * - agentId: For agent preview chat
   * - preview: Boolean flag for preview mode
   * - etc.
   */
  metadata?: Record<string, any>;
}

/**
 * Helper type: Extract metadata type for better type safety
 */
export type ConversationMetadata<T = Record<string, any>> = T;

/**
 * Common metadata types
 */
export interface KnowledgeBaseMetadata {
  knowledgeBaseId: string;
}

export interface AgentPreviewMetadata {
  agentId: string;
  preview: true;
}
