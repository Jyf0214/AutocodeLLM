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

import { type EnabledAiModel } from 'model-bank';

import {
  type AiProviderDetailItem,
  type AiProviderListItem,
  type AiProviderRuntimeConfig,
  type EnabledProvider,
  type EnabledProviderWithModels,
} from '@/types/aiProvider';

export interface AIProviderState {
  activeAiProvider?: string;
  activeProviderModelList: any[];
  aiProviderConfigUpdatingIds: string[];
  /**
   * Map of provider id to provider detail, used for caching provider details
   * to avoid data inconsistency when switching providers
   */
  aiProviderDetailMap: Record<string, AiProviderDetailItem>;
  aiProviderList: AiProviderListItem[];
  aiProviderLoadingIds: string[];
  aiProviderRuntimeConfig: Record<string, AiProviderRuntimeConfig>;
  enabledAiModels?: EnabledAiModel[];
  enabledAiProviders?: EnabledProvider[];
  // used for select
  enabledChatModelList?: EnabledProviderWithModels[];
  enabledImageModelList?: EnabledProviderWithModels[];
  enabledVideoModelList?: EnabledProviderWithModels[];
  initAiProviderList: boolean;
  isInitAiProviderRuntimeState: boolean;
  providerSearchKeyword: string;
}

export const initialAIProviderState: AIProviderState = {
  activeProviderModelList: [],
  aiProviderConfigUpdatingIds: [],
  aiProviderDetailMap: {},
  aiProviderList: [],
  aiProviderLoadingIds: [],
  aiProviderRuntimeConfig: {},
  initAiProviderList: false,
  isInitAiProviderRuntimeState: false,
  providerSearchKeyword: '',
};
