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

import { isProviderDisableBrowserRequest } from 'model-bank/modelProviders';

import { type AIProviderStoreState } from '@/store/aiInfra/initialState';
import { type AiProviderRuntimeConfig } from '@/types/aiProvider';
import { AiProviderSourceEnum } from '@/types/aiProvider';
import { type GlobalLLMProviderKey } from '@/types/user/settings';

// List
const enabledAiProviderList = (s: AIProviderStoreState) =>
  s.aiProviderList.filter((item) => item.enabled).sort((a, b) => a.sort! - b.sort!);

const disabledAiProviderList = (s: AIProviderStoreState) =>
  s.aiProviderList.filter((item) => !item.enabled && item.source !== AiProviderSourceEnum.Custom);

const disabledCustomAiProviderList = (s: AIProviderStoreState) =>
  s.aiProviderList.filter((item) => !item.enabled && item.source === AiProviderSourceEnum.Custom);

const enabledImageModelList = (s: AIProviderStoreState) => s.enabledImageModelList || [];

const enabledVideoModelList = (s: AIProviderStoreState) => s.enabledVideoModelList || [];

const isProviderEnabled = (id: string) => (s: AIProviderStoreState) =>
  enabledAiProviderList(s).some((i) => i.id === id);

const isProviderLoading = (id: string) => (s: AIProviderStoreState) =>
  s.aiProviderLoadingIds.includes(id);

// Detail

/**
 * Get provider detail by id from the cache map
 */
const providerDetailById = (id: string) => (s: AIProviderStoreState) => s.aiProviderDetailMap[id];

/**
 * Get active provider config from the cache map
 */
const activeProviderConfig = (s: AIProviderStoreState) =>
  s.activeAiProvider ? s.aiProviderDetailMap[s.activeAiProvider] : undefined;

/**
 * Check if provider config is loading (data not yet in cache)
 */
const isAiProviderConfigLoading = (id: string) => (s: AIProviderStoreState) =>
  !s.aiProviderDetailMap[id];

const providerWhitelist = new Set(['ollama', 'lmstudio']);

const activeProviderKeyVaults = (s: AIProviderStoreState) => activeProviderConfig(s)?.keyVaults;

const isActiveProviderEndpointNotEmpty = (s: AIProviderStoreState) => {
  const vault = activeProviderKeyVaults(s);
  return !!vault?.baseURL || !!vault?.endpoint;
};

const isActiveProviderApiKeyNotEmpty = (s: AIProviderStoreState) => {
  const vault = activeProviderKeyVaults(s);
  return !!vault?.apiKey || !!vault?.accessKeyId || !!vault?.secretAccessKey;
};

const providerConfigById =
  (id: string) =>
  (s: AIProviderStoreState): AiProviderRuntimeConfig | undefined => {
    if (!id) return undefined;

    return s.aiProviderRuntimeConfig?.[id];
  };

const isProviderConfigUpdating = (id: string) => (s: AIProviderStoreState) =>
  s.aiProviderConfigUpdatingIds.includes(id);

/**
 * @description The conditions to enable client fetch
 * 1. If no baseUrl and apikey input, force on Server.
 * 2. If only contains baseUrl, force on Client
 * 3. Follow the user settings.
 * 4. On Server, by default.
 */
const isProviderFetchOnClient =
  (provider: GlobalLLMProviderKey | string) => (s: AIProviderStoreState) => {
    const config = providerConfigById(provider)(s);

    // If the provider already disable browser request in model config, force on Server.
    if (isProviderDisableBrowserRequest(provider)) return false;

    // If the provider in the whitelist, follow the user settings
    if (providerWhitelist.has(provider) && typeof config?.fetchOnClient !== 'undefined')
      return config?.fetchOnClient;

    // 1. If no baseUrl and apikey input, force on Server.
    const isProviderEndpointNotEmpty = !!config?.keyVaults.baseURL;
    const isProviderApiKeyNotEmpty = !!config?.keyVaults.apiKey;
    if (!isProviderEndpointNotEmpty && !isProviderApiKeyNotEmpty) return false;

    // 2. If only contains baseUrl, force on Client
    if (isProviderEndpointNotEmpty && !isProviderApiKeyNotEmpty) return true;

    // 3. Follow the user settings.
    if (typeof config?.fetchOnClient !== 'undefined') return config?.fetchOnClient;

    // 4. On Server, by default.
    return false;
  };

const providerKeyVaults = (provider: string | undefined) => (s: AIProviderStoreState) => {
  if (!provider) return undefined;

  return s.aiProviderRuntimeConfig?.[provider]?.keyVaults;
};

const isProviderHasBuiltinSearch = (provider: string) => (s: AIProviderStoreState) => {
  const config = providerConfigById(provider)(s);

  return !!config?.settings.searchMode;
};

const isProviderHasBuiltinSearchConfig = (id: string) => (s: AIProviderStoreState) => {
  const providerCfg = providerConfigById(id)(s);

  return !!providerCfg?.settings.searchMode && providerCfg?.settings.searchMode !== 'internal';
};

const isProviderEnableResponseApi = (id: string) => (s: AIProviderStoreState) => {
  const providerCfg = providerConfigById(id)(s);

  const enableResponseApi = providerCfg?.config?.enableResponseApi;

  if (typeof enableResponseApi === 'boolean') return enableResponseApi;

  return id === 'openai';
};

const isInitAiProviderRuntimeState = (s: AIProviderStoreState) => !!s.isInitAiProviderRuntimeState;

export const aiProviderSelectors = {
  activeProviderConfig,
  disabledAiProviderList,
  disabledCustomAiProviderList,
  enabledAiProviderList,
  enabledImageModelList,
  enabledVideoModelList,
  isActiveProviderApiKeyNotEmpty,
  isActiveProviderEndpointNotEmpty,
  isAiProviderConfigLoading,
  isInitAiProviderRuntimeState,
  isProviderConfigUpdating,
  isProviderEnableResponseApi,
  isProviderEnabled,
  isProviderFetchOnClient,
  isProviderHasBuiltinSearch,
  isProviderHasBuiltinSearchConfig,
  isProviderLoading,
  providerConfigById,
  providerDetailById,
  providerKeyVaults,
};
