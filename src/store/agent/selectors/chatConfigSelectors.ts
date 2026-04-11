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

import { type LobeAgentChatConfig } from '@lobechat/types';

import { type AgentStoreState } from '@/store/agent/initialState';

import { chatConfigByIdSelectors } from './chatConfigByIdSelectors';

// ============ Current Agent Selectors (reuses chatConfigByIdSelectors) ============ //

const currentChatConfig = (s: AgentStoreState): LobeAgentChatConfig =>
  chatConfigByIdSelectors.getChatConfigById(s.activeAgentId || '')(s);

const agentSearchMode = (s: AgentStoreState) =>
  chatConfigByIdSelectors.getSearchModeById(s.activeAgentId || '')(s);

const isAgentEnableSearch = (s: AgentStoreState) =>
  chatConfigByIdSelectors.isEnableSearchById(s.activeAgentId || '')(s);

const useModelBuiltinSearch = (s: AgentStoreState) =>
  chatConfigByIdSelectors.getUseModelBuiltinSearchById(s.activeAgentId || '')(s);

const searchFCModel = (s: AgentStoreState) =>
  chatConfigByIdSelectors.getSearchFCModelById(s.activeAgentId || '')(s);

// Use raw chatConfig value, not the selector with business logic that may force false
const enableHistoryCount = (s: AgentStoreState) =>
  chatConfigByIdSelectors.getChatConfigById(s.activeAgentId || '')(s).enableHistoryCount;

const historyCount = (s: AgentStoreState): number =>
  chatConfigByIdSelectors.getHistoryCountById(s.activeAgentId || '')(s);

const isMemoryToolEnabled = (s: AgentStoreState) =>
  chatConfigByIdSelectors.isMemoryToolEnabledById(s.activeAgentId || '')(s);

const isLocalSystemEnabled = (s: AgentStoreState) =>
  chatConfigByIdSelectors.isLocalSystemEnabledById(s.activeAgentId || '')(s);

const isCloudSandboxEnabled = (s: AgentStoreState) =>
  chatConfigByIdSelectors.getRuntimeModeById(s.activeAgentId || '')(s) === 'cloud';

const skillActivateMode = (s: AgentStoreState) =>
  chatConfigByIdSelectors.getSkillActivateModeById(s.activeAgentId || '')(s);

const enableHistoryDivider =
  (historyLength: number, currentIndex: number) => (s: AgentStoreState) => {
    const config = currentChatConfig(s);

    return (
      enableHistoryCount(s) &&
      historyLength > (config.historyCount ?? 0) &&
      config.historyCount === historyLength - currentIndex
    );
  };

export const agentChatConfigSelectors = {
  agentSearchMode,
  currentChatConfig,
  enableHistoryCount,
  enableHistoryDivider,
  historyCount,
  isAgentEnableSearch,
  isCloudSandboxEnabled,
  isLocalSystemEnabled,
  isMemoryToolEnabled,
  searchFCModel,
  skillActivateMode,
  useModelBuiltinSearch,
};
