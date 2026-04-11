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

import * as runtimeModule from '@lobechat/model-runtime';
import { type AIImageModelCard, type EnabledAiModel, type ModelParamsSchema } from 'model-bank';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  getChatModelList,
  getImageModelList,
  normalizeChatModel,
  normalizeImageModel,
} from '../action';

const createChatModel = (overrides: Partial<EnabledAiModel> = {}): EnabledAiModel => ({
  abilities: overrides.abilities ?? { functionCall: true },
  contextWindowTokens: overrides.contextWindowTokens ?? 8192,
  displayName: overrides.displayName ?? 'Chat Model',
  enabled: overrides.enabled ?? true,
  id: overrides.id ?? 'chat-model',
  providerId: overrides.providerId ?? 'openai',
  type: 'chat',
  ...overrides,
});

type ImageEnabledModel = EnabledAiModel & AIImageModelCard;

const createImageModel = (overrides: Partial<ImageEnabledModel> = {}): ImageEnabledModel => ({
  abilities: overrides.abilities ?? {},
  contextWindowTokens: overrides.contextWindowTokens,
  displayName: overrides.displayName ?? 'Image Model',
  enabled: overrides.enabled ?? true,
  id: overrides.id ?? 'image-model',
  providerId: overrides.providerId ?? 'openai',
  type: 'image',
  ...overrides,
});

describe('aiProvider action helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('normalizeChatModel', () => {
    it('fills missing optional fields with safe defaults', async () => {
      const model = createChatModel({
        abilities: undefined,
        contextWindowTokens: undefined,
        displayName: undefined,
      });

      const result = await normalizeChatModel(model);

      expect(result).toEqual({
        abilities: {},
        contextWindowTokens: undefined,
        displayName: '',
        id: 'chat-model',
      });
    });
  });

  describe('normalizeImageModel', () => {
    it('preserves inline metadata and pricing information', async () => {
      const model = createImageModel({
        abilities: { vision: true },
        contextWindowTokens: 4096,
        displayName: 'Inline Model',
        parameters: {
          prompt: { default: '' },
          size: { default: '1024x1024', enum: ['512x512', '1024x1024'] },
        } as ModelParamsSchema,
        pricing: {
          units: [{ name: 'imageGeneration', rate: 0.04, strategy: 'fixed', unit: 'image' }],
        },
      });

      const result = await normalizeImageModel(model);

      expect(result).toMatchObject({
        abilities: { vision: true },
        displayName: 'Inline Model',
        parameters: { size: { default: '1024x1024', enum: ['512x512', '1024x1024'] } },
        pricing: {
          units: [{ name: 'imageGeneration', rate: 0.04, strategy: 'fixed', unit: 'image' }],
        },
      });
    });

    it('fetches fallback description/parameters/pricing when missing', async () => {
      const fallbackSpy = vi
        .spyOn(runtimeModule, 'getModelPropertyWithFallback')
        .mockImplementation(async (_id, key) => {
          if (key === 'parameters')
            return {
              prompt: { default: '' },
              size: { default: '768x768', enum: ['512x512', '768x768'] },
            } satisfies ModelParamsSchema;
          if (key === 'pricing')
            return {
              units: [{ name: 'imageGeneration', rate: 0.02, strategy: 'fixed', unit: 'image' }],
            };
          if (key === 'description') return 'Fallback description';
          return undefined;
        });

      const model = createImageModel({
        id: 'stable-diffusion',
        providerId: 'stability',
        parameters: undefined,
        pricing: undefined,
      });

      const result = await normalizeImageModel(model);

      expect(result.parameters).toEqual({
        prompt: { default: '' },
        size: { default: '768x768', enum: ['512x512', '768x768'] },
      });
      expect(result.pricing).toEqual({
        units: [{ name: 'imageGeneration', rate: 0.02, strategy: 'fixed', unit: 'image' }],
      });
      expect(result.description).toBe('Fallback description');
      expect(fallbackSpy).toHaveBeenCalledWith('stable-diffusion', 'parameters', 'stability');
      expect(fallbackSpy).toHaveBeenCalledWith('stable-diffusion', 'pricing', 'stability');
      expect(fallbackSpy).toHaveBeenCalledWith('stable-diffusion', 'description', 'stability');
    });
  });

  describe('getChatModelList', () => {
    const chatModels = [
      createChatModel({ id: 'gpt-4', providerId: 'openai', displayName: 'GPT-4' }),
      createChatModel({ id: 'gpt-3.5', providerId: 'openai', displayName: 'GPT-3.5' }),
      createChatModel({ id: 'claude-3', providerId: 'anthropic', displayName: 'Claude 3' }),
    ];

    it('filters by provider and deduplicates IDs', async () => {
      const duplicated = [
        ...chatModels,
        createChatModel({ id: 'gpt-4', providerId: 'openai', displayName: 'GPT-4 Duplicate' }),
      ];

      const result = await getChatModelList(duplicated, 'openai');

      expect(result).toHaveLength(2);
      expect(result.map((m) => m.id)).toEqual(['gpt-4', 'gpt-3.5']);
      expect(result[0].displayName).toBe('GPT-4');
    });

    it('returns empty array when provider has no chat models', async () => {
      const result = await getChatModelList(chatModels, 'nonexistent');
      expect(result).toEqual([]);
    });
  });

  describe('getImageModelList', () => {
    const imageModels = [
      createImageModel({ id: 'dall-e-3', providerId: 'openai', displayName: 'DALL-E 3' }),
      createImageModel({ id: 'midjourney', providerId: 'midjourney', displayName: 'Midjourney' }),
    ];

    it('collects normalized image models for a provider', async () => {
      const result = await getImageModelList(imageModels, 'openai');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('dall-e-3');
      expect(result[0].displayName).toBe('DALL-E 3');
    });

    it('returns empty array when provider has no image models', async () => {
      const result = await getImageModelList(imageModels, 'unknown');
      expect(result).toEqual([]);
    });
  });
});
