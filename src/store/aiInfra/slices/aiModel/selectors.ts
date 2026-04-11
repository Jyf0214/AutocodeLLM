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

import { AiModelSourceEnum } from 'model-bank';

import { type AIProviderStoreState } from '@/store/aiInfra/initialState';
import { ModelSearchImplement } from '@/types/search';

const aiProviderChatModelListIds = (s: AIProviderStoreState) =>
  s.aiProviderModelList.filter((item) => item.type === 'chat').map((item) => item.id);
// List
const enabledAiProviderModelList = (s: AIProviderStoreState) =>
  s.aiProviderModelList.filter((item) => item.enabled);

const disabledAiProviderModelList = (s: AIProviderStoreState) =>
  s.aiProviderModelList.filter((item) => !item.enabled);

const filteredAiProviderModelList = (s: AIProviderStoreState) => {
  const keyword = s.modelSearchKeyword.toLowerCase().trim();

  return s.aiProviderModelList.filter(
    (model) =>
      model.id.toLowerCase().includes(keyword) ||
      model.displayName?.toLowerCase().includes(keyword),
  );
};

const totalAiProviderModelList = (s: AIProviderStoreState) => s.aiProviderModelList.length;

const isEmptyAiProviderModelList = (s: AIProviderStoreState) => totalAiProviderModelList(s) === 0;

const getModelCard = (model: string, provider: string) => (s: AIProviderStoreState) =>
  s.builtinAiModelList.find((item) => item.id === model && item.providerId === provider);

const hasRemoteModels = (s: AIProviderStoreState) =>
  s.aiProviderModelList.some((m) => m.source === AiModelSourceEnum.Remote);

const isModelEnabled = (id: string) => (s: AIProviderStoreState) =>
  enabledAiProviderModelList(s).some((i) => i.id === id);

const isModelLoading = (id: string) => (s: AIProviderStoreState) =>
  s.aiModelLoadingIds.includes(id);

const getAiModelById = (id: string) => (s: AIProviderStoreState) =>
  s.aiProviderModelList.find((i) => i.id === id);

const getEnabledModelById = (id: string, provider: string) => (s: AIProviderStoreState) =>
  s.enabledAiModels?.find((i) => i.id === id && (provider ? provider === i.providerId : true));

const isModelSupportToolUse = (id: string, provider: string) => (s: AIProviderStoreState) => {
  const model = getEnabledModelById(id, provider)(s);

  return model?.abilities?.functionCall || false;
};

const isModelSupportFiles = (id: string, provider: string) => (s: AIProviderStoreState) => {
  const model = getEnabledModelById(id, provider)(s);

  return model?.abilities?.files;
};

const isModelSupportVision = (id: string, provider: string) => (s: AIProviderStoreState) => {
  const model = getEnabledModelById(id, provider)(s);

  return model?.abilities?.vision || false;
};

const isModelSupportVideo = (id: string, provider: string) => (s: AIProviderStoreState) => {
  const model = getEnabledModelById(id, provider)(s);

  return model?.abilities?.video;
};

const isModelSupportReasoning = (id: string, provider: string) => (s: AIProviderStoreState) => {
  const model = getEnabledModelById(id, provider)(s);

  return model?.abilities?.reasoning;
};

const isModelHasContextWindowToken =
  (id: string, provider: string) => (s: AIProviderStoreState) => {
    const model = getEnabledModelById(id, provider)(s);

    return typeof model?.contextWindowTokens === 'number';
  };

const modelContextWindowTokens = (id: string, provider: string) => (s: AIProviderStoreState) => {
  const model = getEnabledModelById(id, provider)(s);

  return model?.contextWindowTokens;
};

const modelExtendParams = (id: string, provider: string) => (s: AIProviderStoreState) => {
  const model = getEnabledModelById(id, provider)(s);

  return model?.settings?.extendParams;
};

const isModelHasExtendParams = (id: string, provider: string) => (s: AIProviderStoreState) => {
  const controls = modelExtendParams(id, provider)(s);

  return !!controls && controls.length > 0;
};

const modelBuiltinSearchImpl = (id: string, provider: string) => (s: AIProviderStoreState) => {
  const model = getEnabledModelById(id, provider)(s);

  return model?.settings?.searchImpl;
};

const isModelHasBuiltinSearch = (id: string, provider: string) => (s: AIProviderStoreState) => {
  const searchImpl = modelBuiltinSearchImpl(id, provider)(s);

  return !!searchImpl;
};

const isModelBuiltinSearchInternal =
  (id: string, provider: string) =>
  (s: AIProviderStoreState): boolean => {
    const searchImpl = modelBuiltinSearchImpl(id, provider)(s);

    return searchImpl === ModelSearchImplement.Internal;
  };

const isModelHasBuiltinSearchConfig =
  (id: string, provider: string) => (s: AIProviderStoreState) => {
    const searchImpl = modelBuiltinSearchImpl(id, provider)(s);

    return (
      !!searchImpl &&
      [ModelSearchImplement.Tool, ModelSearchImplement.Params].includes(
        searchImpl as ModelSearchImplement,
      )
    );
  };

export const aiModelSelectors = {
  aiProviderChatModelListIds,
  disabledAiProviderModelList,
  enabledAiProviderModelList,
  filteredAiProviderModelList,
  getAiModelById,
  getEnabledModelById,
  getModelCard,
  hasRemoteModels,
  isEmptyAiProviderModelList,
  isModelBuiltinSearchInternal,
  isModelEnabled,
  isModelHasBuiltinSearch,
  isModelHasBuiltinSearchConfig,
  isModelHasContextWindowToken,
  isModelHasExtendParams,
  isModelLoading,
  isModelSupportFiles,
  isModelSupportReasoning,
  isModelSupportToolUse,
  isModelSupportVideo,
  isModelSupportVision,
  modelBuiltinSearchImpl,
  modelContextWindowTokens,
  modelExtendParams,
  totalAiProviderModelList,
};
