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
 * Topic scope types
 * - 'agent': Agent main topic list (default when only agentId)
 * - 'group': Group main topic list (when groupId without agentId)
 * - 'group_agent': Agent topic list within a group (when both groupId and agentId)
 */
export type TopicMapScope = 'agent' | 'group' | 'group_agent';

export interface TopicMapKeyInput {
  /**
   * Agent ID - used for agent sessions or agent within group
   */
  agentId?: string;
  /**
   * Group ID - used for group sessions
   */
  groupId?: string;
  /**
   * Explicit scope override (auto-detected if not provided)
   */
  scope?: TopicMapScope;
}

/**
 * Generate a unique key for topic data map based on session context
 *
 * Auto-detection rules:
 * - If groupId && agentId: scope = 'group_agent'
 * - If groupId only: scope = 'group'
 * - If agentId only: scope = 'agent'
 *
 * Key format:
 * - Agent session: `agent_{agentId}`
 * - Group session: `group_{groupId}`
 * - Agent within group: `group_agent_{groupId}_{agentId}`
 */
export const topicMapKey = (input: TopicMapKeyInput): string => {
  const { agentId, groupId, scope: explicitScope } = input;

  // Auto-detect scope if not explicitly provided
  let scope: TopicMapScope;
  if (explicitScope) {
    scope = explicitScope;
  } else if (groupId && agentId) {
    scope = 'group_agent';
  } else if (groupId) {
    scope = 'group';
  } else {
    scope = 'agent';
  }

  switch (scope) {
    case 'group_agent': {
      return `group_agent_${groupId}_${agentId}`;
    }
    case 'group': {
      return `group_${groupId}`;
    }

    default: {
      return `agent_${agentId}`;
    }
  }
};
