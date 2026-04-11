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
import { describe, expect, it } from 'vitest';

import { type AIProviderStoreState } from '@/store/aiInfra/initialState';

import { aiModelSelectors } from './selectors';

describe('aiModelSelectors', () => {
  const mockState: AIProviderStoreState = {
    aiProviderModelList: [
      {
        id: 'model1',
        type: 'chat',
        enabled: true,
        displayName: 'Model One',
      },
      {
        id: 'model2',
        type: 'chat',
        enabled: false,
        displayName: 'Model Two',
      },
      {
        id: 'model3',
        type: 'embedding',
        enabled: true,
        displayName: 'Model Three',
      },
      {
        id: 'model4',
        type: 'chat',
        enabled: true,
        source: AiModelSourceEnum.Remote,
        displayName: 'Remote Model',
      },
    ],
    builtinAiModelList: [],
    modelSearchKeyword: '',
    aiModelLoadingIds: ['model2'],
    enabledAiModels: [
      {
        id: 'model1',
        providerId: 'provider1',
        abilities: {
          functionCall: true,
          vision: true,
          reasoning: true,
        },
        contextWindowTokens: 4000,
        type: 'chat',
      },
      {
        id: 'model4',
        providerId: 'provider2',
        abilities: {
          functionCall: false,
          vision: false,
          reasoning: false,
        },
        type: 'chat',
      },
    ],
    activeProviderModelList: [],
    aiProviderConfigUpdatingIds: [],
    aiProviderDetailMap: {},
    aiProviderList: [],
    aiProviderLoadingIds: [],
    providerSearchKeyword: '',
    aiProviderRuntimeConfig: {},
    initAiProviderList: false,
    isInitAiProviderRuntimeState: false,
  };

  describe('aiProviderChatModelListIds', () => {
    it('should return ids of chat type models', () => {
      const result = aiModelSelectors.aiProviderChatModelListIds(mockState);
      expect(result).toEqual(['model1', 'model2', 'model4']);
    });
  });

  describe('enabledAiProviderModelList', () => {
    it('should return enabled models', () => {
      const result = aiModelSelectors.enabledAiProviderModelList(mockState);
      expect(result).toHaveLength(3);
      expect(result.map((m) => m.id)).toEqual(['model1', 'model3', 'model4']);
    });
  });

  describe('disabledAiProviderModelList', () => {
    it('should return disabled models', () => {
      const result = aiModelSelectors.disabledAiProviderModelList(mockState);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('model2');
    });
  });

  describe('filteredAiProviderModelList', () => {
    it('should filter models by id', () => {
      const state = { ...mockState, modelSearchKeyword: 'model1' };
      const result = aiModelSelectors.filteredAiProviderModelList(state);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('model1');
    });

    it('should filter models by display name', () => {
      const state = { ...mockState, modelSearchKeyword: 'remote' };
      const result = aiModelSelectors.filteredAiProviderModelList(state);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('model4');
    });

    it('should handle empty keyword', () => {
      const result = aiModelSelectors.filteredAiProviderModelList(mockState);
      expect(result).toHaveLength(mockState.aiProviderModelList.length);
    });
  });

  describe('totalAiProviderModelList', () => {
    it('should return total number of models', () => {
      const result = aiModelSelectors.totalAiProviderModelList(mockState);
      expect(result).toBe(4);
    });
  });

  describe('isEmptyAiProviderModelList', () => {
    it('should return true when list is empty', () => {
      const state = { ...mockState, aiProviderModelList: [] };
      const result = aiModelSelectors.isEmptyAiProviderModelList(state);
      expect(result).toBe(true);
    });

    it('should return false when list is not empty', () => {
      const result = aiModelSelectors.isEmptyAiProviderModelList(mockState);
      expect(result).toBe(false);
    });
  });

  describe('hasRemoteModels', () => {
    it('should return true when remote models exist', () => {
      const result = aiModelSelectors.hasRemoteModels(mockState);
      expect(result).toBe(true);
    });

    it('should return false when no remote models exist', () => {
      const state = {
        ...mockState,
        aiProviderModelList: mockState.aiProviderModelList.filter(
          (m) => !('source' in m) || m.source !== AiModelSourceEnum.Remote,
        ),
      };
      const result = aiModelSelectors.hasRemoteModels(state);
      expect(result).toBe(false);
    });
  });

  describe('isModelEnabled', () => {
    it('should return true for enabled model', () => {
      const result = aiModelSelectors.isModelEnabled('model1')(mockState);
      expect(result).toBe(true);
    });

    it('should return false for disabled model', () => {
      const result = aiModelSelectors.isModelEnabled('model2')(mockState);
      expect(result).toBe(false);
    });
  });

  describe('isModelLoading', () => {
    it('should return true for loading model', () => {
      const result = aiModelSelectors.isModelLoading('model2')(mockState);
      expect(result).toBe(true);
    });

    it('should return false for non-loading model', () => {
      const result = aiModelSelectors.isModelLoading('model1')(mockState);
      expect(result).toBe(false);
    });
  });

  describe('getAiModelById', () => {
    it('should return model by id', () => {
      const result = aiModelSelectors.getAiModelById('model1')(mockState);
      expect(result).toBeDefined();
      expect(result?.id).toBe('model1');
    });

    it('should return undefined for non-existent model', () => {
      const result = aiModelSelectors.getAiModelById('nonexistent')(mockState);
      expect(result).toBeUndefined();
    });
  });

  describe('model capability checks', () => {
    it('should check tool use support', () => {
      expect(aiModelSelectors.isModelSupportToolUse('model1', 'provider1')(mockState)).toBe(true);
      expect(aiModelSelectors.isModelSupportToolUse('model4', 'provider2')(mockState)).toBe(false);
    });

    it('should check vision support', () => {
      expect(aiModelSelectors.isModelSupportVision('model1', 'provider1')(mockState)).toBe(true);
      expect(aiModelSelectors.isModelSupportVision('model4', 'provider2')(mockState)).toBe(false);
    });

    it('should check reasoning support', () => {
      expect(aiModelSelectors.isModelSupportReasoning('model1', 'provider1')(mockState)).toBe(true);
      expect(aiModelSelectors.isModelSupportReasoning('model4', 'provider2')(mockState)).toBe(
        false,
      );
    });
  });

  describe('context window checks', () => {
    it('should check if model has context window tokens', () => {
      expect(aiModelSelectors.isModelHasContextWindowToken('model1', 'provider1')(mockState)).toBe(
        true,
      );
      expect(aiModelSelectors.isModelHasContextWindowToken('model4', 'provider2')(mockState)).toBe(
        false,
      );
    });

    it('should get model context window tokens', () => {
      expect(aiModelSelectors.modelContextWindowTokens('model1', 'provider1')(mockState)).toBe(
        4000,
      );
      expect(
        aiModelSelectors.modelContextWindowTokens('model4', 'provider2')(mockState),
      ).toBeUndefined();
    });
  });
});
