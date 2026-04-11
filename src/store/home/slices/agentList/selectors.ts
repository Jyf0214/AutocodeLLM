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

import { type SidebarAgentItem, type SidebarGroup } from '@/database/repositories/home';
import { type HomeStore } from '@/store/home/store';

/**
 * Get all pinned agents
 */
const pinnedAgents = (s: HomeStore): SidebarAgentItem[] => s.pinnedAgents;

/**
 * Get all agent groups (folders)
 */
const agentGroups = (s: HomeStore): SidebarGroup[] => s.agentGroups;

/**
 * Get all ungrouped agents
 */
const ungroupedAgents = (s: HomeStore): SidebarAgentItem[] => s.ungroupedAgents;

/**
 * Limit ungrouped agents for sidebar display based on page size
 */
const ungroupedAgentsLimited =
  (pageSize: number) =>
  (s: HomeStore): SidebarAgentItem[] =>
    s.ungroupedAgents.slice(0, pageSize);

/**
 * Get ungrouped agents count
 */
const ungroupedAgentsCount = (s: HomeStore): number => s.ungroupedAgents.length;

/**
 * Check if agent list is initialized
 */
const isAgentListInit = (s: HomeStore): boolean => s.isAgentListInit;

/**
 * Get all agents (pinned + grouped + ungrouped)
 */
const allAgents = (s: HomeStore): SidebarAgentItem[] => {
  const groupedAgents = s.agentGroups.flatMap((g) => g.items);
  return [...s.pinnedAgents, ...groupedAgents, ...s.ungroupedAgents];
};

/**
 * Get agent by id
 */
const getAgentById =
  (id: string) =>
  (s: HomeStore): SidebarAgentItem | undefined => {
    return allAgents(s).find((a) => a.id === id);
  };

/**
 * Check if there are any custom agents (non-empty list)
 */
const hasCustomAgents = (s: HomeStore): boolean => {
  return allAgents(s).length > 0;
};

/**
 * Get total agent count
 */
const agentCount = (s: HomeStore): number => {
  return allAgents(s).length;
};

export const homeAgentListSelectors = {
  agentCount,
  agentGroups,
  allAgents,
  getAgentById,
  hasCustomAgents,
  isAgentListInit,
  pinnedAgents,
  ungroupedAgents,
  ungroupedAgentsCount,
  ungroupedAgentsLimited,
};
