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

import { type ModelUsage } from '@lobechat/types';
import { type LobeDefaultAiModelListItem } from 'model-bank';

import { getAudioInputUnitRate, getAudioOutputUnitRate } from '@/utils/pricing';

import { getPrice } from './pricing';

const calcCredit = (token: number, pricing?: number) => {
  if (!pricing) return '-';

  return parseInt((token * pricing).toFixed(0));
};

export const getDetailsToken = (usage: ModelUsage, modelCard?: LobeDefaultAiModelListItem) => {
  const inputTextTokens = usage.inputTextTokens || (usage as any).inputTokens || 0;
  const totalInputTokens = usage.totalInputTokens || (usage as any).inputTokens || 0;

  const totalOutputTokens = usage.totalOutputTokens || (usage as any).outputTokens || 0;

  const outputReasoningTokens = usage.outputReasoningTokens || (usage as any).reasoningTokens || 0;

  const outputImageTokens = usage.outputImageTokens || (usage as any).imageTokens || 0;

  const inputToolTokens = usage.inputToolTokens || 0;

  const outputTextTokens =
    typeof usage.outputTextTokens === 'number'
      ? usage.outputTextTokens
      : Math.max(
        0,
        totalOutputTokens -
        outputReasoningTokens -
        (usage.outputAudioTokens || 0) -
        outputImageTokens,
      );

  const inputWriteCacheTokens = usage.inputWriteCacheTokens || 0;
  const inputCacheTokens = usage.inputCachedTokens || (usage as any).cachedTokens || 0;

  const inputCacheMissTokens = usage?.inputCacheMissTokens
    ? usage?.inputCacheMissTokens
    : totalInputTokens - (inputCacheTokens || 0) - inputToolTokens;

  // Pricing
  const formatPrice = getPrice(modelCard?.pricing || { units: [] });

  const inputCacheMissCredit = (
    !!inputCacheMissTokens ? calcCredit(inputCacheMissTokens, formatPrice.input) : 0
  ) as number;

  const inputCachedCredit = (
    !!inputCacheTokens ? calcCredit(inputCacheTokens, formatPrice.cachedInput) : 0
  ) as number;

  const inputWriteCachedCredit = !!inputWriteCacheTokens
    ? (calcCredit(inputWriteCacheTokens, formatPrice.writeCacheInput) as number)
    : 0;

  const totalOutputCredit = (
    !!totalOutputTokens ? calcCredit(totalOutputTokens, formatPrice.output) : 0
  ) as number;
  const totalInputCredit = (
    !!totalInputTokens ? calcCredit(totalInputTokens, formatPrice.input) : 0
  ) as number;
  const inputToolCredit = (
    !!inputToolTokens ? calcCredit(inputToolTokens, formatPrice.input) : 0
  ) as number;

  const totalCredit =
    inputCacheMissCredit +
    inputCachedCredit +
    inputWriteCachedCredit +
    inputToolCredit +
    totalOutputCredit;

  return {
    inputAudio: !!usage.inputAudioTokens
      ? {
        credit: calcCredit(usage.inputAudioTokens, getAudioInputUnitRate(modelCard?.pricing)),
        token: usage.inputAudioTokens,
      }
      : undefined,
    inputCacheMiss: !!inputCacheMissTokens
      ? { credit: inputCacheMissCredit, token: inputCacheMissTokens }
      : undefined,
    inputCached: !!inputCacheTokens
      ? { credit: inputCachedCredit, token: inputCacheTokens }
      : undefined,
    inputCachedWrite: !!inputWriteCacheTokens
      ? { credit: inputWriteCachedCredit, token: inputWriteCacheTokens }
      : undefined,
    inputCitation: !!usage.inputCitationTokens
      ? {
        credit: calcCredit(usage.inputCitationTokens, formatPrice.input),
        token: usage.inputCitationTokens,
      }
      : undefined,
    inputText: !!inputTextTokens
      ? {
        credit: calcCredit(inputTextTokens, formatPrice.input),
        token: inputTextTokens,
      }
      : undefined,
    inputTool: !!inputToolTokens
      ? {
        credit: inputToolCredit,
        token: inputToolTokens,
      }
      : undefined,

    outputAudio: !!usage.outputAudioTokens
      ? {
        credit: calcCredit(usage.outputAudioTokens, getAudioOutputUnitRate(modelCard?.pricing)),
        id: 'outputAudio',
        token: usage.outputAudioTokens,
      }
      : undefined,
    outputImage: !!outputImageTokens
      ? {
        credit: calcCredit(outputImageTokens, formatPrice.output),
        id: 'outputImage',
        token: outputImageTokens,
      }
      : undefined,
    outputReasoning: !!outputReasoningTokens
      ? {
        credit: calcCredit(outputReasoningTokens, formatPrice.output),
        token: outputReasoningTokens,
      }
      : undefined,
    outputText: !!outputTextTokens
      ? {
        credit: calcCredit(outputTextTokens, formatPrice.output),
        token: outputTextTokens,
      }
      : undefined,

    totalInput: !!totalInputTokens
      ? { credit: totalInputCredit, token: totalInputTokens }
      : undefined,
    totalOutput: !!totalOutputTokens
      ? { credit: totalOutputCredit, token: totalOutputTokens }
      : undefined,
    totalTokens: !!usage.totalTokens
      ? { credit: totalCredit, token: usage.totalTokens }
      : undefined,
  };
};
