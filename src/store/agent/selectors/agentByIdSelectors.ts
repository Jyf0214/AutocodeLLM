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

import { DEFAULT_PROVIDER } from '@lobechat/business-const';
import { DEFAULT_MODEL, DEFAUTT_AGENT_TTS_CONFIG } from '@lobechat/const';
import { type AgentBuilderContext } from '@lobechat/context-engine';
import { type AgentMode, type LobeAgentTTSConfig, type RuntimeEnvConfig } from '@lobechat/types';

import { type AgentStoreState } from '../initialState';
import { agentSelectors } from './selectors';

/**
 * Selectors that get agent config by agentId parameter.
 * Used in ChatInput components where agentId is passed as prop.
 */

const getAgentModelById =
  (agentId: string) =>
  (s: AgentStoreState): string =>
    agentSelectors.getAgentConfigById(agentId)(s)?.model || DEFAULT_MODEL;

const getAgentModelProviderById =
  (agentId: string) =>
  (s: AgentStoreState): string =>
    agentSelectors.getAgentConfigById(agentId)(s)?.provider || DEFAULT_PROVIDER;

const getAgentPluginsById =
  (agentId: string) =>
  (s: AgentStoreState): string[] =>
    agentSelectors.getAgentConfigById(agentId)(s)?.plugins || [];

const getAgentSystemRoleById =
  (agentId: string) =>
  (s: AgentStoreState): string | undefined =>
    agentSelectors.getAgentConfigById(agentId)(s)?.systemRole;

const getAgentTTSById =
  (agentId: string) =>
  (s: AgentStoreState): LobeAgentTTSConfig =>
    agentSelectors.getAgentConfigById(agentId)(s)?.tts || DEFAUTT_AGENT_TTS_CONFIG;

const getAgentFilesById = (agentId: string) => (s: AgentStoreState) =>
  agentSelectors.getAgentConfigById(agentId)(s)?.files || [];

const getAgentKnowledgeBasesById = (agentId: string) => (s: AgentStoreState) =>
  agentSelectors.getAgentConfigById(agentId)(s)?.knowledgeBases || [];

const isAgentConfigLoadingById = (agentId: string) => (s: AgentStoreState) =>
  !agentId || !s.agentMap[agentId];

/**
 * Get agent mode by agentId
 * Now reads from chatConfig.agentMode and chatConfig.enableAgentMode
 */
const getAgentModeById =
  (agentId: string) =>
  (s: AgentStoreState): AgentMode | undefined => {
    const config = agentSelectors.getAgentConfigById(agentId)(s);

    // Fallback: convert enableAgentMode to mode
    if (config?.enableAgentMode) {
      return 'auto';
    }

    return undefined;
  };

/**
 * Check if agent mode is enabled by agentId
 * Supports backward compatibility with deprecated enableAgentMode field
 */
const getAgentEnableModeById =
  (agentId: string) =>
  (s: AgentStoreState): boolean => {
    const mode = getAgentModeById(agentId)(s);
    return mode !== undefined;
  };

/**
 * Get runtime env config by agentId
 * Now reads from chatConfig.runtimeEnv
 */
const getAgentRuntimeEnvConfigById =
  (agentId: string) =>
  (s: AgentStoreState): RuntimeEnvConfig | undefined =>
    agentSelectors.getAgentConfigById(agentId)(s)?.chatConfig?.runtimeEnv;

/**
 * Get working directory by agentId
 */
const getAgentWorkingDirectoryById =
  (agentId: string) =>
  (s: AgentStoreState): string | undefined =>
    getAgentRuntimeEnvConfigById(agentId)(s)?.workingDirectory;

/**
 * Get agent builder context by agentId
 * Used for injecting current agent config/meta into Agent Builder context
 */
const getAgentBuilderContextById =
  (agentId: string) =>
  (s: AgentStoreState): AgentBuilderContext => {
    const config = agentSelectors.getAgentConfigById(agentId)(s);
    const meta = agentSelectors.getAgentMetaById(agentId)(s);

    return {
      config: {
        chatConfig: config?.chatConfig,
        model: config?.model,
        openingMessage: config?.openingMessage,
        openingQuestions: config?.openingQuestions,
        params: config?.params,
        plugins: config?.plugins,
        provider: config?.provider,
        systemRole: config?.systemRole,
      },
      meta,
    };
  };

/**
 * Get full agent data by agentId
 * Returns the complete agent object including metadata fields like updatedAt
 */
const getAgentById = (agentId: string) => (s: AgentStoreState) => s.agentMap[agentId];

export const agentByIdSelectors = {
  getAgentBuilderContextById,
  getAgentById,
  getAgentConfigById: agentSelectors.getAgentConfigById,
  getAgentEnableModeById,
  getAgentFilesById,
  getAgentKnowledgeBasesById,
  getAgentRuntimeEnvConfigById,
  getAgentModeById,
  getAgentModelById,
  getAgentModelProviderById,
  getAgentPluginsById,
  getAgentSystemRoleById,
  getAgentTTSById,
  getAgentWorkingDirectoryById,
  isAgentConfigLoadingById,
};
