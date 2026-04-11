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

import {
  DEFAULT_AVATAR,
  DEFAULT_CHAT_GROUP_CHAT_CONFIG,
  DEFAULT_CHAT_GROUP_META_CONFIG,
} from '@lobechat/const';
import { type AgentGroupDetail, type AgentGroupMember } from '@lobechat/types';

import { type ChatGroupState } from '../initialState';
import { type ChatGroupStore } from '../store';
import { agentGroupByIdSelectors } from './byId';

const activeGroupId = (s: ChatGroupState): string | undefined => s.activeGroupId;

const currentGroup = (s: ChatGroupStore): AgentGroupDetail | undefined => {
  const groupId = activeGroupId(s);
  return groupId ? agentGroupByIdSelectors.groupById(groupId)(s) : undefined;
};

const currentGroupConfig = (s: ChatGroupStore) => {
  const groupId = activeGroupId(s);
  return groupId ? agentGroupByIdSelectors.groupConfig(groupId)(s) : DEFAULT_CHAT_GROUP_CHAT_CONFIG;
};

const currentGroupOpeningMessage = (s: ChatGroupStore): string | undefined => {
  const config = currentGroupConfig(s);
  return config?.openingMessage;
};

const currentGroupOpeningQuestions = (s: ChatGroupStore): string[] => {
  const config = currentGroupConfig(s);
  return config?.openingQuestions || [];
};

const currentGroupMeta = (s: ChatGroupStore) => {
  const groupId = activeGroupId(s);
  return groupId ? agentGroupByIdSelectors.groupMeta(groupId)(s) : DEFAULT_CHAT_GROUP_META_CONFIG;
};

const currentGroupAgents = (s: ChatGroupStore): AgentGroupMember[] => {
  const groupId = activeGroupId(s);
  return groupId ? agentGroupByIdSelectors.groupAgents(groupId)(s) : [];
};

const currentGroupMembers = (s: ChatGroupStore): AgentGroupMember[] => {
  const groupId = activeGroupId(s);
  return groupId ? agentGroupByIdSelectors.groupMembers(groupId)(s) : [];
};

const currentGroupMemberAvatars = (s: ChatGroupStore) => {
  const members = currentGroupMembers(s);
  return members.map((agent) => ({
    avatar: agent.avatar || DEFAULT_AVATAR,
    background: agent.backgroundColor || undefined,
  }));
};

const getAllGroups = (s: ChatGroupState): AgentGroupDetail[] => Object.values(s.groupMap);

/**
 * Check if the current active group is loading
 * Uses groupMap pattern instead of manual loading flag
 */
const isGroupsInit = (s: ChatGroupState): boolean =>
  !s.activeGroupId || !s.groupMap[s.activeGroupId];

const isGroupsInitialized = (s: ChatGroupState): boolean => s.groupsInit;

export const currentSelectors = {
  activeGroupId,
  currentGroup,
  currentGroupAgents,
  currentGroupConfig,
  currentGroupMemberAvatars,
  currentGroupMembers,
  currentGroupMeta,
  currentGroupOpeningMessage,
  currentGroupOpeningQuestions,
  getAllGroups,
  isGroupsInit,
  isGroupsInitialized,
};
