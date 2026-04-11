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

import { type MetaData } from '@lobechat/types';
import { useMemo } from 'react';

import { useAgentStore } from '@/store/agent';
import { agentSelectors } from '@/store/agent/selectors';

import { contextSelectors, useConversationStore } from '../store';

const LOBE_AI_TITLE = 'Lobe AI';

/**
 * Hook to get agent meta data for a specific agent or the current conversation.
 * Handles special cases for builtin agents (inbox, page agent, agent builder)
 * by showing Lobe AI title instead of the agent's own meta.
 * Avatar is now returned from the backend (merged from builtin-agents package).
 *
 * @param messageAgentId - Optional agent ID from the message. If provided, uses this agent's meta.
 *                         Falls back to the current conversation's agent if not provided.
 */
export const useAgentMeta = (messageAgentId?: string | null): MetaData => {
  const contextAgentId = useConversationStore(contextSelectors.agentId);
  // Use message's agentId if provided, otherwise fallback to context agentId
  const agentId = messageAgentId || contextAgentId;
  const agentMeta = useAgentStore(agentSelectors.getAgentMetaById(agentId));
  const builtinAgentIdMap = useAgentStore((s) => s.builtinAgentIdMap);

  return useMemo(() => {
    // Check if the current agent is a builtin agent
    const builtinAgentIds = Object.values(builtinAgentIdMap);
    const isBuiltinAgent = builtinAgentIds.includes(agentId);

    if (isBuiltinAgent) {
      // Use DB-stored title if customized (e.g. via onboarding), otherwise fallback to Lobe AI
      return { ...agentMeta, title: agentMeta.title || LOBE_AI_TITLE };
    }

    return agentMeta;
  }, [agentId, agentMeta, builtinAgentIdMap]);
};

/**
 * Hook to check if the current agent is a builtin agent
 */
export const useIsBuiltinAgent = (): boolean => {
  const agentId = useConversationStore(contextSelectors.agentId);
  const builtinAgentIdMap = useAgentStore((s) => s.builtinAgentIdMap);

  return useMemo(() => {
    const builtinAgentIds = Object.values(builtinAgentIdMap);
    return builtinAgentIds.includes(agentId);
  }, [agentId, builtinAgentIdMap]);
};
