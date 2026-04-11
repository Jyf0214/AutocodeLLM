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

import { type AgentGroupDetail, type AgentGroupMember, type AgentItem } from '@lobechat/types';

import { DEFAULT_CHAT_GROUP_CHAT_CONFIG, DEFAULT_CHAT_GROUP_META_CONFIG } from '@/const/settings';
import { merge } from '@/utils/merge';

import { type ChatGroupState } from '../initialState';
import { type ChatGroupStore } from '../store';

const groupById =
  (id: string) =>
  (s: ChatGroupState): AgentGroupDetail | undefined =>
    s.groupMap[id];

const groupConfig = (groupId: string) => (s: ChatGroupStore) => {
  const group = groupById(groupId)(s);
  return merge(DEFAULT_CHAT_GROUP_CHAT_CONFIG, group?.config || {});
};

const groupMeta = (groupId: string) => (s: ChatGroupStore) => {
  const group = groupById(groupId)(s);
  return merge(DEFAULT_CHAT_GROUP_META_CONFIG, {
    avatar: group?.avatar || undefined,
    backgroundColor: group?.backgroundColor || undefined,
    description: group?.description || '',
    marketIdentifier: group?.marketIdentifier || undefined,
    title: group?.title || '',
  });
};

const groupAgents =
  (groupId: string) =>
  (s: ChatGroupStore): AgentGroupMember[] => {
    const group = groupById(groupId)(s);
    return group?.agents || [];
  };

/**
 * Get participant members in a group (excluding supervisor)
 * Used for UI display where supervisor should not be shown in the member list
 */
const groupMembers =
  (groupId: string) =>
  (s: ChatGroupStore): AgentGroupMember[] => {
    const group = groupById(groupId)(s);
    const agents = group?.agents || [];
    return agents.filter((agent) => !agent.isSupervisor);
  };

const groupAgentCount =
  (groupId: string) =>
  (s: ChatGroupStore): number =>
    groupAgents(groupId)(s).length;

const groupMemberCount =
  (groupId: string) =>
  (s: ChatGroupStore): number =>
    groupMembers(groupId)(s).length;

const agentByIdFromGroup =
  (groupId: string, agentId: string) =>
  (s: ChatGroupStore): AgentItem | undefined => {
    const agents = groupAgents(groupId)(s);
    return agents.find((agent) => agent.id === agentId);
  };

/**
 * Find a group by its supervisor agent ID
 * Iterates through all groups to find one where supervisorAgentId matches
 */
const groupBySupervisorAgentId =
  (supervisorAgentId: string) =>
  (s: ChatGroupStore): AgentGroupDetail | undefined => {
    return Object.values(s.groupMap).find((group) => group.supervisorAgentId === supervisorAgentId);
  };

export const agentGroupByIdSelectors = {
  agentByIdFromGroup,
  groupAgentCount,
  groupAgents,
  groupById,
  groupBySupervisorAgentId,
  groupConfig,
  groupMemberCount,
  groupMembers,
  groupMeta,
};
