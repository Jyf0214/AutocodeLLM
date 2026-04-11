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

import { BUILTIN_AGENT_SLUGS } from '@lobechat/builtin-agents';
import { INBOX_SESSION_ID } from '@lobechat/const';

import { type AgentStoreState } from '@/store/agent/initialState';

/**
 * Get builtin agent ID by slug
 */
const getBuiltinAgentId = (slug: string) => (s: AgentStoreState) => s.builtinAgentIdMap[slug];

/**
 * Check if a builtin agent is initialized by slug
 */
const isBuiltinAgentInit = (slug: string) => (s: AgentStoreState) => !!s.builtinAgentIdMap[slug];

/**
 * Get page agent ID (convenience selector)
 */
const pageAgentId = (s: AgentStoreState) => s.builtinAgentIdMap[BUILTIN_AGENT_SLUGS.pageAgent];

/**
 * Get agent builder ID (convenience selector)
 */
const agentBuilderId = (s: AgentStoreState) =>
  s.builtinAgentIdMap[BUILTIN_AGENT_SLUGS.agentBuilder];

/**
 * Get group agent builder ID (convenience selector)
 */
const groupAgentBuilderId = (s: AgentStoreState) =>
  s.builtinAgentIdMap[BUILTIN_AGENT_SLUGS.groupAgentBuilder];

/**
 * Get inbox agent id from builtinAgentIdMap
 */
const inboxAgentId = (s: AgentStoreState) => s.builtinAgentIdMap[INBOX_SESSION_ID];

/**
 * Check if inbox agent is initialized
 */
const isInboxAgentConfigInit = (s: AgentStoreState) => !!s.builtinAgentIdMap[INBOX_SESSION_ID];

/**
 * Check if current active agent is the inbox agent
 */
const isInboxAgent = (s: AgentStoreState) => {
  const id = inboxAgentId(s);
  return !!id && s.activeAgentId === id;
};

export const builtinAgentSelectors = {
  agentBuilderId,
  getBuiltinAgentId,
  groupAgentBuilderId,
  inboxAgentId,
  isBuiltinAgentInit,
  isInboxAgent,
  isInboxAgentConfigInit,
  pageAgentId,
};
